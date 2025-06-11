import API_BASE_URL from './api.js'

// Business Configuration System
// This allows the same codebase to be used for multiple locations and business types

export const BUSINESS_TYPES = {
  FOOD_TRUCK: 'food_truck',
  RESTAURANT: 'restaurant',
  BOTH: 'both'
}

export const LOCATION_TYPES = {
  MOBILE: 'mobile',        // Food truck - moves around
  FIXED: 'fixed',          // Restaurant - fixed location
  HYBRID: 'hybrid'         // Both food truck and restaurant
}

// Main business configuration
export const businessConfig = {
  // Business Identity
  businessName: "Fernando's",
  tagline: "Auténtica Comida Mexicana",
  businessType: BUSINESS_TYPES.BOTH,
  
  // Branding
  colors: {
    primary: "#D32F2F",      // Red
    secondary: "#388E3C",    // Green
    accent: "#FFC107",       // Yellow
    cream: "#FFF8E1",
    darkBrown: "#3E2723"
  },
  
  // Logo configuration
  logo: {
    type: 'svg', // 'svg', 'image', or 'text'
    showInHeader: true,
    showInFooter: true
  },

  // Contact Information
  contact: {
    phone: "(217) 255-0210",
    email: "Fernandosfoodtruck1@gmail.com",
    socialMedia: {
      facebook: "https://www.facebook.com/FernandosTacosAndMore/",
      instagram: null,
      twitter: null
    }
  },

  // Locations Configuration
  locations: [
    {
      id: 'food-truck-1',
      name: "Fernando's Food Truck",
      type: LOCATION_TYPES.MOBILE,
      description: "Our original mobile kitchen bringing authentic Mexican flavors to your neighborhood",
      isActive: true,
      isPrimary: true,
      schedule: {
        type: 'variable', // 'fixed' or 'variable'
        note: "Follow us on social media for daily locations!"
      },
      contact: {
        phone: "(217) 255-0210",
        trackingMethod: "social_media" // 'gps', 'social_media', 'website'
      }
    },
    {
      id: 'restaurant-downtown',
      name: "Fernando's Restaurant - Downtown",
      type: LOCATION_TYPES.FIXED,
      description: "Our brick-and-mortar location with expanded seating and full menu",
      isActive: false, // Disabled for now - can be enabled to show multi-location functionality
      isPrimary: false,
      address: {
        street: "123 Main Street",
        city: "Champaign",
        state: "IL",
        zip: "61820",
        coordinates: { lat: 40.1164, lng: -88.2434 }
      },
      schedule: {
        type: 'fixed',
        hours: {
          monday: { open: "11:00", close: "21:00", closed: false },
          tuesday: { open: "11:00", close: "21:00", closed: false },
          wednesday: { open: "11:00", close: "21:00", closed: false },
          thursday: { open: "11:00", close: "21:00", closed: false },
          friday: { open: "11:00", close: "22:00", closed: false },
          saturday: { open: "11:00", close: "22:00", closed: false },
          sunday: { open: "12:00", close: "20:00", closed: false }
        }
      },
      contact: {
        phone: "(217) 255-0211"
      },
      features: ["dine_in", "takeout", "delivery", "catering"]
    }
  ],

  // Features Configuration
  features: {
    onlineOrdering: true,
    catering: true,
    delivery: false,
    reservations: false,
    loyaltyProgram: false,
    giftCards: false,
    mobileApp: false
  },

  // Menu Configuration
  menu: {
    showPrices: true,
    showIngredients: true,
    showNutrition: false,
    showAllergens: false,
    allowCustomization: true,
    showImages: true
  },

  // Catering Configuration
  catering: {
    enabled: true,
    minimumOrder: 50,
    advanceNotice: "48 hours",
    serviceRadius: "30 miles",
    packages: [
      {
        name: "Taco Bar",
        price: 12,
        description: "Perfect for casual gatherings"
      },
      {
        name: "Fiesta Package",
        price: 18,
        description: "Most popular - includes sides and drinks",
        featured: true
      },
      {
        name: "Premium Experience",
        price: 25,
        description: "Full service with premium options"
      }
    ]
  },

  // SEO and Marketing
  seo: {
    title: "Fernando's Authentic Mexican Food",
    description: "Authentic Mexican street food made with love and tradition",
    keywords: ["mexican food", "food truck", "authentic", "tacos", "burritos"]
  }
}

// Location-specific configurations
export const getActiveLocations = () => {
  return businessConfig.locations.filter(location => location.isActive)
}

export const getPrimaryLocation = () => {
  return businessConfig.locations.find(location => location.isPrimary)
}

export const getLocationById = (id) => {
  return businessConfig.locations.find(location => location.id === id)
}

// Business type helpers
export const isFoodTruckBusiness = () => {
  return businessConfig.businessType === BUSINESS_TYPES.FOOD_TRUCK || 
         businessConfig.businessType === BUSINESS_TYPES.BOTH
}

export const isRestaurantBusiness = () => {
  return businessConfig.businessType === BUSINESS_TYPES.RESTAURANT || 
         businessConfig.businessType === BUSINESS_TYPES.BOTH
}

export const hasMultipleLocations = () => {
  return getActiveLocations().length > 1
}

// Environment-specific overrides
export const getEnvironmentConfig = () => {
  const env = import.meta.env.MODE || 'development'
  
  const envConfigs = {
    development: {
      apiUrl: 'http://localhost:3001',
      enableDebug: true
    },
    production: {
      apiUrl: API_BASE_URL,
      enableDebug: false
    }
  }
  
  return envConfigs[env] || envConfigs.development
} 