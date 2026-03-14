# 🏢 Apartment Hunter App

A smart, collaborative web application designed to simplify and organize the apartment hunting process. Built with React, Vite, Tailwind CSS, and powered by Firebase, this app helps individuals, couples, and roommates track potential homes, take notes, and make decisions together.

## ✨ Key Features

- **🤖 AI-Powered Smart Import:** Automatically extract property details (price, rooms, address, contacts) from ad text or screenshots using Firebase Functions and AI.
- **🤝 Collaborative Workspaces:** Create groups and invite roommates or partners. All apartment data, notes, and statuses sync in real-time across all group members.
- **🌍 Bilingual & RTL Support:** Full support for English and Hebrew, with automatic RTL/LTR layout adjustments based on language preference.
- **📝 Custom Checklists:** Keep track of things to check during apartment viewings (e.g., water pressure, natural light, specific questions for the landlord).
- **📸 Image Gallery:** Upload, compress, and manage property photos to keep visual references neatly organized per apartment.
- **📱 Mobile-First Design:** A sleek, responsive user interface tailored for on-the-go usage.

## 🚀 Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS
- **Backend & Services:** Firebase (Authentication, Firestore, Storage, Cloud Functions)
- **State Management & Routing:** React Context API, React Router v6
- **Localization:** i18next, react-i18next
- **Forms & Validation:** react-hook-form
- **Image Optimization:** browser-image-compression

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- Firebase Project (with Auth, Firestore, Storage, and Functions enabled)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/apartment-hunter-app.git
   cd apartment-hunter-app
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure Environment Variables
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```text
src/
├── components/       # Reusable UI components organized by features & layout
├── context/          # React Context providers (Auth, Groups, Language)
├── hooks/            # Custom React hooks
├── lib/              # Third-party integrations (Firebase, i18n configs)
├── locales/          # Translation files (en, he)
├── pages/            # Main application views/routes
├── types/            # TypeScript type definitions
└── ...
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📄 License

This project is licensed under the MIT License.
