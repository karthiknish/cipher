# Cipher - Streetwear & Virtual Try-On

Cipher is a premium streetwear e-commerce platform featuring a virtual try-on experience powered by **Gemini 3 Pro** (codenamed "Nano Banana Pro").

## Features

- **Shop**: Browse the latest streetwear collection with advanced filtering and animations.
- **Virtual Try-On**: Upload your photo and describe your look to see how the clothes fit, powered by Generative AI.
- **Cart**: Fully functional shopping cart with persistent state management.
- **Authentication**: User login via Firebase (Email/Password).
- **Expert Design**: High-end UI with smooth animations using Framer Motion and Lucide React icons.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Light Mode Enforced)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend/Auth**: Firebase
- **AI Integration**: Google Gemini API (Mocked for demo)

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Setup**:
    Create a `.env.local` file with your credentials:
    ```env
    # Firebase Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

    # Gemini API (Nano Banana Pro) for Virtual Try-On
    GEMINI_API_KEY=your_gemini_api_key
    ```
    
    Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

- `src/app`: App Router pages (Home, Shop, Cart, Try-On, Login).
- `src/app/api`: API routes (Virtual Try-On endpoint).
- `src/components`: Reusable UI components (Navbar, Footer, Providers).
- `src/context`: Global state (Auth, Cart).
- `src/lib`: Firebase and Gemini API configuration.

## Design Philosophy

Cipher follows a "streetwear minimalist" aesthetic:
- **Typography**: Bold, uppercase headings with tight tracking.
- **Color Palette**: Strict monochrome (Black/White/Gray) with minimal accents.
- **Motion**: Smooth entry animations and micro-interactions.
