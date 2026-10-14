const express = require('express');
const router = express.Router();
const FoodListing = require('../models/FoodListing');
const Claim = require('../models/Claim');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendClaimNotification, sendVerificationComplete } = require('../utils/emailService');


// Helper to generate 6-digit random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @route   POST /api/claims
// @desc    Reserve/claim a surplus food item
router.post('/', protect, async (req, res) => {
  try {
    const { listingId } = req.body;

    if (!listingId) {
      return res.status(400).json({ success: false, message: 'Please provide listingId' });
    }

    const listing = await FoodListing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Food listing not found' });
    }

    if (listing.status !== 'AVAILABLE') {
      return res.status(400).json({
        success: false,
        message: `This item is no longer available (Status: ${listing.status})`,
      });
    }

    if (new Date(listing.expiresAt) < new Date()) {
      listing.status = 'EXPIRED';
      await listing.save();
      return res.status(400).json({ success: false, message: 'This food listing has already expired' });
    }

    // Prevent donor from claiming their own listing
    if (listing.donor.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot claim your own donation' });
    }

    // Generate 6-digit pickup OTP
    const verificationOtp = generateOTP();

    // Create claim
    const claim = await Claim.create({
      listing: listing._id,
      claimer: req.user._id,
      donor: listing.donor,
      verificationOtp,
      status: 'PENDING_PICKUP',
    });

    // Mark listing as RESERVED
    listing.status = 'RESERVED';
    await listing.save();

    // Broadcast update via WebSockets
    const io = req.app.get('io');
    if (io) {
      io.emit('listing_updated', {
        id: listing._id,
        status: 'RESERVED',
        claimedBy: req.user.name,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Food successfully reserved! Present your 6-digit OTP upon pickup.',
      data: {
        claimId: claim._id,
        verificationOtp: claim.verificationOtp,
        listingTitle: listing.title,
        pickupAddress: listing.pickupAddress,
        pickupWindow: listing.pickupWindow,
        status: claim.status,
      },
    });
  } catch (error) {
    console.error('Reservation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/claims/verify
// @desc    Donor verifies the 6-digit OTP when claimer arrives to pick up
router.post('/verify', protect, async (req, res) => {
  try {
    const { claimId, otp } = req.body;

    if (!claimId || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide claimId and otp' });
    }

    const claim = await Claim.findById(claimId)
      .populate('listing')
      .populate('claimer', 'name email phone')
      .populate('donor', 'name');

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim record not found' });
    }

    // Check if the current user is the donor of this food
    if (claim.donor._id.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only the donor can verify and complete this pickup',
      });
    }

    if (claim.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'This pickup has already been verified' });
    }

    // Compare OTP
    if (claim.verificationOtp.trim() !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid 6-digit OTP code' });
    }

    // Mark completed
    claim.status = 'COMPLETED';
    claim.completedAt = new Date();
    await claim.save();

    // Mark listing completed
    const listing = await FoodListing.findById(claim.listing._id);
    if (listing) {
      listing.status = 'COMPLETED';
      await listing.save();
    }

    // Broadcast real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('pickup_completed', {
        claimId: claim._id,
        listingId: listing ? listing._id : null,
        title: listing ? listing.title : 'Food pickup',
      });
    }

    res.json({
      success: true,
      message: 'Pickup verified successfully! Impact points recorded.',
      data: {
        claimId: claim._id,
        status: claim.status,
        completedAt: claim.completedAt,
        listing: listing ? listing.title : '',
      },
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/claims/my-claims
// @desc    Get all claims made by current claimer
router.get('/my-claims', protect, async (req, res) => {
  try {
    const claims = await Claim.find({ claimer: req.user._id })
      .populate('listing')
      .populate('donor', 'name organizationType phone address')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: claims.length,
      data: claims,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/claims/donor-pending
// @desc    Get all reservations awaiting verification for current donor
router.get('/donor-pending', protect, async (req, res) => {
  try {
    const claims = await Claim.find({ donor: req.user._id })
      .populate('listing')
      .populate('claimer', 'name phone email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: claims.length,
      data: claims,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
