import { z } from 'zod';

export const apartmentSchema = z.object({
    address: z.string().nullable().optional().describe("The street address of the apartment. Extract city if possible."),
    neighborhood: z.string().nullable().optional().describe("The neighborhood the apartment is in."),
    price: z.number().nullable().optional().describe("The monthly rent price in ILS."),
    rooms: z.number().nullable().optional().describe("The number of rooms. (e.g. 3, 3.5). If 'סטודיו' (Studio), MUST be 1."),
    floor: z.number().nullable().optional().describe("The floor number the apartment is on (e.g. 3). If ground floor, set to 0."),
    size: z.number().nullable().optional().describe("The size of the apartment in square meters (מ\"ר)."),
    elevator: z.boolean().nullable().optional().describe("True if the building has an elevator."),
    parking: z.boolean().nullable().optional().describe("True if the apartment includes parking."),
    balcony: z.boolean().nullable().optional().describe("True if the apartment has a balcony/sun terrace (מרפסת שמש)."),
    ac: z.boolean().nullable().optional().describe("True if the apartment has air conditioning (מזגן)."),
    tama38: z.boolean().nullable().optional().describe("True ONLY if the apartment explicitly says Mamad (ממ\"ד). FALSE or omit if it says Miklat (מקלט) or Mamak (ממ\"ק)."),
    pets: z.boolean().nullable().optional().describe("True if pets are allowed."),
    furnished: z.boolean().nullable().optional().describe("True if the apartment is furnished (מרוהטת) or partially furnished."),
    rearFacing: z.boolean().nullable().optional().describe("True if the apartment is rear-facing (עורפית)."),
    frontFacing: z.boolean().nullable().optional().describe("True if the apartment is front-facing (חזית)."),
    brokerFee: z.boolean().nullable().optional().describe("True if there IS a broker fee. If the text says 'ללא תיווך' (no broker), set this to FALSE."),
    vaad: z.number().nullable().optional().describe("The monthly HOA/Vaad Bait cost in ILS (ועד בית)."),
    arnona: z.number().nullable().optional().describe("The bi-monthly property tax / Arnona cost in ILS (ארנונה)."),
    entranceDate: z.string().nullable().optional().describe("The date or condition of entry (e.g., '1.4', 'מיידי', 'גמיש')."),
    notes: z.string().nullable().optional().describe("Crucial: Put ALL extra details here. This includes furniture for sale, condition of the apartment, viewing days/times, and everything else not strictly mapped."),
    ownerName: z.string().nullable().optional().describe("The name of the person publishing the ad (landlord, current tenant, or agent)."),
    ownerPhone: z.string().nullable().optional().describe("The phone number to contact. Usually 10 digits starting with 05. Extract only the digits."),

    // Custom checks derived from the text that don't fit standard boolean fields securely
    // We will return these as key-value pairs where key is a generic term and value is boolean
    inferredCustomChecks: z.record(z.string(), z.boolean()).nullable().optional().describe("A map of other inferred boolean features. Keys MUST be the EXACT Hebrew phrases found in text, e.g. 'מקלט בבניין': true, 'חצר': true. Do NOT translate to English.")
});

export type ExtractedApartment = z.infer<typeof apartmentSchema>;
