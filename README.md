# 🏆 SportSwap

A modern, full-featured marketplace for buying and selling sports equipment. Built with React, Vite, and Supabase.

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.0.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

SportSwap is a comprehensive peer-to-peer marketplace designed specifically for sports enthusiasts to buy, sell, and trade sports equipment. The platform features real-time messaging, offer negotiation, user reviews, and a seamless transaction system.

## ✨ Features

### 🔐 Authentication & User Management
- Secure user registration and login with email/password
- Protected routes and session management
- User profile creation and customization
- Profile pictures and cover photos
- Bio and personal information

### 📦 Listings & Browse System
- Create detailed listings with multiple images
- Image upload and management
- Category and subcategory filtering
- Advanced search functionality
- Condition tracking (New, Like New, Good, Fair, Poor)
- Location-based listings
- Draft and published listing states
- Edit and delete listings

### 💬 Real-Time Messaging
- Direct messaging between buyers and sellers
- Real-time message updates with Supabase subscriptions
- Conversation threads linked to specific listings
- Unread message indicators
- Message history and timestamps

### 💰 Offers & Transactions
- Make offers on listings
- Counter-offer functionality
- Accept/decline offer system
- Automatic transaction creation on acceptance
- Offer status tracking (Pending, Accepted, Declined, Withdrawn)
- Optional offer messages
- Mark listings as sold

### ⭐ Review & Reputation System
- Rate buyers and sellers after transactions
- 5-star rating system with comments
- Average rating display on profiles
- Recent reviews section
- Order history (bought and sold items)
- One review per transaction policy

### 🎨 User Experience
- Responsive mobile-first design
- Professional confirmation modals
- Toast notifications
- Loading states and error handling
- Collapsible sections
- Real-time search
- Favorites system
- Dashboard with quick stats

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI library
- **Vite 6.0.1** - Build tool and dev server
- **React Router 7.1.1** - Client-side routing
- **Tailwind CSS 3.4.17** - Utility-first CSS framework

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Storage for images
  - Authentication

### Hosting & Deployment
- **Vercel** - Frontend hosting with automatic deployments
- **Supabase Cloud** - Database and backend hosting

## 📸 Screenshots

### Homepage
![Homepage Screenshot](./screenshots/homepage.png)

### Browse Listings
![Browse Listings Screenshot](./screenshots/browse.png)

### Listing Detail
![Listing Detail Screenshot](./screenshots/listing-detail.png)

### Real-Time Messaging
![Messaging Screenshot](./screenshots/messages.png)

### User Profile
![User Profile Screenshot](./screenshots/profile.png)

### Create Listing
![Create Listing Screenshot](./screenshots/create-listing.png)

### Offers & Transactions
![Offers Screenshot](./screenshots/offers.png)

### Review System
![Reviews Screenshot](./screenshots/reviews.png)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account ([Sign up here](https://supabase.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/s1dolab/SportSwap.git
   cd SportSwap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**

   Run the following SQL in your Supabase SQL Editor to create all necessary tables and policies:

   - Create profiles table
   - Create listings table with images
   - Create conversations and messages tables
   - Create offers table
   - Create transactions table
   - Create reviews table
   - Set up Row Level Security (RLS) policies
   - Create necessary indexes

   *(SQL schema documentation available in `/database` folder)*

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
SportSwap/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable React components
│   │   ├── ConfirmationModal.jsx
│   │   ├── ConversationView.jsx
│   │   ├── MakeOfferModal.jsx
│   │   ├── Navbar.jsx
│   │   ├── OffersPanel.jsx
│   │   ├── ProductCard.jsx
│   │   ├── ReviewModal.jsx
│   │   └── Toast.jsx
│   ├── contexts/        # React Context providers
│   │   └── AuthContext.jsx
│   ├── lib/            # Utility functions and configs
│   │   └── supabase.js
│   ├── pages/          # Page components
│   │   ├── AuthPage.jsx
│   │   ├── BrowsePage.jsx
│   │   ├── CreateListingPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── FavoritesPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── ListingDetailPage.jsx
│   │   ├── MessagesPage.jsx
│   │   ├── MyListingsPage.jsx
│   │   ├── MyOffersPage.jsx
│   │   ├── OrderHistoryPage.jsx
│   │   ├── PublicProfilePage.jsx
│   │   └── SettingsPage.jsx
│   ├── App.jsx         # Main app component with routing
│   ├── index.css       # Global styles and Tailwind imports
│   └── main.jsx        # App entry point
├── .env.example        # Environment variables template
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## 🗄️ Database Schema

### Main Tables
- **profiles** - User profile information
- **listings** - Product listings with details
- **listing_images** - Multiple images per listing
- **conversations** - Chat threads between users
- **messages** - Individual messages in conversations
- **offers** - Price offers on listings
- **transactions** - Completed sales records
- **reviews** - User ratings and feedback
- **favorites** - User's saved listings

All tables include Row Level Security (RLS) policies to ensure data privacy and security.

## 🔒 Security Features

- Row Level Security (RLS) on all database tables
- Authentication required for sensitive operations
- Secure image upload with Supabase Storage
- Environment variables for sensitive configuration
- SQL injection prevention through Supabase client
- XSS protection with React's built-in escaping

## 🎓 Educational Purpose

This project was developed as a comprehensive full-stack web application demonstration, showcasing:
- Modern React patterns and hooks
- Real-time functionality with WebSockets
- Database design and relationships
- User authentication and authorization
- RESTful API integration
- Responsive web design
- State management
- File upload handling

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/s1dolab/SportSwap/issues).

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👥 Authors

**s1dolab**
- GitHub: [@s1dolab](https://github.com/s1dolab)

## 🙏 Acknowledgments

- Supabase for the amazing backend platform
- Tailwind CSS for the utility-first CSS framework
- React team for the powerful UI library
- Vite for the lightning-fast build tool

---

**Built with ❤️ for the sports community**
