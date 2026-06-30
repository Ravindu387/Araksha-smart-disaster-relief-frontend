export interface Shelter {
  id?: number;
  name: string;
  address: string;
  capacity: number;
  occupied: number;
  status: 'Available' | 'Limited' | 'Full' | string;
  amenities: string[];       // frontend-friendly array form
  latitude?: number;
  longitude?: number;
  lastUpdated?: string;
}

// Shape the backend actually sends/receives (amenities as comma-separated string)
export interface ShelterDTO {
  id?: number;
  name: string;
  address: string;
  capacity: number;
  occupied: number;
  status?: string;
  amenities: string;
  latitude?: number;
  longitude?: number;
  lastUpdated?: string;
}