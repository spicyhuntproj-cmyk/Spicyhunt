# 🏰 Spicy Hunt: The Royal Culinary Chronicle

> **"Curating the Soul of Indian Heritage since 1924."**

Spicy Hunt is a premium, high-aesthetic restaurant platform designed to provide a "Royal Hosting" experience. It seamlessly blends historical Indian heritage with modern cloud technology to offer real-time table reservations, curated menu selections, and a sophisticated user dashboard.

---

## 1. Product Requirements Document (PRD)

### 🏺 Vision & Narrative
The Spicy Hunt brand represents the pinnacle of Indian culinary hospitality. The website must evoke a sense of "Royal Heritage" through its visual language, while providing the frictionless utility of a modern SaaS application.

### 🎯 Core Objectives
- **Prestige Branding:** Establish an immediate sense of luxury and history.
- **Conversion Efficiency:** A logical, multi-step booking flow that reduces friction.
- **Data Integrity:** Reliable cloud synchronization for all user registrations and orders.

### 🌟 Key Features
- **Royal Access (Auth):** Secure registration and login using Supabase and JWT.
- **Table Hosting:** Real-time date and time selection for premium table reservations.
- **Feast Selection (Menu):** Categorized browsing of signature dishes with instant cart updates.
- **The Royal Bill (Checkout):** A multi-stage confirmation process ending in persistent cloud storage.
- **Culinary History (Dashboard):** A synchronized view of all past and active reservations and orders.

---

## 2. Website Flow & User Journey

### 🗺️ Navigation Map
The application follows a strictly logical, progressive journey:
1. **Landing Page (`index.html`)**: The "Discovery" phase. Hero carousel and brand story.
2. **Menu Page (`menu.html`)**: The "Selection" phase. Users browse and add dishes to their "Feast."
3. **Booking Page (`booking.html`)**: The "Hosting" phase. Users select date, time, and guests.
4. **Checkout Page (`checkout.html`)**: The "Confirmation" phase. Final bill summary and Guest Details submission.
5. **Dashboard Page (`dashboard.html`)**: The "Retention" phase. Viewing and managing culinary history.

### 🧭 User Journey Logic
- **Anonymous User:** Can browse the Story and Menu, but must register/login (Royal Access) to book or checkout.
- **Registered User:** Can seamlessly move from Menu selection to Booking to Checkout, with their identity automatically attached to every record.

---

## 3. Tech Stack & Locked-down Specifications

The platform is built on a resilient, modern stack with explicitly locked-down versions for stability.

### 🏗️ Architecture
- **Environment:** Node.js 18.x +
- **Server:** Express.js Framework
- **Database:** Supabase Cloud (PostgreSQL)
- **Auth:** JWT + Bcrypt Hashing

### 📦 Dependency Manifest (Exact Versions)
| Package | Version | Purpose |
| :--- | :--- | :--- |
| `express` | `4.19.2` | Core Web Server Framework |
| `@supabase/supabase-js` | `2.101.1` | Cloud Database Synchronization |
| `jsonwebtoken` | `9.0.2` | Secure User Session Tokens |
| `bcryptjs` | `3.0.3` | Professional Password Hashing |
| `cors` | `2.8.5` | Cross-Origin Resource Sharing |
| `dotenv` | `16.4.5` | Environment Variable Management |

### 🛠️ Core APIs
- **/api/auth/register**: User creation with password hashing.
- **/api/auth/login**: Secure authentication and JWT issuance.
- **/api/menu**: Real-time retrieval of the royal culinary offerings.
- **/api/book-table**: Cloud storage of premium table reservations.
- **/api/checkout**: Atomic synchronization of food orders and line items.
- **/api/user/dashboard**: Aggregated view of personal activity.

---

## 4. Frontend Guidelines & Design System

### 🎨 Visual Aesthetic
"Luxe Heritage" – High contrast, deep crimsons, warm gold accents, and extensive use of Glassmorphism.

### 🖋️ Typography
- **Headings:** `Playfair Display` (Serif) – Elegant, historical, and authoritative.
- **Body Content:** `Inter` (Sans-serif) – Modern, clean, and highly readable.

### 🌈 Color Palette (Exact HEX)
- **Primary:** `#8B0000` (Deep Crimson) – Representing the heart of the brand.
- **Accent:** `#FF8C00` (Spiced Orange) – Representing the zest of the spices.
- **Gold:** `#D4AF37` (Branded Gold) – Used for borders, icons, and CTA emphasis.
- **Background:** `#FFFBF0` (Warm Cream) – A soft, historical paper-like base.
- **Text:** `#2C2C2C` (Soft Black) – For high readability against cream.

### 📏 Layout & Spacing
- **Border Radius:** `30px` (Cards) and `50px` (Buttons) for a smooth, organic feel.
- **Backdrop Blur:** `10px` to `25px` on all glass panels and navigation bars.
- **Shadows:** Soft `rgba(139, 0, 0, 0.4)` diffusions for depth.

---

## 5. Backend Schema & Auth logic

### 📂 Relational Database (Supabase)
The database uses a relational structure to ensure absolute data integrity.

```mermaid
erDiagram
    USERS ||--o{ TABLE_RESERVATIONS : "makes"
    USERS ||--o{ FOOD_ORDERS : "places"
    FOOD_ORDERS ||--|{ FOOD_ORDER_ITEMS : "contains"
    MENU_ITEMS ||--o{ FOOD_ORDER_ITEMS : "listed in"

    USERS {
        UUID id PK
        string name
        string email UNIQUE
        string password_hash
        string role "default: user"
    }

    TABLE_RESERVATIONS {
        SERIAL id PK
        UUID user_id FK
        date booking_date
        time booking_time
        int guests
        string occasion
        string status "confirmed/cancelled"
    }

    FOOD_ORDERS {
        SERIAL id PK
        UUID user_id FK
        decimal total_price
        string status "preparing/completed/cancelled"
    }

    FOOD_ORDER_ITEMS {
        SERIAL id PK
        int order_id FK
        int menu_item_id FK
        int quantity
        decimal price_at_time
    }
```

### 🔐 Authentication Flow
1. **Registration:** Password -> `bcrypt.hash` -> Saved in Supabase `users`.
2. **Login:** Email lookup -> `bcrypt.compare` -> Payload (`id`, `role`, `name`) -> `jwt.sign` -> Token returned.
3. **Protected Routes:** `Authorization: Bearer <Token>` -> `jwt.verify` -> Injection of `req.user`.

---

## 6. Build Sequence & History

The project was implemented in six distinct legendary phases:

1. **Phase 1: The Foundation**
   - Creation of the "The Story" landing page and core visual identity.
2. **Phase 2: The Feast**
   - Development of the dynamic Menu system and premium Bootstrap layouts.
3. **Phase 3: The Hosting**
   - Implementation of the multi-step navigation flow and in-memory session handling.
4. **Phase 4: Royal Access**
   - Migration of authentication from mock bypasses to real JWT/Bcrypt logic.
5. **Phase 5: Cloud Synchronization**
   - Integration of the Supabase SDK, replacing all local/Neon PostgreSQL drivers.
6. **Phase 6: Final Refinement**
   - Completion of the User Dashboard, order cancellation logic, and full mobile optimization.

---

*© 2026 SPICY HUNT CULINARY GROUP | CURATING HERITAGE*
