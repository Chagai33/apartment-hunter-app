import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenAI } from '@google/genai';
import { apartmentSchema } from './schema';

admin.initializeApp();
const db = admin.firestore();

const AI_MODEL = "gemini-2.5-flash-lite"; // Faster and cheaper for structured extraction

const DAILY_LIMIT = 20;

export const analyzeApartmentData = onCall(
    {
        secrets: ["GEMINI_API_KEY"],
        region: "europe-west1",
        maxInstances: 10,
        invoker: "public"
    },
    async (request) => {
        // Initialize the Gemini client here so process.env.GEMINI_API_KEY is available during execution.
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const uid = request.auth?.uid;
        if (!uid) {
            throw new HttpsError("unauthenticated", "User must be logged in.");
        }

        const data = request.data as { text?: string; imageBase64?: string; mimeType?: string; customCheckLabels?: string[] };
        if (!data.text && !data.imageBase64) {
            throw new HttpsError("invalid-argument", "Provide either text or imageBase64");
        }

        // 1. Check Rate Limit (Using Transaction for Concurrency)
        const usageRef = db.doc(`users/${uid}/usageData/ai_imports`);
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' }); // YYYY-MM-DD in Israel time
        let currentUsage = 0;
        await db.runTransaction(async (t) => {
            const usageSnap = await t.get(usageRef);
            if (usageSnap.exists) {
                const usageData = usageSnap.data();
                if (usageData && usageData.date === todayStr) {
                    currentUsage = usageData.count || 0;
                }
            }

            if (currentUsage >= DAILY_LIMIT) {
                throw new HttpsError("resource-exhausted", `Daily limit of ${DAILY_LIMIT} AI imports reached.`);
            }

            t.set(usageRef, {
                date: todayStr,
                count: currentUsage + 1,
                lastUsedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });

        // 2. Prepare Gemini Prompt
        const promptParams = [];

        let promptText = `
You are an expert Israeli real estate assistant. Extract apartment details extremely accurately from the provided Hebrew content.
STRICT ANTI-HALLUCINATION RULES:
- ONLY extract information explicitly stated in the text. NEVER infer, guess, or assume features (like elevator, ac, or parking).
- If a boolean feature is NOT mentioned, you MUST OMIT IT entirely (leave it undefined/null). Do not set to true or false unless explicit.

Specific Extraction Rules:
1. Brokerage ("תיווך"): "ללא תיווך" (even with punctuation like "ללא תיווך!") means NO broker -> \`brokerFee: false\`. If there is a broker explicitly mentioned -> \`brokerFee: true\`.
2. Prices and Costs: "ועד בית" -> extract realistic monthly cost for \`vaad\`. "ארנונה" -> extract realistic cost for \`arnona\`. Ignore long ID/barcode numbers.
3. Dates: "כניסה" -> extract condition (e.g., "מיידי", "1.4", "גמיש") into \`entranceDate\`.
4. Direction: "עורפית" -> \`rearFacing: true\`. "חזית" -> \`frontFacing: true\`.
5. Features: Look for explicit Hebrew words. "מזגן" -> \`ac: true\`, "מרפסת" -> \`balcony: true\`, "חניה" -> \`parking: true\`, "מותר בעלי חיים"/"בע"ח"/"כלב"/"חתול" -> \`pets: true\`, "מעלית" -> \`elevator: true\`, "מרוהט" -> \`furnished: true\`. "מקלט" or "ממד" or "ממ"ק" -> \`tama38: true\`.
6. Rooms and Floor: 
   - "קומה X" -> \`floor: X\`. "קומת קרקע" or "קרקע" -> \`floor: 0\`. If "מרתף", try \`-1\`.
   - "X חדרים" -> \`rooms: X\`. "סטודיו" or "דירת סטודיו" -> \`rooms: 1\` (or 1.5 if specified).
7. Location: Extract the exact neighborhood name without prefixes like "שכונת " (e.g., "שכונת תל חיים" -> \`neighborhood: "תל חיים"\`).
8. Phone Numbers: Extract ONLY digits for \`ownerPhone\` (e.g., "0524825881"). Ignore spaces/dashes. Look at the end of the text and inside images.
9. CATCH-ALL FOR MISSING SCHEMA FIELDS (CRITICAL):
   Any feature that does not map to a strict schema field MUST be placed in \`notes\` or \`inferredCustomChecks\`. 
   MANDATORY Notes Examples: "קודן בכניסה", "חצר", "גינה", "כולל הכל" (bills included), "כולל מים וארנונה", "מרפסת גג", "סורגים", "דוד שמש", "מחפשים מחליפים" (sublet).
   DO NOT DROP ANY APARTMENT FEATURE, RULE, OR CONDITION. If it's not a standard boolean, put it in notes!
`;
        if (data.customCheckLabels && data.customCheckLabels.length > 0) {
            promptText += `\n\nAlso check if the following features are present (return in 'inferredCustomChecks'): ${data.customCheckLabels.join(', ')}. Only include them if explicitly mentioned or strongly implied.`;
        }

        if (data.text) {
            promptText += `\n\nText Content:\n${data.text}`;
        }

        promptParams.push(promptText);

        if (data.imageBase64 && data.mimeType) {
            // F3: Strip base64 prefix if present
            const cleanBase64 = data.imageBase64.replace(/^data:image\/\w+;base64,/, "");
            promptParams.push({
                inlineData: {
                    data: cleanBase64,
                    mimeType: data.mimeType
                }
            });
        }

        // 3. Call Gemini API
        try {
            const response = await ai.models.generateContent({
                model: AI_MODEL,
                contents: promptParams,
                config: {
                    responseMimeType: "application/json",
                    // Use zod to generate the JSON schema for Gemini
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            address: { type: "STRING", nullable: true },
                            neighborhood: { type: "STRING", nullable: true },
                            price: { type: "NUMBER", nullable: true },
                            rooms: { type: "NUMBER", nullable: true },
                            floor: { type: "NUMBER", nullable: true },
                            size: { type: "NUMBER", nullable: true },
                            elevator: { type: "BOOLEAN", nullable: true },
                            parking: { type: "BOOLEAN", nullable: true },
                            balcony: { type: "BOOLEAN", nullable: true },
                            ac: { type: "BOOLEAN", nullable: true },
                            tama38: { type: "BOOLEAN", nullable: true },
                            pets: { type: "BOOLEAN", nullable: true },
                            furnished: { type: "BOOLEAN", nullable: true },
                            rearFacing: { type: "BOOLEAN", nullable: true },
                            frontFacing: { type: "BOOLEAN", nullable: true },
                            brokerFee: { type: "BOOLEAN", nullable: true },
                            vaad: { type: "NUMBER", nullable: true },
                            arnona: { type: "NUMBER", nullable: true },
                            entranceDate: { type: "STRING", nullable: true },
                            notes: { type: "STRING", nullable: true },
                            ownerName: { type: "STRING", nullable: true },
                            ownerPhone: { type: "STRING", nullable: true },
                            inferredCustomChecks: {
                                type: "OBJECT",
                                nullable: true
                            }
                        },
                        required: ["address", "price", "rooms"]
                    }
                }
            });

            const rawResponseText = response.text;
            if (!rawResponseText) {
                throw new Error("No text returned from Gemini");
            }

            // Parse response and ideally validate with our Zod schema
            const parsedJson = JSON.parse(rawResponseText);
            const validatedData = apartmentSchema.parse(parsedJson);

            // Note: The transaction above already updated the limit, we don't need to do it here again.

            return validatedData;

        } catch (error) {
            console.error("Gemini Extraction Error:", error);
            if (error instanceof HttpsError) {
                throw error; // Re-throw our own rate limit error
            }
            throw new HttpsError("internal", "An error occurred during extraction. Please try again later.");
        }
    }
);
