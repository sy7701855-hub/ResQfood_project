const express = require('express');
const router = express.Router();
const FoodListing = require('../models/FoodListing');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/listings
// @desc    Get active food listings (supports geospatial filtering)
router.get('/', async (req, res) => {
  try {
    const { lng, lat, distance, category, status } = req.query;

    const filter = {};

    // By default, show AVAILABLE listings that haven't expired
    if (status) {
      filter.status = status;
    } else {
      filter.status = 'AVAILABLE';
      filter.expiresAt = { $gt: new Date() };
    }

    if (category && category !== 'ALL') {
      filter.category = category;
    }

    // Geospatial search if coordinates provided
    if (lng && lat) {
      const maxDistanceInMeters = (parseFloat(distance) || 20) * 1000; // default 20km
      filter.location = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: maxDistanceInMeters,
        },
      };
    }

    const listings = await FoodListing.find(filter)
      .populate('donor', 'name organizationType phone address')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: listings.length,
      data: listings,
    });
  } catch (error) {
    console.error('Fetch listings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/listings/:id
// @desc    Get single food listing by ID
router.get('/:id', async (req, res) => {
  try {
    const listing = await FoodListing.findById(req.params.id).populate(
      'donor',
      'name organizationType phone address email'
    );

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    res.json({
      success: true,
      data: listing,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/listings
// @desc    Create a new surplus food listing (DONOR only)
router.post('/', protect, authorize('DONOR', 'ADMIN'), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      quantity,
      dietaryInfo,
      imageUrl,
      pickupAddress,
      pickupWindow,
      expiresInHours,
      coordinates,
    } = req.body;

    if (!title || !quantity || !pickupAddress) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, quantity, and pickup address',
      });
    }

    // Calculate expiration timestamp
    const hours = parseFloat(expiresInHours) || 3;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const startTime = pickupWindow?.startTime ? new Date(pickupWindow.startTime) : new Date();
    const endTime = pickupWindow?.endTime
      ? new Date(pickupWindow.endTime)
      : new Date(Date.now() + (hours + 0.5) * 60 * 60 * 1000);

    // Coordinates fallback to user's registered coords or Bangalore default
    const coords =
      coordinates && coordinates.length === 2
        ? [parseFloat(coordinates[0]), parseFloat(coordinates[1])]
        : req.user.location?.coordinates || [77.5946, 12.9716];

    const listing = await FoodListing.create({
      donor: req.user._id,
      title,
      description: description || '',
      category: category || 'COOKED_MEALS',
      quantity: {
        amount: Number(quantity.amount) || 1,
        unit: quantity.unit || 'PORTIONS',
      },
      dietaryInfo: dietaryInfo || [],
      imageUrl:
        imageUrl ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      location: {
        type: 'Point',
        coordinates: coords,
      },
      pickupAddress,
      pickupWindow: {
        startTime,
        endTime,
      },
      expiresAt,
      status: 'AVAILABLE',
    });

    const populatedListing = await FoodListing.findById(listing._id).populate(
      'donor',
      'name organizationType phone'
    );

    // Broadcast real-time event to all connected clients via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('new_food_available', populatedListing);
    }

    res.status(201).json({
      success: true,
      message: 'Surplus food listing published successfully!',
      data: populatedListing,
    });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/listings/:id
// @desc    Cancel or delete food listing
router.delete('/:id', protect, async (req, res) => {
  try {
    const listing = await FoodListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Verify ownership
    if (listing.donor.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this listing' });
    }

    listing.status = 'CANCELLED';
    await listing.save();

    // Broadcast update
    const io = req.app.get('io');
    if (io) {
      io.emit('listing_updated', { id: listing._id, status: 'CANCELLED' });
    }

    res.json({
      success: true,
      message: 'Listing successfully cancelled',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
