// ==============================================================================
// ResQFood — Interactive Culinary Food App Engine
// ==============================================================================

// App State
let currentUser = null;
let currentToken = null;
let listings = [];
let myClaims = [];
let currentCategory = 'ALL';
let isVegOnly = false;
let currentLayout = 'split'; // 'split', 'grid', 'map'
let map = null;
let markersLayer = null;
let userCoords = [12.9716, 77.5946]; // Default Bangalore center coords
let authMode = 'login';
let socket = null;

// Preset Food Catalog for Donors
const foodPresets = {
  croissant: {
    title: 'Fresh Butter Croissants, Baguettes & Danishes Box',
    category: 'BAKED_GOODS',
    amount: 18,
    unit: 'PORTIONS',
    dietary: 'VEGETARIAN',
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1000&q=80',
    description: 'Crisp morning baked surplus croissants and pain au chocolat. Packed safely in paper containers.'
  },
  biryani: {
    title: 'Hot Dum Biryani with Gravy & Raita Trays',
    category: 'COOKED_MEALS',
    amount: 25,
    unit: 'PORTIONS',
    dietary: 'VEGETARIAN',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1000&q=80',
    description: 'Fresh executive lunch banquet surplus biryani with saffron and spices. Kept hot in insulated warming trays.'
  },
  sandwich: {
    title: 'Artisan Whole-Wheat Deli Club Sandwiches',
    category: 'COOKED_MEALS',
    amount: 12,
    unit: 'PORTIONS',
    dietary: 'VEGETARIAN',
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1000&q=80',
    description: 'Toasted gourmet deli sandwiches with crisp lettuce, fresh cheese, and cucumber herb spread.'
  },
  pizza: {
    title: 'Woodfired Margherita & Truffle Mushroom Pizzas',
    category: 'COOKED_MEALS',
    amount: 8,
    unit: 'PACKETS',
    dietary: 'VEGETARIAN',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1000&q=80',
    description: 'Fresh 12-inch sourdough crust pizzas with buffalo mozzarella and basil.'
  },
  fruits: {
    title: 'Farm Fresh Organic Fruit & Avocado Crate',
    category: 'GROCERIES',
    amount: 10,
    unit: 'KG',
    dietary: 'VEGAN',
    imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1000&q=80',
    description: 'Juicy organic apples, bananas, and ripe avocados from today\'s fresh market supply.'
  },
  juice: {
    title: 'Cold-Pressed Valencia Orange & Green Detox Juices',
    category: 'BEVERAGES',
    amount: 16,
    unit: 'PACKETS',
    dietary: 'VEGAN',
    imageUrl: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=1000&q=80',
    description: 'Sealed cold-pressed glass bottles of raw juices prepared fresh today.'
  }
};

