const cron = require('node-cron');
const FoodListing = require('../models/FoodListing');

const initCronJobs = (io) => {
  // Run every 2 minutes: Sweep and expire stale listings
  cron.schedule('*/2 * * * *', async () => {
    try {
      const now = new Date();
      const result = await FoodListing.updateMany(
        {
          status: 'AVAILABLE',
          expiresAt: { $lt: now },
        },
        {
          $set: { status: 'EXPIRED' },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`🧹 Cron: Auto-expired ${result.modifiedCount} stale food listings`);
        if (io) {
          io.emit('listings_refreshed');
        }
      }
    } catch (error) {
      console.error('Error running expiry cron job:', error.message);
    }
  });

  console.log('⏰ Expiry background cron job initialized (runs every 2 mins)');
};

module.exports = initCronJobs;
