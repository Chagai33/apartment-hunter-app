"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apartmentSchema = void 0;
const zod_1 = require("zod");
exports.apartmentSchema = zod_1.z.object({
    address: zod_1.z.string().nullable().optional().describe("The street address of the apartment. Extract city if possible."),
    neighborhood: zod_1.z.string().nullable().optional().describe("The neighborhood the apartment is in."),
    price: zod_1.z.number().nullable().optional().describe("The monthly rent price in ILS."),
    rooms: zod_1.z.number().nullable().optional().describe("The number of rooms in the apartment. (e.g. 3, 3.5, 4). Extract decimal points correctly."),
    elevator: zod_1.z.boolean().nullable().optional().describe("True if the building has an elevator."),
    parking: zod_1.z.boolean().nullable().optional().describe("True if the apartment includes parking."),
    balcony: zod_1.z.boolean().nullable().optional().describe("True if the apartment has a balcony/sun terrace (מרפסת שמש)."),
    ac: zod_1.z.boolean().nullable().optional().describe("True if the apartment has air conditioning (מזגן)."),
    tama38: zod_1.z.boolean().nullable().optional().describe("True if the apartment has a Mamad/Safe room (ממ\"ד) - map Mammad to tama38 field."),
    pets: zod_1.z.boolean().nullable().optional().describe("True if pets are allowed."),
    furnished: zod_1.z.boolean().nullable().optional().describe("True if the apartment is furnished (מרוהטת) or partially furnished."),
    notes: zod_1.z.string().nullable().optional().describe("Any additional details, descriptions, or terms from the text translated or kept in the original language."),
    ownerName: zod_1.z.string().nullable().optional().describe("The name of the person publishing the ad (landlord, current tenant, or agent)."),
    ownerPhone: zod_1.z.string().nullable().optional().describe("The phone number to contact. Format as string, e.g., '050-1234567'."),
    // Custom checks derived from the text that don't fit standard boolean fields securely
    // We will return these as key-value pairs where key is a generic term and value is boolean
    inferredCustomChecks: zod_1.z.record(zod_1.z.string(), zod_1.z.boolean()).nullable().optional().describe("A map of other inferred boolean features. Keys should be lowercase english terms, e.g. 'renovated': true, 'warehouse': true, 'long_term': true.")
});
//# sourceMappingURL=schema.js.map