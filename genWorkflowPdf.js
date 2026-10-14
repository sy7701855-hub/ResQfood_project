const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Output to Desktop only (NOT in project folder)
const home = process.env.USERPROFILE;
const desktopPaths = [path.join(home, 'OneDrive', 'Desktop'), path.join(home, 'Desktop')];
const desktop = desktopPaths.find(p => fs.existsSync(p)) || home;
const outPath = path.join(desktop, 'ResQFood_Interview_Workflow.pdf');

const doc = new PDFDocument({ margin: 45, size: 'A4' });
doc.pipe(fs.createWriteStream(outPath));

const GREEN = '#16a34a';
const DARK = '#1e293b';
const GRAY = '#475569';

function title(t) { doc.font('Helvetica-Bold').fontSize(22).fillColor(GREEN).text(t); doc.moveDown(0.3); doc.moveTo(45, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').stroke(); doc.moveDown(0.5); }
function h2(t) { doc.font('Helvetica-Bold').fontSize(15).fillColor(DARK).text(t); doc.moveDown(0.3); }
function h3(t) { doc.font('Helvetica-Bold').fontSize(12).fillColor(GREEN).text(t); doc.moveDown(0.2); }
function p(t) { doc.font('Helvetica').fontSize(11).fillColor(GRAY).text(t, { align: 'justify', lineGap: 3 }); doc.moveDown(0.4); }
function code(t) { doc.font('Courier').fontSize(9).fillColor('#334155').text(t, { lineGap: 2 }); doc.moveDown(0.4); }
function bullet(t) { doc.font('Helvetica').fontSize(11).fillColor(GRAY).text('  •  ' + t, { lineGap: 2 }); }
function gap() { doc.moveDown(0.3); }
function newPage() { doc.addPage(); }

// ===== PAGE 1: COVER =====
doc.moveDown(6);
doc.font('Helvetica-Bold').fontSize(36).fillColor(GREEN).text('ResQFood', { align: 'center' });
doc.font('Helvetica').fontSize(14).fillColor(GRAY).text('Complete Project Workflow & Interview Guide', { align: 'center' });
doc.moveDown(2);
doc.font('Helvetica').fontSize(11).fillColor(GRAY).text('Surplus Food Redistribution Platform', { align: 'center' });
doc.text('Node.js | Express | MongoDB | Socket.io | Leaflet', { align: 'center' });
doc.moveDown(4);
doc.font('Helvetica').fontSize(10).fillColor('#94a3b8').text('Prepared for Interview — ' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), { align: 'center' });

// ===== PAGE 2: ONE-LINE PITCH + ARCHITECTURE =====
newPage();
title('One-Line Pitch');
p('"ResQFood is a real-time web platform that connects surplus food donors (restaurants, bakeries, caterers) with nearby NGOs, volunteers, and community members — reducing food waste and fighting hunger using live maps, instant notifications, and a secure OTP-based pickup verification system."');

gap();
title('Architecture Overview');
code(`CLIENT (Browser)
  ├── index.html (UI)
  ├── app.js (Logic + Socket.io Client)
  ├── Leaflet Map
  └── admin.html (Admin Panel)
         │
    WebSocket + REST API (HTTP)
         │
EXPRESS SERVER (Node.js)
  ├── Middleware: CORS → JSON Parser → JWT Auth
  ├── Routes: /api/auth, /api/listings, /api/claims, /api/impact, /api/admin
  ├── Socket.io (Real-time Broadcast)
  ├── Cron Job (Every 2 min — expire old listings)
  └── Email Service (Nodemailer)
         │
    Mongoose ORM
         │
MONGODB (or In-Memory Fallback)
  ├── users
  ├── foodlistings
  └── claims`);

// ===== PAGE 3: PHASE 1 & 2 =====
newPage();
title('Data Flow — Phase 1: Server Startup');
bullet('npm start → runs src/server.js');
bullet('Express app created, middleware loaded');
bullet('Routes mounted (/api/auth, /api/listings, /api/claims, /api/impact, /api/admin)');
bullet('Socket.io attached to HTTP server');
bullet('MongoDB connection attempted');
bullet('   → SUCCESS: Connected to local/cloud MongoDB');
bullet('   → FAILURE: mongodb-memory-server boots in-memory DB automatically');
bullet('Cron job initialized (runs every 2 minutes)');
bullet('Server listens on port 5000');
gap();
p('Interview point: "The server has a smart fallback. If MongoDB is not running locally, it automatically boots an in-memory database so the app works instantly for demos without any setup."');

gap();
title('Phase 2: User Registration & Login');
bullet('User submits form → POST /api/auth/register');
bullet('Check if email already exists');
bullet('Hash password using bcryptjs (12 salt rounds)');
bullet('Save user with GeoJSON location coordinates');
bullet('Generate JWT token (7-day expiry)');
bullet('Return { token, user } to client');
gap();
h3('How JWT works:');
bullet('User logs in → server creates JWT containing user ID');
bullet('Token stored in browser localStorage');
bullet('Every API request sends token in Authorization header');
bullet('Server middleware decodes token → finds user → attaches to req.user');
bullet('If token invalid/expired → 401 error');

// ===== PAGE 4: PHASE 3 & 4 =====
newPage();
title('Phase 3: Donor Posts Surplus Food');
bullet('Donor fills form → POST /api/listings (with JWT token)');
bullet('Auth middleware: Is JWT valid? Is role DONOR?');
bullet('Create FoodListing with title, category, quantity, GeoJSON location, expiry');
bullet('Save to MongoDB with 2dsphere indexed location');
bullet('Socket.io broadcasts "new_food_available" to ALL connected clients');
bullet('Every user sees the new pin on map INSTANTLY (no refresh)');
gap();
p('Interview point: "When a donor lists food, it is saved with a GeoJSON Point and 2dsphere index. This allows efficient geospatial queries like find all food within 5km. The listing is broadcast via Socket.io to all clients in real-time."');

gap();
title('Phase 4: Claimer Discovers & Claims Food');
bullet('Claimer opens app → GET /api/listings?lng=77.6&lat=12.9&distance=20');
bullet('MongoDB $nearSphere query with 2dsphere index (max 20km radius)');
bullet('Only AVAILABLE listings with expiresAt > now');
bullet('Food items rendered on Leaflet map + food cards');
bullet('User clicks CLAIM → POST /api/claims { listingId }');
gap();
h3('Claim validation:');
bullet('Is food AVAILABLE?');
bullet('Is food NOT expired?');
bullet('Claimer is not the Donor?');
gap();
h3('After validation:');
bullet('Generate 6-digit OTP (e.g., "847293")');
bullet('Create Claim record in database');
bullet('Update listing status → RESERVED');
bullet('Socket.io broadcasts "listing_updated" → item turns RESERVED on everyones screen');
bullet('Email notification sent to donor via Nodemailer');
bullet('Claimer sees OTP on screen — shows this at pickup');

// ===== PAGE 5: PHASE 5 & 6 =====
newPage();
title('Phase 5: Physical Pickup & OTP Verification');
bullet('Claimer goes to pickup location, shows OTP to donor');
bullet('Donor enters OTP → POST /api/claims/verify { claimId, otp }');
bullet('Server compares: claim.verificationOtp === submitted otp?');
gap();
h3('If OTP matches:');
bullet('Mark claim → COMPLETED');
bullet('Mark listing → COMPLETED');
bullet('Socket.io broadcasts "pickup_completed"');
bullet('Email confirmation sent to claimer');
bullet('Impact metrics updated');
gap();
h3('If OTP does NOT match:');
bullet('Return error: "Invalid OTP"');
gap();
p('Interview point: "The OTP system prevents fraud. Without it, anyone could falsely mark food as picked up. The 6-digit code acts as a handshake — the claimer shows the code, the donor verifies it, and only then is the rescue marked complete."');

gap();
title('Phase 6: Background Cron Job (Auto-Expiry)');
bullet('node-cron runs every 2 minutes');
bullet('Finds all listings where status = AVAILABLE AND expiresAt < NOW');
bullet('Updates their status → EXPIRED');
bullet('Broadcasts via Socket.io → cards disappear from UI');
gap();
p('Interview point: "We use node-cron instead of MongoDB TTL indexes because we need to broadcast the expiry event via Socket.io to update all connected clients in real-time. A TTL index would silently delete without notifying the UI."');

// ===== PAGE 6: SECURITY + SCHEMAS =====
newPage();
title('Security Layers');
bullet('Password hashing — bcryptjs with 12 salt rounds');
bullet('Authentication — JWT tokens (7-day expiry)');
bullet('Authorization — Role-based middleware (DONOR, CLAIMER, ADMIN)');
bullet('Pickup verification — 6-digit OTP per claim');
bullet('Admin protection — protect + authorize(ADMIN) on all admin routes');
bullet('Env secrets — .env file, gitignored from GitHub');
bullet('Race condition — Atomic MongoDB update prevents double-claiming');

gap();
title('Database Schemas');
h3('Users Collection');
code(`{ name, email, password (hashed),
  role: "DONOR" | "CLAIMER" | "ADMIN",
  organizationType: "BAKERY" | "RESTAURANT" | "INDIVIDUAL",
  phone, address,
  location: { type: "Point", coordinates: [lng, lat] } }`);

h3('FoodListings Collection');
code(`{ donor: ObjectId -> User,
  title, description, category,
  quantity: { amount: Number, unit: "PORTIONS" | "KG" | "PACKETS" },
  imageUrl, pickupAddress,
  location: { type: "Point", coordinates: [lng, lat] },  // 2dsphere index
  pickupWindow: { startTime, endTime },
  expiresAt: Date,
  status: "AVAILABLE" | "RESERVED" | "COMPLETED" | "EXPIRED" | "CANCELLED" }`);

h3('Claims Collection');
code(`{ listing: ObjectId -> FoodListing,
  claimer: ObjectId -> User,
  donor: ObjectId -> User,
  verificationOtp: "847293",
  status: "PENDING_PICKUP" | "COMPLETED" | "CANCELLED",
  completedAt: Date }`);

// ===== PAGE 7: INTERVIEW Q&A =====
newPage();
title('Interview Questions & Answers');

h3('Q1: Why Socket.io instead of polling?');
p('"Polling wastes bandwidth — the client keeps asking any updates? every few seconds even when nothing changed. Socket.io maintains a persistent WebSocket connection, so the server pushes updates ONLY when something actually happens. This is critical for a food rescue app where seconds matter."');

h3('Q2: How does the geospatial search work?');
p('"MongoDB 2dsphere index allows efficient queries on GeoJSON Points. We use the $nearSphere operator which calculates real Earth-surface distances using the haversine formula. When a user opens the app, we grab their browser coordinates and query food within a configurable radius (default 20km)."');

h3('Q3: What if two people claim the same food simultaneously?');
p('"We use MongoDB atomic findOneAndUpdate. The claim endpoint first checks if status is AVAILABLE — if two requests arrive simultaneously, only the first finds it AVAILABLE. The second sees RESERVED and gets rejected. This prevents race conditions without explicit locking."');

h3('Q4: Why in-memory MongoDB fallback?');
p('"For developer experience. If someone clones the repo, they should not need to install MongoDB before seeing the app work. mongodb-memory-server spins up a real MongoDB instance in RAM — same queries, same indexes, just ephemeral."');

h3('Q5: How would you scale this for production?');
p('"Three things: (1) MongoDB Atlas for managed cloud database with sharding. (2) Redis pub/sub adapter for Socket.io — lets multiple Node processes share WebSocket events. (3) Serve static assets via CDN. Optional: containerize with Docker, deploy on AWS ECS."');

h3('Q6: Why not React or Angular?');
p('"The project scope is a single-page app with map, cards, and modals. Vanilla JS keeps the bundle at zero KB framework overhead, loads instantly, has no build step. For a larger project with complex state, I would use React with Redux."');

// ===== PAGE 8: MORE Q&A + PITCH =====
newPage();
h3('Q7: Explain each tech in one line');
bullet('Node.js — JavaScript runtime for the server');
bullet('Express — HTTP framework for REST API routes');
bullet('MongoDB — NoSQL database with geospatial indexing');
bullet('Mongoose — Schema-based ODM for data validation');
bullet('Socket.io — Real-time WebSocket communication');
bullet('JWT — Stateless authentication tokens');
bullet('bcryptjs — Password hashing');
bullet('node-cron — Background scheduled tasks');
bullet('Leaflet — Interactive map rendering');
bullet('Nodemailer — Email notifications');
bullet('Tailwind CSS — Utility-first styling');

gap();
h3('Q8: What is the most challenging part you built?');
p('"The real-time claim flow. When someone claims food, five things need to happen atomically: validate availability, generate OTP, create claim record, update listing status, and broadcast to all clients. Any failure in the middle could leave data inconsistent. I handle this with sequential awaits and proper error handling."');

gap(); gap();
title('90-Second Interview Pitch');
p('"I built ResQFood, a full-stack web application that solves the food waste problem by connecting surplus food donors — like restaurants, bakeries, and caterers — with nearby volunteers and NGOs in real-time.');
p('The backend runs on Node.js with Express, using MongoDB for storage with geospatial indexes for location-based discovery. When a donor posts surplus food, Socket.io instantly pushes the update to all connected users — they see a new pin appear on the Leaflet map without refreshing.');
p('The claiming process uses a 6-digit OTP for secure pickup verification, preventing fraud. A background cron job automatically expires stale listings every 2 minutes to ensure food safety.');
p('I also built an admin dashboard for platform management and integrated email notifications via Nodemailer. The app includes a smart fallback — if MongoDB is not installed locally, it boots an in-memory database automatically, making the project instantly runnable by anyone who clones it."');

doc.end();
doc.on('end', () => { console.log('PDF saved to:', outPath); });