// Vector SVG Icons for Map Pins (Zero raw emojis)
const categoryPinSvgs = {
  COOKED_MEALS: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 2v2m-6 4v12a2 2 0 002 2h8a2 2 0 002-2V8M4 8h16M7 4v2m10-2v2"></path></svg>`,
  BAKED_GOODS: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 15.5a5 5 0 01-7 4.5 5 5 0 01-7-4.5 4 4 0 018-2 4 4 0 016 2z"></path></svg>`,
  GROCERIES: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 21a9 9 0 009-9H3a9 9 0 009 9zM12 3v9"></path></svg>`,
  BEVERAGES: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"></path></svg>`,
  PACKAGED: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>`,
};

// ==============================================================================
// 1. Initialization
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  loadStoredAuth();
  initMap();
  initSocket();
  fetchListings();
  fetchImpactStats();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userCoords = [pos.coords.latitude, pos.coords.longitude];
        if (map) map.setView(userCoords, 13);
      },
      (err) => console.log('Location info:', err.message)
    );
  }
});

// Sound Effect Generator using Web Audio API
function playSound(type = 'success') {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } else {
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.setValueAtTime(200, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    }
  } catch (e) {
    // Audio context may require user interaction
  }
}

// ==============================================================================
// 2. Leaflet Interactive Map
// ==============================================================================
function initMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  map = L.map('map').setView(userCoords, 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
}

function updateMapMarkers() {
  if (!markersLayer) return;
  markersLayer.clearLayers();

  const filtered = getFilteredListings();

  filtered.forEach((item) => {
    if (!item.location || !item.location.coordinates) return;
    const [lng, lat] = item.location.coordinates;

    const categoryPinClass = {
      COOKED_MEALS: 'pin-cooked',
      BAKED_GOODS: 'pin-baked',
      GROCERIES: 'pin-groceries',
      BEVERAGES: 'pin-beverages',
      PACKAGED: 'pin-packaged',
    }[item.category] || 'pin-cooked';

    const pinIconSvg = categoryPinSvgs[item.category] || categoryPinSvgs.COOKED_MEALS;

    const customIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="custom-pin ${categoryPinClass}">${pinIconSvg}</div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    const isAvailable = item.status === 'AVAILABLE';

    const popupContent = `
      <div class="text-slate-900 space-y-2 p-1 min-w-[210px]">
        <img src="${item.imageUrl}" class="w-full h-24 object-cover rounded-xl mb-1">
        <div class="font-extrabold text-sm leading-snug">${item.title}</div>
        <div class="text-xs text-slate-500 font-semibold">Location: ${item.pickupAddress}</div>
        <div class="flex items-center justify-between text-xs font-bold pt-1">
          <span class="text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
            ${item.quantity.amount} ${item.quantity.unit}
          </span>
          <span class="text-amber-700 font-bold">${getTimeRemaining(item.expiresAt)}</span>
        </div>
        <div class="pt-2">
          ${
            isAvailable
              ? `<button onclick="claimFood('${item._id}')" class="w-full text-center py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition">
                  Claim Rescue Dish
                </button>`
              : `<span class="block text-center py-1 bg-slate-100 text-slate-400 text-xs rounded-xl font-bold">${item.status}</span>`
          }
        </div>
      </div>
    `;

    const marker = L.marker([lat, lng], { icon: customIcon }).bindPopup(popupContent);
    markersLayer.addLayer(marker);
  });
}

function locateUserPosition() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      userCoords = [pos.coords.latitude, pos.coords.longitude];
      if (map) {
        map.setView(userCoords, 14);
        L.marker(userCoords)
          .addTo(map)
          .bindPopup('<b>Current Location</b>')
          .openPopup();
      }
      showToast('Centered on your GPS location!', 'success');
    });
  } else {
    showToast('Geolocation not available in this browser', 'error');
  }
}

// ==============================================================================
// 3. Socket.io Real-Time Synchronization
// ==============================================================================
function initSocket() {
  if (typeof io === 'undefined') return;

  socket = io();

  socket.on('new_food_available', (listing) => {
    playSound('success');
    showToast(`New Food Alert: "${listing.title}" just posted!`, 'info');
    fetchListings();
    fetchImpactStats();
  });

  socket.on('listing_updated', (data) => {
    if (data.status === 'RESERVED') {
      showToast(`Dish reserved by a community member`, 'info');
    }
    fetchListings();
  });

  socket.on('pickup_completed', (data) => {
    playSound('success');
    showToast(`Custody Handshake completed for "${data.title}"!`, 'success');
    if (window.confetti) {
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.7 } });
    }
    fetchListings();
    fetchImpactStats();
  });

  socket.on('listings_refreshed', () => {
    fetchListings();
    fetchImpactStats();
  });
}

// ==============================================================================
// 4. API Calls & Clean Vector Cards
// ==============================================================================
async function fetchListings() {
  try {
    const res = await fetch('/api/listings');
    const data = await res.json();
    if (data.success) {
      listings = data.data;
      renderListings();
      updateMapMarkers();
      const statElem = document.getElementById('statActive');
      if (statElem) statElem.innerText = listings.length;
    }
  } catch (error) {
    console.error('Failed to fetch listings:', error);
  }
}

function getFilteredListings() {
  const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();

  return listings.filter((item) => {
    const matchesCategory = currentCategory === 'ALL' || item.category === currentCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm) ||
      item.pickupAddress.toLowerCase().includes(searchTerm) ||
      (item.donor?.name || '').toLowerCase().includes(searchTerm);

    const matchesVeg = !isVegOnly || (item.dietaryInfo && (item.dietaryInfo.includes('VEGETARIAN') || item.dietaryInfo.includes('VEGAN')));

    return matchesCategory && matchesSearch && matchesVeg;
  });
}

function renderListings() {
  const container = document.getElementById('listingsFeed');
  if (!container) return;

  const filtered = getFilteredListings();
  const badgeElem = document.getElementById('listingCountBadge');
  if (badgeElem) badgeElem.innerText = filtered.length;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-16 bg-white rounded-3xl border border-slate-200">
        <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
          <i data-lucide="package-open" class="w-6 h-6"></i>
        </div>
        <p class="text-base font-bold text-slate-700">No active surplus dishes found in this filter.</p>
        <p class="text-xs text-slate-400 mt-1">Try switching categories, or click "Load Gourmet Dishes" at the top.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = filtered
    .map((item) => {
      const timeLeft = getTimeRemaining(item.expiresAt);
      const isAvailable = item.status === 'AVAILABLE';
      const isVeg = item.dietaryInfo && (item.dietaryInfo.includes('VEGETARIAN') || item.dietaryInfo.includes('VEGAN'));

      const fallbackImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
      const displayImage = item.imageUrl || fallbackImage;

      return `
        <div class="food-card bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs flex flex-col justify-between">
          
          <!-- Food Image with Badges -->
          <div class="food-img-wrapper h-48 sm:h-52 w-full bg-slate-100 relative">
            <img src="${displayImage}" alt="${item.title}" class="food-img w-full h-full object-cover">
            
            <!-- Top Badges Overlay -->
            <div class="absolute top-3 left-3 flex items-center gap-1.5 z-10">
              <span class="${isVeg ? 'veg-icon' : 'non-veg-icon'} shadow-xs" title="${isVeg ? 'Vegetarian' : 'Non-Vegetarian'}">
                <span class="dot"></span>
              </span>
              <span class="text-[11px] font-bold bg-white/95 backdrop-blur-md text-slate-900 px-2.5 py-0.5 rounded-full shadow-xs">
                ${item.category.replace('_', ' ')}
              </span>
            </div>

            <!-- Urgency Countdown Badge -->
            <div class="absolute top-3 right-3 z-10">
              <span class="text-[11px] font-bold bg-slate-950/80 backdrop-blur-md text-amber-300 px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                <i data-lucide="clock" class="w-3 h-3 text-amber-400"></i>
                <span>${timeLeft}</span>
              </span>
            </div>

            <!-- Free Rescue Price Tag (Bottom Left of Image) -->
            <div class="absolute bottom-3 left-3 z-10">
              <span class="text-xs font-bold bg-brand-600 text-white px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                <i data-lucide="heart" class="w-3 h-3 fill-white"></i>
                <span>100% Free Rescue</span>
              </span>
            </div>

            <!-- Portions Badge (Bottom Right of Image) -->
            <div class="absolute bottom-3 right-3 z-10">
              <span class="text-xs font-bold bg-white/95 backdrop-blur-md text-slate-900 px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                <i data-lucide="layers" class="w-3 h-3 text-brand-600"></i>
                <span>${item.quantity.amount} ${item.quantity.unit}</span>
              </span>
            </div>
          </div>

          <!-- Card Content Body -->
          <div class="p-5 flex-1 flex flex-col justify-between space-y-3">
            
            <div class="space-y-1.5">
              <!-- Donor Brand & Verified Checkmark -->
              <div class="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span class="flex items-center gap-1.5 text-slate-700 font-bold">
                  <i data-lucide="store" class="w-3.5 h-3.5 text-brand-600"></i>
                  ${item.donor?.name || 'Local Kitchen'}
                </span>
                <span class="text-slate-400 flex items-center gap-1">
                  <i data-lucide="map-pin" class="w-3 h-3 text-slate-400"></i>
                  Near Indiranagar
                </span>
              </div>

              <!-- Title -->
              <h3 class="font-bold text-slate-900 text-base leading-tight font-heading">${item.title}</h3>
              
              <!-- Description -->
              ${
                item.description
                  ? `<p class="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">${item.description}</p>`
                  : ''
              }
            </div>

            <!-- Card Bottom Bar & Claim Action -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div class="text-[11px] text-slate-400 font-medium truncate max-w-[170px]">
                ${item.pickupAddress}
              </div>

              <div>
                ${
                  isAvailable
                    ? `<button onclick="claimFood('${item._id}')" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer">
                        <i data-lucide="hand" class="w-3.5 h-3.5"></i>
                        <span>Claim Dish</span>
                      </button>`
                    : `<span class="inline-block px-3 py-1.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold">${item.status}</span>`
                }
              </div>
            </div>

          </div>

        </div>
      `;
    })
    .join('');

  if (window.lucide) lucide.createIcons();
}

function getTimeRemaining(endTimeString) {
  const diff = new Date(endTimeString) - new Date();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left (Urgent)`;
}

