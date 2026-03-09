---
title: 'Smart Import via Gemini AI'
slug: 'smart-import-gemini'
created: '2026-03-09T16:13:53+02:00'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React', 'TypeScript', 'Tailwind', 'Firebase', 'react-hook-form', 'Zod', 'browser-image-compression']
files_to_modify: ['functions/src/index.ts', 'src/components/features/apartments/ApartmentForm.tsx', 'src/lib/firebase.ts']
code_patterns: ['Functional Components', 'Custom Hooks', 'React Hook Form', 'Firebase modular SDK']
test_patterns: ['Manual UI Testing']
---

# Tech-Spec: Smart Import via Gemini AI

**Created:** 2026-03-09T16:13:53+02:00

## Overview

### Problem Statement

צורך בהזנה מהירה של דירות באמצעות חילוץ מתמונות מודעה וטקסט, תוך הגבלת עלויות API במנגנון Rate Limiting ב-Firebase. המטרה היא להוריד את החיכוך בהקלדה ידנית של נתוני דירות, תוך שמירה על יציבות המערכת ואבטחת הקווטות של ה-API.

### Solution

הוספת אזור קלט בראש טופס הדירה (ApartmentForm) אשר שולח תמונה מכווצת/טקסט ל-Cloud Function. הפונקציה מצליבה קווטה ב-Firestore לכל יוזר, שולחת ל-Gemini בעזרת Structured Output, ומחזירה מידע נקי ו-Custom Checks בחזרה ל-UI לאישור אנושי (Human in the Loop). אם המידע חוזר, הטופס יתמלא מחדש (reset) והשדות החסרים שידרשו השלמה יודגשו. עד שהמידע יחזור, נציג חיווי טעינה שיסתיר את הטופס.

### Scope

**In Scope:**
- Client-side Image Compression (כיווץ תמונה בדפדפן לפני שליחה לשרת).
- יצירת Cloud Function (Node.js/TS) בסביבת Firebase לניהול הקריאה ל-Gemini.
- לוגיקת Rate Limiting מול Firestore פר יוזר.
- שימוש ב-Zod לביצוע Validation לתשובת המודל.
- הוספת Dropzone/Input area ל-`ApartmentForm` וניהול מצבי Loading והסתרת הטופס במהלך הייבוא.
- דריסת נתוני הטופס (`reset`) בחזרת הנתונים.
- הקפצת שאלות או סימונים ויזואלים לשדות חסרים/הצגת חיווי למשתמש.

**Out of Scope:**
- קריאת דפים חסומים מאחורי חומת התחברות (למשל פייסבוק פרטי) מתוך URL.
- שימוש ב-Native Web Share API.
- תורי משימות אסינכרוניים (Cloud Tasks) מכיוון שהפעולה קצרה ומתבצעת כ-HTTP Request בזמן אמת.

## Context for Development

### Codebase Patterns

