const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodListing',
      required: true,
    },
    claimer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    verificationOtp: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING_PICKUP', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING_PICKUP',
    },
    reservedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Claim', claimSchema);
