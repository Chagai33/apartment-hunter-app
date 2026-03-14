import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenAI } from '@google/genai';
import { apartmentSchema, geminiResponseSchema } from './schema';
import { getGeminiSystemPrompt } from './prompts';

admin.initializeApp();
const db = admin.firestore();

const AI_MODEL = "gemini-2.5-pro"; // Powerful and accurate for precise structured extraction

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
        let promptText = getGeminiSystemPrompt(data.customCheckLabels);

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

        // 3. Call Gemini API (with fallback mechanism)
        try {
            let rawResponseText: string | undefined = undefined;
            let finalModelUsed = AI_MODEL;

            try {
                const response = await ai.models.generateContent({
                    model: AI_MODEL,
                    contents: promptParams,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: geminiResponseSchema
                    }
                });
                rawResponseText = response.text;
            } catch (error: any) {
                console.warn(`Primary model ${AI_MODEL} failed, falling back. Error:`, error?.message || error);
                
                const FALLBACK_MODEL = "gemini-1.5-pro"; // Reliable fallback
                finalModelUsed = FALLBACK_MODEL;
                console.log(`Executing fallback with model: ${FALLBACK_MODEL}`);
                
                const fallbackResponse = await ai.models.generateContent({
                    model: FALLBACK_MODEL,
                    contents: promptParams,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: geminiResponseSchema
                    }
                });
                rawResponseText = fallbackResponse.text;
            }

            if (!rawResponseText) {
                throw new Error(`No text returned from Gemini (using model ${finalModelUsed})`);
            }
            
            console.log("RAW GEMINI RESPONSE TEXT:", rawResponseText);

            // Parse response and ideally validate with our Zod schema
            const parsedJson = JSON.parse(rawResponseText);
            console.log("PARSED JSON DATA:", JSON.stringify(parsedJson, null, 2));
            
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