// Category filter
function setCategoryFilter(category) {
  currentCategory = category;
  document.querySelectorAll('.filter-chip').forEach((pill) => {
    pill.classList.remove('active', 'bg-brand-700', 'text-white');
    pill.classList.add('bg-slate-100', 'text-slate-700');
  });

  const activeBtn = event.currentTarget;
  activeBtn.classList.remove('bg-slate-100', 'text-slate-700');
  activeBtn.classList.add('active', 'bg-brand-700', 'text-white');

  renderListings();
  updateMapMarkers();
}

// Veg Only Toggle
function toggleVegOnly() {
  isVegOnly = !isVegOnly;
  const btn = document.getElementById('vegOnlyToggle');
  if (isVegOnly) {
    btn.classList.remove('bg-slate-50', 'text-slate-700', 'border-slate-200');
    btn.classList.add('bg-emerald-100', 'text-emerald-900', 'border-emerald-300');
  } else {
    btn.classList.remove('bg-emerald-100', 'text-emerald-900', 'border-emerald-300');
    btn.classList.add('bg-slate-50', 'text-slate-700', 'border-slate-200');
  }
  renderListings();
}

// Layout Switcher (Split vs Grid vs Map)
function setLayoutView(layout) {
  currentLayout = layout;
  const mapWrapper = document.getElementById('mapWrapper');
  const cardsWrapper = document.getElementById('cardsWrapper');

  document.querySelectorAll('#btnViewSplit, #btnViewGrid, #btnViewMap').forEach(btn => {
    btn.classList.remove('bg-white', 'text-slate-900', 'shadow-xs');
    btn.classList.add('text-slate-500');
  });

  if (layout === 'split') {
    mapWrapper.classList.remove('hidden');
    cardsWrapper.classList.remove('hidden');
    mapWrapper.className = 'lg:col-span-5 bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 space-y-2 sticky top-24';
    cardsWrapper.className = 'lg:col-span-7 space-y-4';
    document.getElementById('btnViewSplit').classList.add('bg-white', 'text-slate-900', 'shadow-xs');
  } else if (layout === 'grid') {
    mapWrapper.classList.add('hidden');
    cardsWrapper.classList.remove('hidden');
    cardsWrapper.className = 'col-span-full space-y-4';
    document.getElementById('btnViewGrid').classList.add('bg-white', 'text-slate-900', 'shadow-xs');
  } else if (layout === 'map') {
    cardsWrapper.classList.add('hidden');
    mapWrapper.classList.remove('hidden');
    mapWrapper.className = 'col-span-full bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 space-y-2';
    document.getElementById('btnViewMap').classList.add('bg-white', 'text-slate-900', 'shadow-xs');
  }

  if (map) {
    setTimeout(() => map.invalidateSize(), 200);
  }
}

