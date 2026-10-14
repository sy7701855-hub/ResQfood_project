const User = require('../models/User');
const FoodListing = require('../models/FoodListing');

const seedData = async () => {
  try {
    console.log('🌱 Seeding rich culinary demo food listings...');

    // Clear existing test data
    await FoodListing.deleteMany({});
    await User.deleteMany({});

    // 1. Create Demo Donor (Bakery)
    const donorUser = await User.create({
      name: 'The French Brioche & Artisan Bakery',
      email: 'bakery@example.com',
      password: 'password123',
      role: 'DONOR',
      organizationType: 'BAKERY',
      phone: '+91 98765 43210',
      address: '100ft Road, Indiranagar',
      location: {
        type: 'Point',
        coordinates: [77.6412, 12.9784],
      },
      isVerified: true,
    });

    // 2. Create Second Donor (Royal Feast Restaurant & Banquets)
    const restaurantUser = await User.create({
      name: 'Royal Zafran Kitchen & Banquet',
      email: 'caterer@example.com',
      password: 'password123',
      role: 'DONOR',
      organizationType: 'CATERER',
      phone: '+91 98765 12345',
      address: '5th Block, Koramangala',
      location: {
        type: 'Point',
        coordinates: [77.6200, 12.9352],
      },
      isVerified: true,
    });

    // 3. Create Third Donor (Organic Cafe & Farm Market)
    const cafeUser = await User.create({
      name: 'Green Harvest Organic Deli & Cafe',
      email: 'cafe@example.com',
      password: 'password123',
      role: 'DONOR',
      organizationType: 'RESTAURANT',
      phone: '+91 98111 22334',
      address: 'Lavelle Road, Central City',
      location: {
        type: 'Point',
        coordinates: [77.5980, 12.9710],
      },
      isVerified: true,
    });

    // 4. Create Demo Claimer
    const claimerUser = await User.create({
      name: 'Samira Community Volunteer',
      email: 'volunteer@example.com',
      password: 'password123',
      role: 'CLAIMER',
      organizationType: 'INDIVIDUAL',
      phone: '+91 98123 45678',
      address: 'MG Road Area',
      location: {
        type: 'Point',
        coordinates: [77.6080, 12.9750],
      },
    });

    // 5. Create Admin Account
    const adminUser = await User.create({
      name: 'ResQFood Admin',
      email: 'admin@resqfood.com',
      password: 'admin123',
      role: 'ADMIN',
      organizationType: 'INDIVIDUAL',
      phone: '+91 90000 00000',
      address: 'ResQFood HQ',
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716],
      },
    });

    const now = new Date();

    // Curated high-resolution culinary photography
    const demoListings = [
      {
        donor: donorUser._id,
        title: 'Artisan Butter Croissants & Almond Danish Box',
        description: 'Warm morning batch of flaky French butter croissants, pain au chocolat, and almond swirls. Baked fresh at 6 AM, packed safely in bakery boxes.',
        category: 'BAKED_GOODS',
        quantity: { amount: 18, unit: 'PORTIONS' },
        dietaryInfo: ['VEGETARIAN'],
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1000&q=80',
        location: {
          type: 'Point',
          coordinates: [77.6412, 12.9784],
        },
        pickupAddress: 'French Brioche Bakery, 100ft Rd, Indiranagar',
        pickupWindow: {
          startTime: now,
          endTime: new Date(now.getTime() + 3.5 * 60 * 60 * 1000),
        },
        expiresAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        status: 'AVAILABLE',
      },
      {
        donor: restaurantUser._id,
        title: 'Dum Biryani with Mirchi Ka Salan & Raita Trays',
        description: 'Untouched executive banquet buffet trays. Steamed aromatic basmati rice layered with spiced paneer, vegetables, and saffron. Kept in thermal warming pans.',
        category: 'COOKED_MEALS',
        quantity: { amount: 28, unit: 'PORTIONS' },
        dietaryInfo: ['VEGETARIAN', 'HALAL'],
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1000&q=80',
        location: {
          type: 'Point',
          coordinates: [77.6200, 12.9352],
        },
        pickupAddress: 'Royal Zafran Banquet, 5th Block Koramangala',
        pickupWindow: {
          startTime: now,
          endTime: new Date(now.getTime() + 2.5 * 60 * 60 * 1000),
        },
        expiresAt: new Date(now.getTime() + 3 * 60 * 60 * 1000),
        status: 'AVAILABLE',
      },
      {
        donor: cafeUser._id,
        title: 'Artisan Sourdough Gourmet Club Sandwiches',
        description: 'Fresh deli sandwiches on toasted whole-grain sourdough with aged cheddar, roasted bell peppers, fresh pesto, and crisp greens.',
        category: 'COOKED_MEALS',
        quantity: { amount: 14, unit: 'PORTIONS' },
        dietaryInfo: ['VEGETARIAN'],
        imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1000&q=80',
        location: {
          type: 'Point',
          coordinates: [77.5980, 12.9710],
        },
        pickupAddress: 'Green Harvest Deli, Lavelle Road',
        pickupWindow: {
          startTime: now,
          endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        },
        expiresAt: new Date(now.getTime() + 2.5 * 60 * 60 * 1000),
        status: 'AVAILABLE',
      },
      {
        donor: cafeUser._id,
        title: 'Farm Fresh Organic Fruit & Avocado Basket',
        description: 'Ripe Hass avocados, crisp Fuji apples, sweet Cavendish bananas, and Valencia oranges from today\'s fresh farm supply. Perfect for immediate consumption.',
        category: 'GROCERIES',
        quantity: { amount: 12, unit: 'KG' },
        dietaryInfo: ['VEGAN', 'GLUTEN_FREE'],
        imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1000&q=80',
        location: {
          type: 'Point',
          coordinates: [77.6320, 12.9710],
        },
        pickupAddress: 'Green Harvest Farm Market Counter, Indiranagar',
        pickupWindow: {
          startTime: now,
          endTime: new Date(now.getTime() + 6 * 60 * 60 * 1000),
        },
        expiresAt: new Date(now.getTime() + 7 * 60 * 60 * 1000),
        status: 'AVAILABLE',
      },
      {
        donor: donorUser._id,
        title: 'Woodfired Margherita & Truffle Mushroom Pizzas',
        description: 'Neapolitan style 12-inch sourdough crust pizzas with San Marzano tomato sauce, fresh buffalo mozzarella, and aromatic wild mushrooms.',
        category: 'COOKED_MEALS',
        quantity: { amount: 8, unit: 'PACKETS' },
        dietaryInfo: ['VEGETARIAN'],
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1000&q=80',
        location: {
          type: 'Point',
          coordinates: [77.6150, 12.9620],
        },
        pickupAddress: 'Pizzeria Rustica, Richmond Town',
        pickupWindow: {
          startTime: now,
          endTime: new Date(now.getTime() + 1.5 * 60 * 60 * 1000),
        },
        expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        status: 'AVAILABLE',
      },
      {
        donor: cafeUser._id,
        title: 'Cold-Pressed Valencia Orange & Green Detox Juices',
        description: 'Glass-bottled, cold-pressed raw juices (Immunity Orange, Citrus Carrot, Green Spinach Celery). Sealed bottles with 24h freshness window.',
        category: 'BEVERAGES',
        quantity: { amount: 15, unit: 'PACKETS' },
        dietaryInfo: ['VEGAN', 'GLUTEN_FREE'],
        imageUrl: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=1000&q=80',
        location: {
          type: 'Point',
          coordinates: [77.6010, 12.9790],
        },
        pickupAddress: 'Green Harvest Cold Press Kiosk, MG Road',
        pickupWindow: {
          startTime: now,
          endTime: new Date(now.getTime() + 5 * 60 * 60 * 1000),
        },
        expiresAt: new Date(now.getTime() + 6 * 60 * 60 * 1000),
        status: 'AVAILABLE',
      },
    ];

    await FoodListing.insertMany(demoListings);
    console.log('✅ 6 Gourmet food listings seeded with high-res food imagery!');
    return { success: true, count: demoListings.length };
  } catch (error) {
    console.error('Seeding error:', error.message);
    throw error;
  }
};

module.exports = seedData;