- **Form Management:** Uses `react-hook-form` with `useForm<Partial<Apartment>>`. Defaults are set and existing data is loaded via `reset()`.
- **Styling:** Tailwind CSS is used extensively for all UI components.
- **State:** Local state is used for UI toggles (`fetching`, `submitting`, `showAdditionalContact`). Context API is used for global state (`useAuth`, `useGroup`).
- **Data Fetching:** Firebase modular SDK (`doc`, `getDoc`, `onSnapshot`).
- **Backend:** Currently entirely client-side interacting directly with Firestore. The `functions` directory needs to be initialized.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/components/features/apartments/ApartmentForm.tsx` | Target for UI integration. Defines the form structure, state, and submission logic. |
| `src/lib/firebase.ts` | Firebase initialization. Needs export for Cloud Functions callable wrapper (`getFunctions`). |
| `functions/src/index.ts` | (To be created) The backend entry point for the Gemini API call and rate limiting. |

### Technical Decisions

- **Clean Slate for Backend:** As no `functions` directory exists, we will need to run `firebase init functions` to set up the Node.js/TypeScript backend environment.
- **API Call Mapping:** The Cloud Function will be exposed as an `httpsCallable` function to easily handle authentication implicitly via the Firebase SDK.
- **Rate Limit Storage:** An `ai_usage` collection or subcollection under the `users` document in Firestore will track daily limits.

## Implementation Plan

### Tasks

- [ ] Task 1: Setup Firebase Functions Environment
  - File: `functions/package.json`, `functions/src/index.ts`
  - Action: Run `firebase init functions` (selecting TypeScript). Install dependencies: `firebase-admin`, `firebase-functions`, `@google/genai`, `zod`.
  - Notes: Ensure the environment variables for the Gemini API key are configured in Firebase secrets or `.env`.

- [ ] Task 2: Create Zod Schema for Apartment Data
  - File: `functions/src/schema.ts` (new)
  - Action: Define a Zod schema matching the `Apartment` frontend interface.
  - Notes: Include specific sub-schemas for the `customChecks` (which will be dynamic based on user input).

- [ ] Task 3: Implement `analyzeApartmentData` Cloud Function
  - File: `functions/src/index.ts`
  - Action: Create an `onCall` function. Implement Rate Limiting logic checking `users/{uid}/usageData/ai_imports`. Call Gemini Flash-Lite using structured output (passing the Zod schema).
  - Notes: Needs to handle both image (base64) and text input. Return structured data or rate limit error.

- [ ] Task 4: Configure Frontend Firebase Functions SDK
  - File: `src/lib/firebase.ts`
  - Action: Import `getFunctions` from `firebase/functions` and export `const functions = getFunctions(app, 'europe-west1')` (adjust region to match deployment).

- [ ] Task 5: Implement `SmartImportDropzone` Component
  - File: `src/components/features/apartments/SmartImportDropzone.tsx` (new)
  - Action: Build a UI component allowing file upload and text paste. Use `browser-image-compression` to resize images < 500kb before converting to base64.
  - Notes: Expose an `onExtract(data)` callback prop.

- [ ] Task 6: Integrate Dropzone into `ApartmentForm`
  - File: `src/components/features/apartments/ApartmentForm.tsx`
  - Action: Add the dropzone to the top of the form. Introduce an `isExtracting` state. During extraction, hide/obscure the main form below. On success, call `reset(extractedData)` and manage a `missingFields` state to highlight inputs that returned empty.

### Acceptance Criteria

- [ ] AC 1: Given a user on the Add Apartment page, when they upload a large image of a listing, then the image is compressed client-side and sent to the cloud function.
- [ ] AC 2: Given valid text or image input, when the cloud function processes it, then it returns a properly formatted JSON object matching the Apartment interface.
- [ ] AC 3: Given a successful extraction, when the frontend receives the data, then the form is fully populated via `reset()` and any fields not found by AI are highlighted for user review.
- [ ] AC 4: Given a user who has reached their daily limit (e.g., 10 imports), when they attempt another import, then the cloud function rejects the request and the UI displays a clear rate-limit warning without failing silently.
- [ ] AC 5: Given a user with custom checklists set up, when the AI infers a match from the text (e.g. "pet friendly" matches "מתאים לכלבים"), then the corresponding custom check is returned as `true` and checked in the UI.

## Additional Context

### Dependencies

- `@google/genai` sdk for backend.
- `zod` for backend validation.
- `browser-image-compression` for frontend optimization.
- Active Firebase Cloud Functions billing (Blaze plan) and Gemini API Key.

### Testing Strategy

- **Backend Logic:** Local testing via Firebase Emulator Suite (`firebase emulators:start`) to verify rate limiting and Gemini calls without deploying.
- **Frontend Integration:** Manual UI testing to ensure the loading state displays correctly, form resets without breaking existing refs, and validation errors surface gracefully.
- **Edge Cases:** Test with extremely large images (forces compression), empty text, and exceeding the rate limit.

### Notes

- **High-Risk:** Ensure the function region matches between `firebase.ts` and `functions/src/index.ts` to avoid CORS/Not Found errors for Callable Functions.
- **Future Considerations:** Adding multi-image support if listings span multiple screenshots.
