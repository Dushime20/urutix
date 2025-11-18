// Route Intelligence Service - Provides smart insights for route creation
export interface RouteInsight {
  distance: number;
  estimatedTime: number;
  fuelCost: number;
  tollCost: number;
  trafficLevel: 'light' | 'moderate' | 'heavy';
  routeType: 'highway' | 'city' | 'rural';
  priority: 'high' | 'medium' | 'low';
  weatherConditions?: string;
  borderCrossings?: string[];
  alternativeRoutes?: string[];
  bestTravelTimes?: string[];
  truckRestrictions?: string[];
}

// East African Route Database
const ROUTE_DATABASE: Record<string, RouteInsight> = {
  // Uganda - Rwanda Routes
  'kampala-kigali': {
    distance: 375,
    estimatedTime: 5,
    fuelCost: 85000,
    tollCost: 25000,
    trafficLevel: 'moderate',
    routeType: 'highway',
    priority: 'high',
    weatherConditions: 'Generally good, rainy season May-October',
    borderCrossings: ['Katuna/Gatuna Border'],
    alternativeRoutes: ['Via Mbarara-Ntungamo', 'Via Kabale'],
    bestTravelTimes: ['6:00-8:00 AM', '2:00-4:00 PM'],
    truckRestrictions: ['Weight limit: 56 tons', 'Height limit: 4.3m']
  },
  'kigali-kampala': {
    distance: 375,
    estimatedTime: 5,
    fuelCost: 85000,
    tollCost: 25000,
    trafficLevel: 'moderate',
    routeType: 'highway',
    priority: 'high',
    weatherConditions: 'Generally good, rainy season May-October',
    borderCrossings: ['Gatuna/Katuna Border'],
    alternativeRoutes: ['Via Nyagatare-Kabale', 'Via Rusizi-Mbarara'],
    bestTravelTimes: ['5:00-7:00 AM', '1:00-3:00 PM'],
    truckRestrictions: ['Weight limit: 56 tons', 'Height limit: 4.3m']
  },

  // Uganda - Kenya Routes
  'kampala-nairobi': {
    distance: 485,
    estimatedTime: 7,
    fuelCost: 120000,
    tollCost: 35000,
    trafficLevel: 'moderate',
    routeType: 'highway',
    priority: 'high',
    weatherConditions: 'Dry conditions most of year, short rains in Nov-Dec',
    borderCrossings: ['Malaba Border', 'Busia Border'],
    alternativeRoutes: ['Via Tororo-Malaba', 'Via Iganga-Busia'],
    bestTravelTimes: ['4:00-6:00 AM', '7:00-9:00 PM'],
    truckRestrictions: ['Weight limit: 48 tons', 'Axle load: 18 tons']
  },
  'nairobi-kampala': {
    distance: 485,
    estimatedTime: 7,
    fuelCost: 120000,
    tollCost: 35000,
    trafficLevel: 'moderate',
    routeType: 'highway',
    priority: 'high',
    weatherConditions: 'Dry conditions most of year, short rains in Nov-Dec',
    borderCrossings: ['Malaba Border', 'Busia Border'],
    alternativeRoutes: ['Via Malaba-Tororo', 'Via Busia-Iganga'],
    bestTravelTimes: ['3:00-5:00 AM', '6:00-8:00 PM'],
    truckRestrictions: ['Weight limit: 48 tons', 'Axle load: 18 tons']
  },

  // Kenya Routes
  'nairobi-mombasa': {
    distance: 485,
    estimatedTime: 6,
    fuelCost: 95000,
    tollCost: 15000,
    trafficLevel: 'heavy',
    routeType: 'highway',
    priority: 'high',
    weatherConditions: 'Hot and humid near coast, cooler inland',
    borderCrossings: [],
    alternativeRoutes: ['Old Mombasa Road', 'Via Machakos'],
    bestTravelTimes: ['5:00-7:00 AM', '8:00-10:00 PM'],
    truckRestrictions: ['Weight limit: 48 tons', 'Night driving restrictions in some areas']
  },
  'mombasa-nairobi': {
    distance: 485,
    estimatedTime: 6,
    fuelCost: 95000,
    tollCost: 15000,
    trafficLevel: 'heavy',
    routeType: 'highway',
    priority: 'high',
    weatherConditions: 'Hot and humid near coast, cooler inland',
    borderCrossings: [],
    alternativeRoutes: ['Old Mombasa Road', 'Via Machakos'],
    bestTravelTimes: ['4:00-6:00 AM', '7:00-9:00 PM'],
    truckRestrictions: ['Weight limit: 48 tons', 'Night driving restrictions in some areas']
  },

  // Rwanda - Tanzania Routes
  'kigali-dar-es-salaam': {
    distance: 1456,
    estimatedTime: 18,
    fuelCost: 250000,
    tollCost: 45000,
    trafficLevel: 'moderate',
    routeType: 'highway',
    priority: 'medium',
    weatherConditions: 'Variable, rainy seasons Mar-May and Oct-Dec',
    borderCrossings: ['Rusumo Border', 'Various TZ checkpoints'],
    alternativeRoutes: ['Via Dodoma', 'Via Arusha-Moshi'],
    bestTravelTimes: ['Early morning departures recommended'],
    truckRestrictions: ['Weight limit varies by country', 'Multiple permits required']
  },

  // Tanzania Routes
  'dar-es-salaam-dodoma': {
    distance: 453,
    estimatedTime: 6,
    fuelCost: 85000,
    tollCost: 20000,
    trafficLevel: 'light',
    routeType: 'highway',
    priority: 'medium',
    weatherConditions: 'Hot and dry, rainy season Nov-Apr',
    borderCrossings: [],
    alternativeRoutes: ['Via Morogoro', 'Southern route'],
    bestTravelTimes: ['6:00-8:00 AM', '4:00-6:00 PM'],
    truckRestrictions: ['Weight limit: 56 tons', 'Good road conditions']
  },

  // Urban routes
  'kampala-entebbe': {
    distance: 42,
    estimatedTime: 1,
    fuelCost: 15000,
    tollCost: 0,
    trafficLevel: 'heavy',
    routeType: 'city',
    priority: 'medium',
    weatherConditions: 'Tropical climate, frequent afternoon rains',
    borderCrossings: [],
    alternativeRoutes: ['Entebbe Express Highway', 'Old Entebbe Road'],
    bestTravelTimes: ['5:00-7:00 AM', '9:00-11:00 AM', '2:00-4:00 PM'],
    truckRestrictions: ['Height restrictions on some bridges', 'Time restrictions in city center']
  }
};

