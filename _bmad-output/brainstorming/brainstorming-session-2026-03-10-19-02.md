---
stepsCompleted: [1]
inputDocuments: []
session_topic: 'ארכיטקטורת חילוץ נתונים מבוססת AI - מניעת הלוצינציות והכללה לשפות/ניסוחים'
session_goals: 'למצוא פתרון הוליסטי, סקיילבילי ויציב לחילוץ נתוני דירות ממודעות לא-מובנות (Unstructured) בעברית (ובאנגלית), שלא דורש רדיפה אינסופית אחרי חוקים ספציפיים בפרומפט.'
selected_approach: 'ai-recommended'
techniques_used: ['Five Whys', 'First Principles Thinking', 'Assumption Reversal']
ideas_generated: []
stepsCompleted: [1, 2]
context_file: ''
---

## Session Overview

**Topic:** ארכיטקטורת חילוץ נתונים מבוססת AI - מניעת הלוצינציות והכללה לשפות/ניסוחים
**Goals:** למצוא פתרון הוליסטי, סקיילבילי ויציב לחילוץ נתוני דירות ממודעות לא-מובנות (Unstructured) בעברית (ובאנגלית), שלא דורש רדיפה אינסופית אחרי חוקים ספציפיים בפרומפט.

### Context Guidance

_The user encountered "forced hallucinations" due to prompt/schema mismatches (e.g. confusing Arnona with numerical dates like "1.4") and wants a systematic architectural solution that handles dynamic Israeli market phrasing and English without becoming a fragile list of hardcoded rules._

### Session Setup

_Session initialization complete. Gathering approach preference from the user._

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** ארכיטקטורת חילוץ נתונים מבוססת AI - מניעת הלוצינציות והכללה לשפות/ניסוחים

**Recommended Techniques:**

- **[Five Whys]:** לזקק את שורש הבעיה - למה המודל הוזה? בבעיה מורכבת של Alignment כמו זו, טכניקה חודרנית (Deep) טובה יותר כדי להבין את הכשל הבסיסי (למשל, האם אנחנו כופים סכמה בוליאנית על חשיבה הסתברותית?).
- **[First Principles Thinking]:** לפרק את תהליך "פרשנות המודעה" ליסודות הכי בסיסיים שחייבים לקרות (קבלת דאטה לא מובנה -> מיפוי לעליות/חסרונות -> מבנה נתונים שמור). זה יאפשר לנו בנייה של ארכיטקטורה שלא נשענת על חרוזים וניסוחים בעברית אלא על עובדות.
- **[Assumption Reversal]:** לאתגר את ההנחות שלנו: מה אם לא צריך לחלץ boolean? מה אם החילוץ לא קורה ב-Pass אחד אלא בשניים (Multi-Agent reasoning)? טכניקה זו תחלץ אותנו מהקיבעון של Zod Schema נוקשה מול Prompt יחיד.

**AI Rationale:** מאחר ומדובר באתגר ארכיטקטורת תוכנה מורכב שמצריך בניית תשתית סקיילבילית ועמידה לשינויים (שפות, סלנג ישראלי, שינויי ניסוח מגמתיים), בחרתי בטכניקות עמוקות ויצירתיות מהקטגוריות 'deep' ו-'creative'. השילוב הזה מתחיל בשורש הבעיה (5 למה), מפרק את התשתית לגורמים בסיסיים שאינם תלויים ב-Framework, ובוחן מחדש את ההנחות (היעדר Zod קשיח).

## Technique Execution Results

### Technique 1: Five Whys

**Interactive Focus:** Identifying the root cause of AI hallucinations and prompt fragility.

**Key Ideas Generated:**

**[Five Whys #1]**: אפקט "הכה את החפרפרת" (Whac-a-Mole Effect)
*Concept*: הוספת חוק ספציפי כדי לפתור שגיאת חילוץ אחת (כמו חילוץ סטודיו), "מזהמת" את תשומת הלב של המודל (Attention) וגורמת לו להחיל את החוק הזה או פשוט להתבלבל באזורים שקודם עבדו היטב (כמו ארנונה ותאריכים).
*Novelty*: התובנה שהבעיה היא לא "הפרומפט לא מדויק מספיק", אלא שהפורמט עצמו רגיש מדי (Coupled) וכל שינוי קטן גורר אפקט דומינו.
