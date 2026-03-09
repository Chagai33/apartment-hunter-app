import { z } from 'zod';

export const apartmentSchema = z.object({
    address: z.string().nullable().optional().describe("The street address of the apartment. Extract city if possible."),
    neighborhood: z.string().nullable().optional().describe("The neighborhood the apartment is in."),
    price: z.number().nullable().optional().describe("The monthly rent price in ILS."),
    rooms: z.number().nullable().optional().describe("The number of rooms in the apartment. (e.g. 3, 3.5, 4). Extract decimal points correctly."),
    elevator: z.boolean().nullable().optional().describe("True if the building has an elevator."),
    parking: z.boolean().nullable().optional().describe("True if the apartment includes parking."),
    balcony: z.boolean().nullable().optional().describe("True if the apartment has a balcony/sun terrace (מרפסת שמש)."),
    ac: z.boolean().nullable().optional().describe("True if the apartment has air conditioning (מזגן)."),
    tama38: z.boolean().nullable().optional().describe("True if the apartment has a Mamad/Safe room (ממ\"ד) - map Mammad to tama38 field."),
    pets: z.boolean().nullable().optional().describe("True if pets are allowed."),
    furnished: z.boolean().nullable().optional().describe("True if the apartment is furnished (מרוהטת) or partially furnished."),
    notes: z.string().nullable().optional().describe("Any additional details, descriptions, or terms from the text translated or kept in the original language."),
    ownerName: z.string().nullable().optional().describe("The name of the person publishing the ad (landlord, current tenant, or agent)."),
    ownerPhone: z.string().nullable().optional().describe("The phone number to contact. Format as string, e.g., '050-1234567'."),

    // Custom checks derived from the text that don't fit standard boolean fields securely
    // We will return these as key-value pairs where key is a generic term and value is boolean
    inferredCustomChecks: z.record(z.string(), z.boolean()).nullable().optional().describe("A map of other inferred boolean features. Keys should be lowercase english terms, e.g. 'renovated': true, 'warehouse': true, 'long_term': true.")
});

export type ExtractedApartment = z.infer<typeof apartmentSchema>;