// 1-Click Preset Food Selector in Form
function selectPreset(type) {
  const preset = foodPresets[type];
  if (!preset) return;

  document.getElementById('postTitle').value = preset.title;
  document.getElementById('postCategory').value = preset.category;
  document.getElementById('postQuantityAmount').value = preset.amount;
  document.getElementById('postQuantityUnit').value = preset.unit;
  document.getElementById('postDietary').value = preset.dietary;
  document.getElementById('postImageUrl').value = preset.imageUrl;
  document.getElementById('postDescription').value = preset.description;

  document.querySelectorAll('.preset-thumb').forEach(el => el.classList.remove('selected'));
  event.currentTarget.classList.add('selected');

  showToast(`Auto-populated preset: ${preset.title}`, 'success');
}

// ==============================================================================
// 5. Reservation & Claiming Handshake
// ==============================================================================
async function claimFood(listingId) {
  if (!currentToken) {
    showToast('Please log in first to claim surplus food', 'info');
    openAuthModal('login');
    return;
  }

  try {
    const res = await fetch('/api/claims', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify({ listingId }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to claim food');

    playSound('success');

    if (window.confetti) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    document.getElementById('claimModalListingTitle').innerText = data.data.listingTitle;
    document.getElementById('claimModalOtp').innerText = data.data.verificationOtp;
    document.getElementById('claimModalAddress').innerText = data.data.pickupAddress;
    document.getElementById('claimModal').classList.remove('hidden');

    showToast('Food successfully reserved! Present your 6-digit OTP upon arrival.', 'success');
    fetchListings();
    fetchMyClaims();
  } catch (error) {
    playSound('error');
    showToast(error.message, 'error');
  }
}

function closeClaimModal() {
  document.getElementById('claimModal').classList.add('hidden');
}

async function fetchMyClaims() {
  if (!currentToken) return;

  try {
    const res = await fetch('/api/claims/my-claims', {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    const data = await res.json();
    if (data.success) {
      myClaims = data.data;
      renderMyClaims();
    }
  } catch (err) {
    console.error('Failed to fetch claims:', err);
  }
}

function renderMyClaims() {
  const container = document.getElementById('myClaimsFeed');
  if (!container) return;

  if (myClaims.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 bg-white rounded-3xl border border-slate-200">
        <p class="text-sm font-semibold text-slate-500">No active reservation passes found.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = myClaims
    .map((c) => {
      const isCompleted = c.status === 'COMPLETED';
      return `
        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <img src="${c.listing?.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80'}" class="w-16 h-16 rounded-2xl object-cover">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-black px-2.5 py-0.5 rounded-full ${
                  isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }">${c.status}</span>
                <span class="text-xs text-slate-400 font-medium">Reserved ${new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <h4 class="font-bold text-slate-900 text-base mt-1 font-heading">${c.listing?.title || 'Surplus Item'}</h4>
              <p class="text-xs text-slate-500">Location: ${c.listing?.pickupAddress || 'Pickup address'}</p>
            </div>
          </div>

          <div class="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-2.5 text-center min-w-[150px]">
            <span class="text-[10px] uppercase font-black text-slate-400 tracking-wider">Custody Handshake OTP</span>
            <div class="text-2xl font-black font-mono text-brand-700 tracking-widest">${c.verificationOtp}</div>
          </div>
        </div>
      `;
    })
    .join('');
}

// ==============================================================================
// 6. Donor Verification (OTP Handshake Input)
// ==============================================================================
async function handleVerifyOTP(e) {
  e.preventDefault();
  if (!currentToken) {
    showToast('Please log in as a donor to verify pickups', 'error');
    openAuthModal('login');
    return;
  }

  const otp = document.getElementById('verifyOtpInput').value.trim();
  if (!otp || otp.length !== 6) {
    showToast('Please enter a valid 6-digit OTP', 'error');
    return;
  }

  try {
    const pendingRes = await fetch('/api/claims/donor-pending', {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    const pendingData = await pendingRes.json();

    if (!pendingData.success || pendingData.data.length === 0) {
      showToast('No pending claims found for your donor account', 'error');
      return;
    }

    const matchingClaim = pendingData.data.find(
      (c) => c.verificationOtp === otp && c.status === 'PENDING_PICKUP'
    );

    if (!matchingClaim) {
      showToast('Invalid OTP or no matching reservation found', 'error');
      return;
    }

    const verifyRes = await fetch('/api/claims/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify({ claimId: matchingClaim._id, otp }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) throw new Error(verifyData.message || 'Verification failed');

    playSound('success');

    if (window.confetti) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });
    }

    showToast(`Verified! Pickup completed for "${verifyData.data.listing}"`, 'success');
    document.getElementById('verifyOtpInput').value = '';
    fetchListings();
    fetchImpactStats();
  } catch (error) {
    playSound('error');
    showToast(error.message, 'error');
  }
}

// ==============================================================================
// 7. Post Surplus Food (Donor Hub)
// ==============================================================================
async function handlePostFood(e) {
  e.preventDefault();

  if (!currentToken) {
    showToast('Please log in as a Donor to post surplus food', 'info');
    openAuthModal('login');
    return;
  }

  const title = document.getElementById('postTitle').value;
  const category = document.getElementById('postCategory').value;
  const quantityAmount = document.getElementById('postQuantityAmount').value;
  const quantityUnit = document.getElementById('postQuantityUnit').value;
  const expiresInHours = document.getElementById('postExpiresIn').value;
  const dietary = document.getElementById('postDietary').value;
  const pickupAddress = document.getElementById('postPickupAddress').value;
  const imageUrl = document.getElementById('postImageUrl').value;
  const description = document.getElementById('postDescription').value;

  try {
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify({
        title,
        category,
        quantity: { amount: quantityAmount, unit: quantityUnit },
        expiresInHours,
        dietaryInfo: [dietary],
        pickupAddress,
        imageUrl,
        description,
        coordinates: [userCoords[1], userCoords[0]],
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to post food');

    playSound('success');
    showToast('Food listing published to live map!', 'success');
    document.getElementById('postFoodForm').reset();
    switchTab('explore');
    fetchListings();
  } catch (error) {
    playSound('error');
    showToast(error.message, 'error');
  }
}

// ==============================================================================
// 8. Impact Stats
// ==============================================================================
async function fetchImpactStats() {
  try {
    const res = await fetch('/api/impact');
    const data = await res.json();
    if (data.success) {
      const stats = data.data;
      document.getElementById('statMeals').innerText = `${stats.mealsRescued}+`;
      document.getElementById('statKg').innerText = `${stats.foodDivertedKg} kg`;
      document.getElementById('statCo2').innerText = `${stats.co2PreventedKg} kg`;

      document.getElementById('impactDetailMeals').innerText = stats.mealsRescued;
      document.getElementById('impactDetailKg').innerText = `${stats.foodDivertedKg} kg`;
      document.getElementById('impactDetailCo2').innerText = `${stats.co2PreventedKg} kg`;
    }
  } catch (error) {
    console.error('Impact fetch error:', error);
  }
}

// ==============================================================================
// 9. Instant Database Seeder
// ==============================================================================
async function seedDemoData() {
  const btn = document.getElementById('seedDataBtn');
  btn.innerHTML = `<span class="animate-spin inline-block mr-1.5"><i data-lucide="loader-2" class="w-3.5 h-3.5"></i></span> Loading Dishes...`;
  btn.disabled = true;

  try {
    const res = await fetch('/api/seed', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      playSound('success');
      showToast('Gourmet dishes loaded onto the map!', 'success');
      fetchListings();
      fetchImpactStats();
    }
  } catch (err) {
    playSound('error');
    showToast('Seeding error: ' + err.message, 'error');
  } finally {
    btn.innerHTML = `<i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-600"></i><span>Load Gourmet Dishes</span>`;
    btn.disabled = false;
    if (window.lucide) lucide.createIcons();
  }
}

// ==============================================================================
// 10. Authentication & Profile
// ==============================================================================
function loadStoredAuth() {
  const token = localStorage.getItem('resq_token');
  const user = localStorage.getItem('resq_user');
  if (token && user) {
    currentToken = token;
    currentUser = JSON.parse(user);
    updateAuthUI();
  }
}

function updateAuthUI() {
  const authActions = document.getElementById('authActions');
  const userProfile = document.getElementById('userProfile');

  if (currentUser) {
    authActions.classList.add('hidden');
    userProfile.classList.remove('hidden');
    document.getElementById('userName').innerText = currentUser.name;
    document.getElementById('userRoleBadge').innerText = currentUser.role;
  } else {
    authActions.classList.remove('hidden');
    userProfile.classList.add('hidden');
  }
}

function openAuthModal(mode = 'login') {
  authMode = mode;
  const modal = document.getElementById('authModal');
  const title = document.getElementById('authModalTitle');
  const nameField = document.getElementById('nameFieldContainer');
  const roleField = document.getElementById('roleFieldContainer');
  const submitBtn = document.getElementById('authSubmitBtn');
  const toggleBtn = document.getElementById('toggleAuthModeBtn');

  if (mode === 'register') {
    title.innerText = 'Create ResQFood Account';
    nameField.classList.remove('hidden');
    roleField.classList.remove('hidden');
    submitBtn.innerText = 'Sign Up';
    toggleBtn.innerText = 'Already have an account? Log In';
  } else {
    title.innerText = 'Log In to ResQFood';
    nameField.classList.add('hidden');
    roleField.classList.add('hidden');
    submitBtn.innerText = 'Log In';
    toggleBtn.innerText = "Don't have an account? Sign Up";
  }

  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeAuthModal() {
  document.getElementById('authModal').classList.add('hidden');
}

function toggleAuthMode() {
  openAuthModal(authMode === 'login' ? 'register' : 'login');
}

async function quickLogin(email, password) {
  document.getElementById('authEmail').value = email;
  document.getElementById('authPassword').value = password;
  await performLogin(email, password);
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;

  if (authMode === 'login') {
    await performLogin(email, password);
  } else {
    const name = document.getElementById('authName').value;
    const role = document.getElementById('authRole').value;
    await performRegister(name, email, password, role);
  }
}

async function performLogin(email, password) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    currentToken = data.token;
    currentUser = data.user;
    localStorage.setItem('resq_token', currentToken);
    localStorage.setItem('resq_user', JSON.stringify(currentUser));

    playSound('success');
    updateAuthUI();
    closeAuthModal();
    showToast(`Welcome back, ${currentUser.name}!`, 'success');
    fetchMyClaims();
  } catch (err) {
    playSound('error');
    showToast(err.message, 'error');
  }
}

async function performRegister(name, email, password, role) {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        coordinates: [userCoords[1], userCoords[0]],
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    currentToken = data.token;
    currentUser = data.user;
    localStorage.setItem('resq_token', currentToken);
    localStorage.setItem('resq_user', JSON.stringify(currentUser));

    playSound('success');
    updateAuthUI();
    closeAuthModal();
    showToast(`Account created! Welcome, ${currentUser.name}!`, 'success');
  } catch (err) {
    playSound('error');
    showToast(err.message, 'error');
  }
}

function logout() {
  currentToken = null;
  currentUser = null;
  localStorage.removeItem('resq_token');
  localStorage.removeItem('resq_user');
  updateAuthUI();
  showToast('Logged out successfully', 'info');
}

// ==============================================================================
// 11. Navigation Tabs & UI Helpers
// ==============================================================================
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach((tab) => tab.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.remove('active', 'text-brand-700', 'border-b-2', 'border-brand-600');
    btn.classList.add('text-slate-500');
  });

  const targetView = document.getElementById(`view-${tabId}`);
  const targetTab = document.getElementById(`tab-${tabId}`);

  if (targetView) targetView.classList.remove('hidden');
  if (targetTab) {
    targetTab.classList.add('active', 'text-brand-700', 'border-b-2', 'border-brand-600');
    targetTab.classList.remove('text-slate-500');
  }

  if (tabId === 'explore' && map) {
    setTimeout(() => map.invalidateSize(), 150);
  }

  if (tabId === 'claims') {
    fetchMyClaims();
  }
  if (window.lucide) lucide.createIcons();
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const bgColors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-slate-900 text-white',
  }[type] || 'bg-slate-900 text-white';

  const toast = document.createElement('div');
  toast.className = `${bgColors} px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-2 transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto max-w-sm`;
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
