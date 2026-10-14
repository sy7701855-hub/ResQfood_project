const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');
const FoodListing = require('../models/FoodListing');
const Claim = require('../models/Claim');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication + ADMIN role
router.use(protect, authorize('ADMIN'));

// @route   GET /api/admin/stats
// @desc    Get platform-wide statistics
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalListings, totalClaims, completedPickups, activeDonors, activeListings] =
      await Promise.all([
        User.countDocuments(),
        FoodListing.countDocuments(),
        Claim.countDocuments(),
        Claim.countDocuments({ status: 'COMPLETED' }),
        User.countDocuments({ role: 'DONOR' }),
        FoodListing.countDocuments({ status: 'AVAILABLE', expiresAt: { $gt: new Date() } }),
      ]);

    res.json({
      success: true,
      data: { totalUsers, totalListings, totalClaims, completedPickups, activeDonors, activeListings },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching stats' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (paginated)
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 50;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(),
    ]);

    res.json({ success: true, count: users.length, total, data: users });
  } catch (err) {
    console.error('Admin get users error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user by ID (cannot delete self)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: `User "${user.name}" deleted successfully` });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting user' });
  }
});

// @route   GET /api/admin/listings
// @desc    Get all food listings (all statuses)
router.get('/listings', async (req, res) => {
  try {
    const listings = await FoodListing.find()
      .populate('donor', 'name email organizationType phone')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: listings.length, data: listings });
  } catch (err) {
    console.error('Admin get listings error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching listings' });
  }
});

// @route   DELETE /api/admin/listings/:id
// @desc    Force delete a food listing
router.delete('/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid listing ID' });
    }
    const listing = await FoodListing.findByIdAndDelete(id);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });

    // Broadcast removal to connected clients
    const io = req.app.get('io');
    if (io) io.emit('listing_updated', { id: listing._id, status: 'CANCELLED' });

    res.json({ success: true, message: `Listing "${listing.title}" deleted successfully` });
  } catch (err) {
    console.error('Admin delete listing error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting listing' });
  }
});

// @route   GET /api/admin/claims
// @desc    Get all claims with full details
router.get('/claims', async (req, res) => {
  try {
    const claims = await Claim.find()
      .populate('listing', 'title category status')
      .populate('claimer', 'name email phone')
      .populate('donor', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: claims.length, data: claims });
  } catch (err) {
    console.error('Admin get claims error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching claims' });
  }
});

module.exports = router;
