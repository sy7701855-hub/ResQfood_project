require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const initCronJobs = require('./utils/cronJobs');
const seedData = require('./utils/seedData');

// Route imports
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const claimRoutes = require('./routes/claimRoutes');
const impactRoutes = require('./routes/impactRoutes');
const adminRoutes = require('./routes/adminRoutes');


const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Attach io to Express app instance so controllers can emit real-time events
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files (Vanilla HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/admin', adminRoutes);


// Instant Database Seed Route (one-click demo population)
app.post('/api/seed', async (req, res) => {
  try {
    const result = await seedData();
    // Notify all connected clients to reload their maps
    io.emit('listings_refreshed');
    res.json({
      success: true,
      message: 'Database seeded with fresh demo food listings and accounts!',
      result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fallback route to serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Socket.io Connection Management
io.on('connection', (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

// Start Server and Database
const startServer = async () => {
  try {
    await connectDB();
    initCronJobs(io);

    // Seed demo accounts only if database is brand new
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      try {
        await seedData();
        console.log('✅ Initial demo accounts & listings auto-seeded!');
      } catch (seedErr) {
        console.log('💡 Database already seeded or ready.');
      }
    } else {
      console.log(`📦 Database ready with ${userCount} existing registered accounts.`);
    }

    server.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 ResQFood Server Running on: http://localhost:${PORT}`);
      console.log(`🌍 Open your browser at http://localhost:${PORT} to view the app!`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Fatal Server Boot Error:', error);
    process.exit(1);
  }
};

startServer();
