// Haversine formula for calculating great-circle distance between two points
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // returns distance in meters
}

// Find nearest site within maxDistance (meters) of a location
export function findNearestSite(lat: number, lng: number, sites: Array<any>, maxDistance = 500): { id: number; distance: number } | null {
  if (!sites?.length) return null;

  let nearest = null;
  let minDistance = Infinity;

  for (const site of sites) {
    // Skip sites without valid coordinates
    if (!site?.latitude || !site?.longitude) continue;

    const distance = haversineDistance(lat, lng, site.latitude, site.longitude);
    if (distance < minDistance && distance <= maxDistance) {
      minDistance = distance;
      nearest = { id: site.id, distance };
    }
  }

  return nearest;
}

// Convert agent location to a standard format
export function normalizeAgentLocation(location: any): { lat: number; lng: number } | null {
  if (!location) return null;

  // Handle various location formats we might receive
  if (typeof location === 'string') {
    try {
      location = JSON.parse(location);
    } catch (e) {
      return null;
    }
  }

  // Supports: { lat, lng } or { latitude, longitude } or { lat, long }
  const lat = location.lat ?? location.latitude;
  const lng = location.lng ?? location.longitude ?? location.long;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return null;
  }

  return { lat, lng };
}

export type Site = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  guards?: number;
  required_guards?: number;
  active_guards?: number;
  coverage?: number;
};

export type AgentLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
};