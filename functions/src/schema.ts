import { z } from 'zod';

export const apartmentSchema = z.object({
    address: z.string().nullable().optional().describe("The street address of the apartment. Extract city if possible."),
    neighborhood: z.string().nullable().optional().describe("The neighborhood the apartment is in."),
    price: z.number().nullable().optional().describe("Extract the monthly rental price as an integer. Strip all currency symbols (₪, שח). If the price is stated in thousands colloquially (e.g., '4.5 אלף' or '4500 שח'), output 4500. Ensure you do not confuse the base rental price with the Arnona tax value."),
    rooms: z.number().nullable().optional().describe("Extract the total number of rooms as a float. Interpret textual Hebrew numbers ('שלושה') as integers. Include half rooms ('חצי'). If the text says 'סטודיו' (Studio), output 1. The living room ('סלון') is inherently counted in the total room count; do not add +1 to the stated total unless explicitly stated as 'X rooms + salon'."),
    floor: z.number().nullable().optional().describe("Extract the floor level as an integer. 'קומת קרקע' (Ground) or 'פרטר' (Parter) must strictly evaluate to 0. 'מרתף' (Basement) must evaluate to -1. 'קומה ראשונה עמודים' is floor 1. If a range is given (e.g., 3 out of 5), extract only the property's specific floor (3)."),
    size: z.number().nullable().optional().describe("Extract the property size in square meters (מ\"ר, מטר, שטח, מטראז') as an integer. Strip text, leave only the number."),
    elevator: z.boolean().nullable().optional().describe("Set to true if 'מעלית', 'מעליות', or 'מעלית שבת' is mentioned in the text. False otherwise."),
    parking: z.boolean().nullable().optional().describe("Set to true if 'חניה', 'חנייה', 'חניה פרטית', 'חניה מקורה', 'חניה בטאבו', or 'חניון' is mentioned. False otherwise."),
    balcony: z.boolean().nullable().optional().describe("Set to true if 'מרפסת', 'מרפסת שמש', or 'מרפסת סוכה' is mentioned. False otherwise."),
    ac: z.boolean().nullable().optional().describe("Set to true if 'מזגן', 'מיזוג', 'ממוזג', 'מיני מרכזי', or 'VRF' is mentioned. False otherwise."),
    tama38: z.boolean().nullable().optional().describe("Boolean. Set to true ONLY if the text explicitly mentions 'ממ\"ד' (Mamad) or 'מרחב מוגן דירתי'. Set to false if it mentions 'מקלט' (Miklat - shared shelter) or 'ממ\"ק' (Mamak - floor shelter), as these are NOT private apartment safe rooms."),
    pets: z.boolean().nullable().optional().describe("True if pets are allowed."),
    furnished: z.boolean().nullable().optional().describe("Set to true if 'משופץ', 'אחרי שיפוץ', 'כחדשה', or 'מהניילונים' is mentioned. False otherwise."),
    rearFacing: z.boolean().nullable().optional().describe("True if the apartment is rear-facing (עורפית)."),
    frontFacing: z.boolean().nullable().optional().describe("True if the apartment is front-facing (חזית)."),
    brokerFee: z.boolean().nullable().optional().describe("Set to false if the text indicates NO broker fee ('ללא תיווך', 'פרטי', 'מפרטי'). Set to true if a professional broker is involved ('מתווך', 'עמלת תיווך')."),
    vaad: z.number().nullable().optional().describe("Integer. The homeowners association or building management fee. Look for the keywords 'ועד בית', 'ועד', or 'דמי ניהול'."),
    arnona: z.number().nullable().optional().describe("Integer. The municipal property tax value. DO NOT extract dates like '1.9' into this field under any circumstances. Look for the keywords 'ארנונה' or 'ארנ'. Output the exact stated raw numeric value without attempting to calculate monthly equivalents."),
    entranceDate: z.string().nullable().optional().describe("String representing the move-in date. E.g., 'מיידי' (Immediate) or 'גמיש' (Flexible). Critically: The decimal string '1.9' or '1/9' refers to September 1st (a temporal date). Map '1.9' to this entranceDate field exclusively; never to financial fields."),
    notes: z.string().nullable().optional().describe("A concise, synthesized string capturing any important requirements, contractual nuances, or unmapped features not covered by other fields (e.g., 'No pets allowed', 'Requires 2 guarantors'). Do not repeat data already captured in booleans or numbers."),
    ownerName: z.string().nullable().optional().describe("The name of the person publishing the ad (landlord, current tenant, or agent)."),
    ownerPhone: z.string().nullable().optional().describe("The phone number to contact. Usually 10 digits starting with 05. Extract only the digits."),

    inferredCustomChecks: z.record(z.string(), z.boolean()).nullable().optional().describe("A map of other inferred boolean features. Keys MUST be the EXACT Hebrew phrases found in text, e.g. 'דוד שמש': true, 'סורגים': true, 'בוידם': true, 'יחידת הורים': true, 'רשתות': true. Map uniquely localized architectural features here.")
});

export type ExtractedApartment = z.infer<typeof apartmentSchema>;

// The raw JSON schema required by the Gemini API for structured output.
// Kept in sync with the Zod schema above.
import { Schema } from '@google/genai';

