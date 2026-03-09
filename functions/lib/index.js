"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeApartmentData = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const genai_1 = require("@google/genai");
const schema_1 = require("./schema");
admin.initializeApp();
const db = admin.firestore();
const AI_MODEL = "gemini-2.5-flash-lite"; // Faster and cheaper for structured extraction
const DAILY_LIMIT = 20;
exports.analyzeApartmentData = (0, https_1.onCall)({
    secrets: ["GEMINI_API_KEY"],
    region: "europe-west1",
    maxInstances: 10,
    invoker: "public"
}, async (request) => {
    // Initialize the Gemini client here so process.env.GEMINI_API_KEY is available during execution.
    const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const uid = request.auth?.uid;
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "User must be logged in.");
    }
    const data = request.data;
    if (!data.text && !data.imageBase64) {
        throw new https_1.HttpsError("invalid-argument", "Provide either text or imageBase64");
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
            throw new https_1.HttpsError("resource-exhausted", `Daily limit of ${DAILY_LIMIT} AI imports reached.`);
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
You are an expert Israeli real estate assistant. Extract apartment details from the provided Hebrew content.
Follow these extremely strict rules to ensure no data is lost:
1. "ללא תיווך" means NO broker -> \`brokerFee: false\`. If there is a broker/תיווך -> \`brokerFee: true\`.
2. Prices and Costs: "ועד בית" -> extract realistic monthly cost for \`vaad\` (e.g. 50-2000). "ארנונה" -> extract realistic cost for \`arnona\`. Ignore long ID/barcode numbers (e.g., "0000000006").
3. Dates: "כניסה" -> extract condition (e.g., "מיידי", "1.4", "גמיש", "תאריך קרוב") into \`entranceDate\`.
4. Direction: "עורפית" -> \`rearFacing: true\`. "חזית" -> \`frontFacing: true\`.
5. Features: "מזגן" -> \`ac: true\`, "מרפסת" -> \`balcony: true\`, "חניה" -> \`parking: true\`, "מותר בעלי חיים" / "בע"ח" / "כלב" / "חתול" -> \`pets: true\`, "מעלית" -> \`elevator: true\`, "מרוהט" -> \`furnished: true\`. "מקלט" or "ממד" or "ממ"ק" -> \`tama38: true\` (represents safe room). Watch for combinations.
6. Rooms and Floor: "קומה X" -> \`floor: X\` (extract the number, if "קרקע" -> 0). "X חדרים" -> \`rooms: X\`.
7. Phone Numbers: Extract ONLY digits for \`ownerPhone\` (e.g., "0524825881"). Ignore spaces/dashes. Check the end of text!
8. CRITICAL: Any extra details like purchasing furniture ("מוכרים כמה רהיטים/עדיפות לקנייה"), viewing times ("מראים את הדירה..."), "מחפשים מחליפים" (sublet/replacing tenant), number of toilets/showers ("2 שירותים + מקלחת"), lease conditions, or things the AI schema doesn't strictly cover MUST be put into the \`notes\` field. DO NOT DROP DATA!
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
        const validatedData = schema_1.apartmentSchema.parse(parsedJson);
        // Note: The transaction above already updated the limit, we don't need to do it here again.
        return validatedData;
    }
    catch (error) {
        console.error("Gemini Extraction Error:", error);
        if (error instanceof https_1.HttpsError) {
            throw error; // Re-throw our own rate limit error
        }
        throw new https_1.HttpsError("internal", "An error occurred during extraction. Please try again later.");
    }
});
//# sourceMappingURL=index.js.map