export class RouteIntelligenceService {
  // Get insights for a route based on origin and destination
  static getRouteInsights(origin: string, destination: string): RouteInsight | null {
    const routeKey = this.generateRouteKey(origin, destination);
    return ROUTE_DATABASE[routeKey] || null;
  }

  // Generate a standardized route key
  private static generateRouteKey(origin: string, destination: string): string {
    const normalizeCity = (city: string): string => {
      return city.toLowerCase()
        .replace(/,.*$/, '') // Remove country part
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-z-]/g, ''); // Remove special characters
    };

    const normalizedOrigin = normalizeCity(origin);
    const normalizedDestination = normalizeCity(destination);
    
    return `${normalizedOrigin}-${normalizedDestination}`;
  }

  // Get all available routes
  static getAvailableRoutes(): string[] {
    return Object.keys(ROUTE_DATABASE).map(key => {
      const [origin, destination] = key.split('-');
      return `${this.capitalizeCity(origin)} → ${this.capitalizeCity(destination)}`;
    });
  }

  // Capitalize city names for display
  private static capitalizeCity(city: string): string {
    return city.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  // Search for routes containing a city
  static searchRoutesByCity(city: string): RouteInsight[] {
    const normalizedCity = city.toLowerCase().replace(/\s+/g, '-');
    const matchingRoutes: RouteInsight[] = [];

    for (const [key, insight] of Object.entries(ROUTE_DATABASE)) {
      if (key.includes(normalizedCity)) {
        matchingRoutes.push(insight);
      }
    }

    return matchingRoutes;
  }

  // Get route suggestions based on partial input
  static getRouteSuggestions(input: string): string[] {
    const normalizedInput = input.toLowerCase();
    const suggestions: string[] = [];

    for (const key of Object.keys(ROUTE_DATABASE)) {
      const [origin, destination] = key.split('-');
      const originFormatted = this.capitalizeCity(origin);
      const destinationFormatted = this.capitalizeCity(destination);

      if (origin.includes(normalizedInput) || destination.includes(normalizedInput)) {
        suggestions.push(`${originFormatted} → ${destinationFormatted}`);
      }
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  // Calculate estimated costs
  static calculateTotalCost(insight: RouteInsight): number {
    return insight.fuelCost + insight.tollCost;
  }

  // Get route difficulty level
  static getRouteDifficulty(insight: RouteInsight): 'easy' | 'moderate' | 'difficult' {
    const factors = [
      insight.borderCrossings?.length || 0,
      insight.trafficLevel === 'heavy' ? 2 : insight.trafficLevel === 'moderate' ? 1 : 0,
      insight.distance > 1000 ? 2 : insight.distance > 500 ? 1 : 0
    ];

    const totalScore = factors.reduce((sum, factor) => sum + factor, 0);

    if (totalScore <= 2) return 'easy';
    if (totalScore <= 4) return 'moderate';
    return 'difficult';
  }
}
