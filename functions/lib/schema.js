"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiResponseSchema = exports.apartmentSchema = void 0;
const zod_1 = require("zod");
exports.apartmentSchema = zod_1.z.object({
    address: zod_1.z.string().nullable().optional().describe("The street address of the apartment. Extract city if possible."),
    neighborhood: zod_1.z.string().nullable().optional().describe("The neighborhood the apartment is in. E.g. if the text mentions 'שכונת תל חיים', output 'תל חיים'."),
    price: zod_1.z.number().nullable().optional().describe("Extract the monthly rental price as an integer. Strip all currency symbols (₪, שח). If the price is stated in thousands colloquially (e.g., '4.5 אלף' or '4500 שח'), output 4500. Ensure you do not confuse the base rental price with the Arnona tax value."),
    rooms: zod_1.z.number().nullable().optional().describe("Extract the total number of rooms as a float. Interpret textual Hebrew numbers ('שלושה') as integers. Include half rooms ('חצי'). If the text says 'סטודיו' (Studio), output 1. The living room ('סלון') is inherently counted in the total room count; do not add +1 to the stated total unless explicitly stated as 'X rooms + salon'."),
    floor: zod_1.z.number().nullable().optional().describe("Extract the floor level as an integer. CRITICAL: 'קומת קרקע' (Ground) or 'פרטר' (Parter) MUST strictly evaluate to the number 0. 'מרתף' (Basement) MUST evaluate to -1. 'קומה ראשונה עמודים' is floor 1. If a range is given (e.g., 3 out of 5), extract only the property's specific floor (3)."),
    size: zod_1.z.number().nullable().optional().describe("Extract the property size in square meters (מ\"ר, מטר, שטח, מטראז') as an integer. Strip text, leave only the number."),
    elevator: zod_1.z.boolean().nullable().optional().describe("Set to true if 'מעלית' is mentioned. Set to false ONLY if explicitly denied ('ללא מעלית', 'אין מעלית'). Otherwise, return null."),
    parking: zod_1.z.boolean().nullable().optional().describe("Set to true if 'חניה' or 'חניון' is mentioned. Set to false ONLY if explicitly denied ('ללא חניה', 'אין חניה'). Otherwise, return null."),
    balcony: zod_1.z.boolean().nullable().optional().describe("Set to true if 'מרפסת' is mentioned. Set to false ONLY if explicitly denied ('ללא מרפסת', 'אין מרפסת'). Otherwise, return null."),
    ac: zod_1.z.boolean().nullable().optional().describe("Set to true if 'מזגן' or 'מיזוג' is mentioned. Set to false ONLY if explicitly denied ('ללא מזגן', 'אין מזגן'). Otherwise, return null."),
    tama38: zod_1.z.boolean().nullable().optional().describe("True if 'ממ\"ד' (Mamad) is explicitly mentioned. False ONLY if explicitly stated there is no Mamad. Otherwise, return null. (Note: Miklat/Mamak are NOT Mamad)."),
    pets: zod_1.z.boolean().nullable().optional().describe("True if pets are allowed ('חיות מחמד', 'בעלי חיים'). False ONLY if explicitly denied ('ללא בעלי חיים', 'אסור חיות'). Otherwise, return null."),
    renovated: zod_1.z.boolean().nullable().optional().describe("True if 'משופץ' is mentioned. False ONLY if explicitly stated it needs renovation. Otherwise, return null."),
    furnished: zod_1.z.boolean().nullable().optional().describe("True if furnished ('מרוהט'). False ONLY if explicitly stated empty/unfurnished ('ללא ריהוט', 'ריקה'). Otherwise, return null."),
    rearFacing: zod_1.z.boolean().nullable().optional().describe("True if the apartment is rear-facing (עורפית)."),
    frontFacing: zod_1.z.boolean().nullable().optional().describe("True if the apartment is front-facing (חזית)."),
    brokerFee: zod_1.z.boolean().nullable().optional().describe("CRITICAL: If the text indicates NO broker fee ('ללא תיווך', 'פרטי', 'מפרטי'), you MUST output explicitly false. Set to true if a professional broker is involved ('מתווך', 'עמלת תיווך')."),
    vaad: zod_1.z.number().nullable().optional().describe("Integer. The homeowners association or building management fee. Look for the keywords 'ועד בית', 'ועד', or 'דמי ניהול'."),
    arnona: zod_1.z.number().nullable().optional().describe("Integer. The municipal property tax value. DO NOT extract dates like '1.9' into this field under any circumstances. Look for the keywords 'ארנונה' or 'ארנ'. Output the exact stated raw numeric value without attempting to calculate monthly equivalents."),
    entranceDate: zod_1.z.string().nullable().optional().describe("String representing the move-in date. E.g., 'מיידי' (Immediate) or 'גמיש' (Flexible). Critically: The decimal string '1.9' or '1/9' refers to September 1st (a temporal date). Map '1.9' to this entranceDate field exclusively; never to financial fields."),
    notes: zod_1.z.string().nullable().optional().describe("A concise, synthesized string capturing any important requirements, contractual nuances, or unmapped features not covered by other fields (e.g., 'No pets allowed', 'Requires 2 guarantors'). Do not repeat data already captured in booleans or numbers."),
    ownerName: zod_1.z.string().nullable().optional().describe("The name of the person publishing the ad (landlord, current tenant, or agent)."),
    ownerPhone: zod_1.z.string().nullable().optional().describe("The phone number to contact. Usually 10 digits starting with 05. Extract only the digits."),
    inferredCustomFeatures: zod_1.z.array(zod_1.z.string()).nullable().optional().describe("An array of other specifically inferred features. Items MUST be the EXACT Hebrew phrases found in text, e.g. ['דוד שמש', 'סורגים', 'חצר', 'מקלט בבניין', 'כולל הכל']. Map uniquely localized architectural features here. Only add items if explicitly mentioned.")
});
exports.geminiResponseSchema = {
    type: "OBJECT",
    properties: {
        address: { type: "STRING", description: "The street address of the apartment. Extract city if possible.", nullable: true },
        neighborhood: { type: "STRING", description: "The neighborhood the apartment is in. E.g. if the text mentions 'שכונת תל חיים', output 'תל חיים'.", nullable: true },
        price: { type: "NUMBER", description: "Extract the monthly rental price as an integer. Strip all currency symbols (₪, שח). If the price is stated in thousands colloquially (e.g., '4.5 אלף' or '4500 שח'), output 4500. Ensure you do not confuse the base rental price with the Arnona tax value.", nullable: true },
        rooms: { type: "NUMBER", description: "Extract the total number of rooms as a float. Interpret textual Hebrew numbers ('שלושה') as integers. Include half rooms ('חצי'). If the text says 'סטודיו' (Studio), output 1. The living room ('סלון') is inherently counted in the total room count; do not add +1 to the stated total.", nullable: true },
        floor: { type: "NUMBER", description: "Extract the floor level as an integer. CRITICAL: 'קומת קרקע' (Ground) or 'פרטר' (Parter) MUST strictly evaluate to the number 0. 'מרתף' (Basement) MUST evaluate to -1. If a range is given, extract only the specific floor.", nullable: true },
        size: { type: "NUMBER", description: "Extract the property size in square meters (מ\"ר, מטר, שטח, מטראז') as an integer. Strip text, leave only the number.", nullable: true },
        elevator: { type: "BOOLEAN", description: "Set to true if 'מעלית' is mentioned. Set to false ONLY if explicitly denied ('ללא מעלית', 'אין מעלית'). Otherwise, return null.", nullable: true },
        parking: { type: "BOOLEAN", description: "Set to true if 'חניה' or 'חניון' is mentioned. Set to false ONLY if explicitly denied ('ללא חניה', 'אין חניה'). Otherwise, return null.", nullable: true },
        balcony: { type: "BOOLEAN", description: "Set to true if 'מרפסת' is mentioned. Set to false ONLY if explicitly denied ('ללא מרפסת', 'אין מרפסת'). Otherwise, return null.", nullable: true },
        ac: { type: "BOOLEAN", description: "Set to true if 'מזגן' or 'מיזוג' is mentioned. Set to false ONLY if explicitly denied ('ללא מזגן', 'אין מזגן'). Otherwise, return null.", nullable: true },
        tama38: { type: "BOOLEAN", description: "True if 'ממ\"ד' (Mamad) is explicitly mentioned. False ONLY if explicitly stated there is no Mamad. Otherwise, return null. (Note: Miklat/Mamak are NOT Mamad).", nullable: true },
        pets: { type: "BOOLEAN", description: "True if pets are allowed ('חיות מחמד', 'בעלי חיים'). False ONLY if explicitly denied ('ללא בעלי חיים', 'אסור חיות'). Otherwise, return null.", nullable: true },
        renovated: { type: "BOOLEAN", description: "True if 'משופץ' is mentioned. False ONLY if explicitly stated it needs renovation. Otherwise, return null.", nullable: true },
        furnished: { type: "BOOLEAN", description: "True if furnished ('מרוהט'). False ONLY if explicitly stated empty/unfurnished ('ללא ריהוט', 'ריקה'). Otherwise, return null.", nullable: true },
        rearFacing: { type: "BOOLEAN", description: "True if the apartment is rear-facing (עורפית).", nullable: true },
        frontFacing: { type: "BOOLEAN", description: "True if the apartment is front-facing (חזית).", nullable: true },
        brokerFee: { type: "BOOLEAN", description: "CRITICAL: If the text indicates NO broker fee ('ללא תיווך', 'פרטי', 'מפרטי'), you MUST output explicitly false. Set to true if a professional broker is involved ('מתווך', 'עמלת תיווך').", nullable: true },
        vaad: { type: "NUMBER", description: "Integer. The homeowners association or building management fee. Look for the keywords 'ועד בית', 'ועד', or 'דמי ניהול'.", nullable: true },
        arnona: { type: "NUMBER", description: "Integer. The municipal property tax value. DO NOT extract dates like '1.9' into this field. Look for 'ארנונה' or 'ארנ'. Output raw numeric value.", nullable: true },
        entranceDate: { type: "STRING", description: "String representing the move-in date. E.g., 'מיידי' (Immediate) or 'גמיש' (Flexible). Critically: The decimal string '1.9' or '1/9' refers to September 1st (a temporal date). Map '1.9' to this entranceDate field exclusively.", nullable: true },
        notes: { type: "STRING", description: "A concise, synthesized string capturing any important requirements, contractual nuances, or unmapped features not covered by other fields (e.g., 'No pets allowed', 'Requires 2 guarantors'). Do not repeat data already captured.", nullable: true },
        ownerName: { type: "STRING", description: "The name of the person publishing the ad (landlord, current tenant, or agent).", nullable: true },
        ownerPhone: { type: "STRING", description: "The phone number to contact. Usually 10 digits starting with 05. Extract only the digits.", nullable: true },
        inferredCustomFeatures: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "An array of exact Hebrew phrases for unique localized features found in the text, e.g. ['דוד שמש', 'סורגים', 'חצר', 'מקלט בבניין', 'כולל הכל']. Map uniquely localized architectural features here.",
            nullable: true
        }
    },
    required: ["address", "price", "rooms"]
};
//# sourceMappingURL=schema.js.map