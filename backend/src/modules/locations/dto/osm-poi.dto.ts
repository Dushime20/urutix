import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class OSMPlaceDto {
  name: string;
  type: string;
  distance: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  openNow?: boolean;
}

export class OSMPlacesResponseDto {
  landmarks: OSMPlaceDto[];
  transportHubs: OSMPlaceDto[];
  commercialAreas: OSMPlaceDto[];
  serviceFacilities: OSMPlaceDto[];
}

export class OSMGeocodingDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}

export class OSMGeocodingResponseDto {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  administrativeAreas: {
    district: string;
    province: string;
    county: string;
    postalCode: string;
    administrativeArea: string;
    subDistrict?: string;
    ward?: string;
    constituency?: string;
  };
  timezone: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}
