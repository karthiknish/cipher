# Cipher - Streetwear & Virtual Try-On

Cipher is a premium streetwear e-commerce platform featuring a virtual try-on experience powered by **Gemini 3 Pro** (codenamed "Nano Banana Pro").

## Features

### Core Shopping
- **Shop**: Browse the latest streetwear collection with advanced filtering and animations
- **Cart**: Fully functional shopping cart with persistent state management
- **Checkout**: Complete checkout flow with shipping and order confirmation
- **Orders**: Order history with status tracking

### Virtual Try-On (AI-Powered)
- Upload your photo and describe your look to see how the clothes fit
- Powered by Google Gemini AI for realistic visualization

### Wishlist System
- Save items for later with heart icon toggle
- Persistent across sessions (Firebase for logged-in users, localStorage for guests)
- Quick add-to-cart from wishlist page
- Wishlist count indicator in navbar

### Product Reviews & Ratings
- Star ratings (1-5) with visual display
- Written reviews with optional photo uploads
- Verified purchase badges
- "Helpful" voting system
- Average rating calculation per product

### AI Size Recommendation
- Input height, weight, and fit preference (slim/regular/relaxed)
- Intelligent size matching using BMI-based body estimation
- Confidence score for recommendations
- Alternative size suggestions
- Category-specific size charts (Tees, Hoodies, Outerwear, Pants)

### Recently Viewed Products
- Automatic tracking of browsed products
- Display up to 10 most recent items
- Quick navigation back to previously viewed products
- Persistent across page navigation

### "Complete the Look" Suggestions
- Smart outfit pairing recommendations
- Category-based complementary item suggestions
- Quick add-to-cart from suggestions
- Contextual styling ideas on product pages

### Live Inventory Alerts
- Real-time stock level indicators ("Only 3 left!")
- Live viewer count ("12 people viewing this")
- Recent purchase notifications for urgency
- Dynamic updates every few seconds

### Product Comparison
- Side-by-side comparison of up to 3 products
- Compare price, category, sizes, and materials
- Floating comparison drawer
- Easy add/remove products from comparison

### User Experience
- **Authentication**: User login via Firebase (Email/Password)
- **Toast Notifications**: Central notification system for all user actions
- **Admin Panel**: Product management (Add/Edit/Delete)
- **FAQs Page**: Comprehensive help with 5 categories and 20+ Q&As
- **Responsive Design**: Mobile-first with desktop optimization

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Light Mode Enforced)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend/Auth**: Firebase (Auth, Firestore)
- **AI Integration**: Google Gemini API

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

```
src/
├── app/                    # App Router pages
│   ├── admin/             # Admin panel
│   ├── api/try-on/        # Virtual try-on API
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout flow
│   ├── contact/           # Contact form
│   ├── faqs/              # FAQ page
│   ├── login/             # Authentication
│   ├── orders/            # Order history
│   ├── shop/[id]/         # Product details
│   └── wishlist/          # Saved items
├── components/            # Reusable UI (Navbar, Footer)
├── context/               # State management
│   ├── AuthContext        # User authentication
│   ├── CartContext        # Shopping cart
│   ├── OrderContext       # Order management
│   ├── ProductContext     # Product catalog
│   ├── ReviewContext      # Product reviews
│   ├── SizeRecommendationContext  # AI sizing
│   ├── ToastContext       # Notifications
│   └── WishlistContext    # Saved items
└── lib/                   # Firebase & Gemini config
```

## Design Philosophy

Cipher follows a "streetwear minimalist" aesthetic inspired by Aigle:
- **Typography**: Bold, uppercase headings with tight tracking
- **Color Palette**: Strict monochrome (Black/White/Gray) with minimal accents
- **Motion**: Smooth entry animations and micro-interactions
- **Layout**: Full-width hero sections, generous whitespace
