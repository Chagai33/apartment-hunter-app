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
const prompts_1 = require("./prompts");
admin.initializeApp();
const db = admin.firestore();
const AI_MODEL = "gemini-2.5-pro"; // Powerful and accurate for precise structured extraction
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
    let promptText = (0, prompts_1.getGeminiSystemPrompt)(data.customCheckLabels);
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
        let rawResponseText = undefined;
        let finalModelUsed = AI_MODEL;
        try {
            const response = await ai.models.generateContent({
                model: AI_MODEL,
                contents: promptParams,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema_1.geminiResponseSchema
                }
            });
            rawResponseText = response.text;
        }
        catch (error) {
            console.warn(`Primary model ${AI_MODEL} failed, falling back. Error:`, error?.message || error);
            const FALLBACK_MODEL = "gemini-1.5-pro"; // Reliable fallback
            finalModelUsed = FALLBACK_MODEL;
            console.log(`Executing fallback with model: ${FALLBACK_MODEL}`);
            const fallbackResponse = await ai.models.generateContent({
                model: FALLBACK_MODEL,
                contents: promptParams,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema_1.geminiResponseSchema
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