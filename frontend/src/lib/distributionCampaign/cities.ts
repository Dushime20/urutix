import type { CorridorCity } from './types';

/** Northern Corridor + EAC cities used to explode a cargo-owner intent. */
export const CORRIDOR_CITIES: CorridorCity[] = [
  { id: 'kigali', name: 'Kigali', country: 'Rwanda', countryCode: 'RW', lat: -1.9441, lng: 30.0619 },
  { id: 'musanze', name: 'Musanze', country: 'Rwanda', countryCode: 'RW', lat: -1.4996, lng: 29.635 },
  { id: 'huye', name: 'Huye', country: 'Rwanda', countryCode: 'RW', lat: -2.5967, lng: 29.7394 },
  { id: 'rubavu', name: 'Rubavu', country: 'Rwanda', countryCode: 'RW', lat: -1.702, lng: 29.256 },
  { id: 'nairobi', name: 'Nairobi', country: 'Kenya', countryCode: 'KE', lat: -1.2921, lng: 36.8219 },
  { id: 'mombasa', name: 'Mombasa', country: 'Kenya', countryCode: 'KE', lat: -4.0435, lng: 39.6682 },
  { id: 'kisumu', name: 'Kisumu', country: 'Kenya', countryCode: 'KE', lat: -0.0917, lng: 34.768 },
  { id: 'nakuru', name: 'Nakuru', country: 'Kenya', countryCode: 'KE', lat: -0.3031, lng: 36.08 },
  { id: 'eldoret', name: 'Eldoret', country: 'Kenya', countryCode: 'KE', lat: 0.5143, lng: 35.2698 },
  { id: 'kampala', name: 'Kampala', country: 'Uganda', countryCode: 'UG', lat: 0.3476, lng: 32.5825 },
  { id: 'jinja', name: 'Jinja', country: 'Uganda', countryCode: 'UG', lat: 0.4244, lng: 33.2041 },
  { id: 'mbarara', name: 'Mbarara', country: 'Uganda', countryCode: 'UG', lat: -0.6072, lng: 30.6545 },
  { id: 'gulu', name: 'Gulu', country: 'Uganda', countryCode: 'UG', lat: 2.7747, lng: 32.299 },
  { id: 'dar', name: 'Dar es Salaam', country: 'Tanzania', countryCode: 'TZ', lat: -6.7924, lng: 39.2083 },
  { id: 'arusha', name: 'Arusha', country: 'Tanzania', countryCode: 'TZ', lat: -3.3869, lng: 36.683 },
  { id: 'mwanza', name: 'Mwanza', country: 'Tanzania', countryCode: 'TZ', lat: -2.5164, lng: 32.9175 },
  { id: 'dodoma', name: 'Dodoma', country: 'Tanzania', countryCode: 'TZ', lat: -6.163, lng: 35.7516 },
  { id: 'bujumbura', name: 'Bujumbura', country: 'Burundi', countryCode: 'BI', lat: -3.3614, lng: 29.3599 },
  { id: 'goma', name: 'Goma', country: 'DR Congo', countryCode: 'CD', lat: -1.6585, lng: 29.2205 },
  { id: 'juba', name: 'Juba', country: 'South Sudan', countryCode: 'SS', lat: 4.8594, lng: 31.5713 },
  { id: 'entebbe', name: 'Entebbe', country: 'Uganda', countryCode: 'UG', lat: 0.0512, lng: 32.4637 },
];

export const cityById = (id: string): CorridorCity | undefined =>
  CORRIDOR_CITIES.find((city) => city.id === id);

export const defaultDestinationIds = (originCityId: string): string[] =>
  CORRIDOR_CITIES.filter((city) => city.id !== originCityId)
    .slice(0, 20)
    .map((city) => city.id);
