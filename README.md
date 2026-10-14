# 🥗 ResQFood — Local Surplus Food Redistribution Platform

> A full-stack web application connecting bakeries, restaurants, caterers, and supermarkets with local charities, students, and community members to eliminate food waste and fight hunger.

---

## 🌟 Key Features

1. **🗺️ Interactive Map & Proximity Discovery (Leaflet + OpenStreetMap):**
   * Real-time GPS/map markers showing nearby available food donations.
   * Filter by categories: *Cooked Meals, Baked Goods, Fresh Produce, Packaged Food*.
   * Urgency countdown timers (*"Expires in 1h 45m"*).

2. **⚡ Real-Time Network Sync (Socket.io):**
   * When a bakery posts fresh surplus food, all connected users receive an instant notification toast and map pin update without refreshing the page.
   * Items update live to "Reserved" or "Completed" in real-time.

3. **🤝 Safe Handshake Verification (6-Digit OTP / Pickup Pass):**
   * Eliminates fraud and false inventory mark-offs.
   * When a volunteer or community member claims food, a unique **6-digit verification code** is generated.
   * Upon physical pickup, the donor enters this OTP into their verification portal to mark the rescue as completed.

4. **⏰ Automated Expiry Sweep (`node-cron`):**
   * Perishable food is automatically swept every 2 minutes. Outdated listings are retired to ensure safety.

5. **📊 Community Impact Metrics:**
   * Live dashboard tracking:
     * **Meals Rescued**
     * **Kilograms Diverted from Landfills**
     * **CO₂e Emissions Prevented** (UN FAO carbon reduction standards).

---

## 🛠️ Tech Stack (Zero Jargon Guide)

* **Frontend:** Pure HTML5, Modern CSS (Tailwind CSS CDN), Vanilla JavaScript (ES6+).
* **Mapping:** Leaflet.js + OpenStreetMap (100% Free, no credit card required).
* **Backend:** Node.js & Express.js.
* **Database:** MongoDB with Mongoose (using GeoJSON `2dsphere` indexes).
* **Real-Time WebSockets:** Socket.io.
* **Security & Auth:** JSON Web Tokens (JWT) + bcryptjs password hashing.
* **Zero-Setup Database Engine:** Automatically boots an in-memory MongoDB instance if local MongoDB isn't running, so you can test everything immediately!

---

## 🚀 Quick Start Guide

### 1. Open Terminal and Navigate to the Project
```bash
cd C:\Users\Suraj\.gemini\antigravity\scratch\resqfood
```

### 2. Start the Application
```bash
npm start
```

### 3. Open in Browser
Visit **[http://localhost:5000](http://localhost:5000)** in Chrome, Edge, or Firefox.

---

## 🧪 Testing with Demo Accounts

Click the **"🌱 Seed Demo Data"** button in the top navbar (or click 1-Click Fast Login in the login modal):

| Account Role | Email | Password |
| :--- | :--- | :--- |
| **Donor (Bakery)** | `bakery@example.com` | `password123` |
| **Donor (Caterer)** | `caterer@example.com` | `password123` |
| **Claimer (Volunteer)** | `volunteer@example.com` | `password123` |

---

## 📁 Project Structure

```text
resqfood/
├── package.json          # Node dependencies and npm scripts
├── .env                  # Configuration (Port, MongoDB URI, JWT Secret)
├── README.md             # Documentation and guide
├── src/
│   ├── config/
│   │   └── db.js         # MongoDB connection with smart in-memory fallback
│   ├── models/
│   │   ├── User.js       # User schema with roles & geospatial points
│   │   ├── FoodListing.js# Food listing schema with 2dsphere indexing & expiry
│   │   └── Claim.js      # Claim reservation schema with 6-digit OTP
│   ├── middleware/
│   │   └── auth.js       # JWT validation & role permission guards
│   ├── routes/
│   │   ├── authRoutes.js # Login, Registration, Profile API
│   │   ├── listingRoutes.js # CRUD for food listings + Geo queries
│   │   ├── claimRoutes.js   # Reservation & Donor OTP verification API
│   │   └── impactRoutes.js  # Sustainability analytics API
│   ├── utils/
│   │   ├── cronJobs.js   # Background worker for expiring listings
│   │   └── seedData.js   # 1-click demo database populator
│   └── server.js         # Main Express & Socket.io server
└── public/               # Client-Side Application (Vanilla Web)
    ├── index.html        # Complete UI (Tabs, Modals, Leaflet Map)
    ├── css/
    │   └── styles.css    # Custom styling and pulse animations
    └── js/
        └── app.js        # Frontend JavaScript engine (API, Sockets, Leaflet)
```

---

## 🌐 Connecting MongoDB Atlas (Optional Permanent Cloud DB)

If you'd like your data saved permanently in the cloud:
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Get your connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/resqfood`).
3. Paste it into `.env`:
   ```env
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/resqfood
   ```
4. Restart the server (`npm start`).