export const geminiResponseSchema: Schema = {
    type: "OBJECT" as any,
    properties: {
        address: { type: "STRING" as any, description: "The street address of the apartment. Extract city if possible.", nullable: true },
        neighborhood: { type: "STRING" as any, description: "The neighborhood the apartment is in.", nullable: true },
        price: { type: "NUMBER" as any, description: "Extract the monthly rental price as an integer. Strip all currency symbols (₪, שח). If the price is stated in thousands colloquially (e.g., '4.5 אלף' or '4500 שח'), output 4500. Ensure you do not confuse the base rental price with the Arnona tax value.", nullable: true },
        rooms: { type: "NUMBER" as any, description: "Extract the total number of rooms as a float. Interpret textual Hebrew numbers ('שלושה') as integers. Include half rooms ('חצי'). If the text says 'סטודיו' (Studio), output 1. The living room ('סלון') is inherently counted in the total room count; do not add +1 to the stated total.", nullable: true },
        floor: { type: "NUMBER" as any, description: "Extract the floor level as an integer. 'קומת קרקע' (Ground) or 'פרטר' (Parter) must strictly evaluate to 0. 'מרתף' (Basement) must evaluate to -1. 'קומה ראשונה עמודים' is floor 1. If a range is given, extract only the specific floor.", nullable: true },
        size: { type: "NUMBER" as any, description: "Extract the property size in square meters (מ\"ר, מטר, שטח, מטראז') as an integer. Strip text, leave only the number.", nullable: true },
        elevator: { type: "BOOLEAN" as any, description: "Set to true if 'מעלית', 'מעליות', or 'מעלית שבת' is mentioned in the text. False otherwise.", nullable: true },
        parking: { type: "BOOLEAN" as any, description: "Set to true if 'חניה', 'חנייה', 'חניה פרטית', 'חניה מקורה', 'חניה בטאבו', or 'חניון' is mentioned. False otherwise.", nullable: true },
        balcony: { type: "BOOLEAN" as any, description: "Set to true if 'מרפסת', 'מרפסת שמש', or 'מרפסת סוכה' is mentioned. False otherwise.", nullable: true },
        ac: { type: "BOOLEAN" as any, description: "Set to true if 'מזגן', 'מיזוג', 'ממוזג', 'מיני מרכזי', or 'VRF' is mentioned. False otherwise.", nullable: true },
        tama38: { type: "BOOLEAN" as any, description: "Boolean. Set to true ONLY if the text explicitly mentions 'ממ\"ד' (Mamad) or 'מרחב מוגן דירתי'. Set to false if it mentions 'מקלט' (Miklat - shared shelter) or 'ממ\"ק' (Mamak - floor shelter).", nullable: true },
        pets: { type: "BOOLEAN" as any, description: "True if pets are allowed.", nullable: true },
        furnished: { type: "BOOLEAN" as any, description: "True if the apartment is furnished (מרוהטת) or partially furnished. Also map renovated ('משופץ', 'אחרי שיפוץ') state here.", nullable: true },
        rearFacing: { type: "BOOLEAN" as any, description: "True if the apartment is rear-facing (עורפית).", nullable: true },
        frontFacing: { type: "BOOLEAN" as any, description: "True if the apartment is front-facing (חזית).", nullable: true },
        brokerFee: { type: "BOOLEAN" as any, description: "Set to false if the text indicates NO broker fee ('ללא תיווך', 'פרטי', 'מפרטי'). Set to true if a professional broker is involved ('מתווך', 'עמלת תיווך').", nullable: true },
        vaad: { type: "NUMBER" as any, description: "Integer. The homeowners association or building management fee. Look for the keywords 'ועד בית', 'ועד', or 'דמי ניהול'.", nullable: true },
        arnona: { type: "NUMBER" as any, description: "Integer. The municipal property tax value. DO NOT extract dates like '1.9' into this field. Look for 'ארנונה' or 'ארנ'. Output raw numeric value.", nullable: true },
        entranceDate: { type: "STRING" as any, description: "String representing the move-in date. E.g., 'מיידי' (Immediate) or 'גמיש' (Flexible). Critically: The decimal string '1.9' or '1/9' refers to September 1st (a temporal date). Map '1.9' to this entranceDate field exclusively.", nullable: true },
        notes: { type: "STRING" as any, description: "A concise, synthesized string capturing any important requirements, contractual nuances, or unmapped features not covered by other fields (e.g., 'No pets allowed', 'Requires 2 guarantors'). Do not repeat data already captured.", nullable: true },
        ownerName: { type: "STRING" as any, description: "The name of the person publishing the ad (landlord, current tenant, or agent).", nullable: true },
        ownerPhone: { type: "STRING" as any, description: "The phone number to contact. Usually 10 digits starting with 05. Extract only the digits.", nullable: true },
        inferredCustomChecks: {
            type: "OBJECT" as any,
            description: "A map of other inferred boolean features. Keys MUST be the EXACT Hebrew phrases found in text, e.g. 'דוד שמש': true, 'סורגים': true, 'בוידם': true, 'יחידת הורים': true, 'רשתות': true. Map uniquely localized architectural features here.",
            nullable: true
        }
    },
    required: ["address", "price", "rooms"]
};
