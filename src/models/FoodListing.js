const mongoose = require('mongoose');

const foodListingSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for the food listing'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['COOKED_MEALS', 'BAKED_GOODS', 'GROCERIES', 'BEVERAGES', 'PACKAGED'],
      default: 'COOKED_MEALS',
    },
    quantity: {
      amount: {
        type: Number,
        required: [true, 'Please provide quantity amount'],
        min: [1, 'Quantity must be at least 1'],
      },
      unit: {
        type: String,
        enum: ['PORTIONS', 'KG', 'PACKETS'],
        default: 'PORTIONS',
      },
    },
    dietaryInfo: [
      {
        type: String,
        enum: ['VEGETARIAN', 'VEGAN', 'DAIRY_FREE', 'NUT_FREE', 'HALAL', 'GLUTEN_FREE'],
      },
    ],
    imageUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    pickupAddress: {
      type: String,
      required: [true, 'Please provide pickup address'],
    },
    pickupWindow: {
      startTime: {
        type: Date,
        default: Date.now,
      },
      endTime: {
        type: Date,
        required: true,
      },
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'RESERVED', 'COMPLETED', 'EXPIRED', 'CANCELLED'],
      default: 'AVAILABLE',
    },
  },
  { timestamps: true }
);

// Indexes
foodListingSchema.index({ location: '2dsphere' });
foodListingSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('FoodListing', foodListingSchema);
