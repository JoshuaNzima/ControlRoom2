import { haversineDistance, findNearestSite, normalizeAgentLocation } from '@/utils/geo';

describe('Geo Utilities', () => {
  describe('haversineDistance', () => {
    it('calculates distance between two points', () => {
      // London Eye to Big Ben (about 500m)
      const distance = haversineDistance(51.503324, -0.119543, 51.500729, -0.124625);
      expect(distance).toBeGreaterThan(450);
      expect(distance).toBeLessThan(550);
    });

    it('returns 0 for same point', () => {
      const distance = haversineDistance(51.503324, -0.119543, 51.503324, -0.119543);
      expect(distance).toBe(0);
    });
  });

  describe('findNearestSite', () => {
    const sites = [
      { id: 1, latitude: 51.503324, longitude: -0.119543, name: 'Site A' },
      { id: 2, latitude: 51.500729, longitude: -0.124625, name: 'Site B' },
      { id: 3, latitude: 51.505729, longitude: -0.129625, name: 'Site C' }
    ];

    it('finds nearest site within maxDistance', () => {
      const nearest = findNearestSite(51.503324, -0.119543, sites, 1000);
      expect(nearest?.id).toBe(1);
    });

    it('returns null if no site within maxDistance', () => {
      const nearest = findNearestSite(52.503324, -0.119543, sites, 100);
      expect(nearest).toBeNull();
    });

    it('returns null for empty sites array', () => {
      const nearest = findNearestSite(51.503324, -0.119543, [], 1000);
      expect(nearest).toBeNull();
    });

    it('ignores sites without coordinates', () => {
      const sitesWithInvalid = [
        { id: 1 },
        { id: 2, latitude: 51.500729, longitude: -0.124625 }
      ];
      const nearest = findNearestSite(51.500729, -0.124625, sitesWithInvalid, 1000);
      expect(nearest?.id).toBe(2);
    });
  });

  describe('normalizeAgentLocation', () => {
    it('handles lat/lng format', () => {
      const location = normalizeAgentLocation({ lat: 51.5, lng: -0.12 });
      expect(location).toEqual({ lat: 51.5, lng: -0.12 });
    });

    it('handles latitude/longitude format', () => {
      const location = normalizeAgentLocation({ latitude: 51.5, longitude: -0.12 });
      expect(location).toEqual({ lat: 51.5, lng: -0.12 });
    });

    it('handles stringified JSON', () => {
      const location = normalizeAgentLocation(JSON.stringify({ lat: 51.5, lng: -0.12 }));
      expect(location).toEqual({ lat: 51.5, lng: -0.12 });
    });

    it('returns null for invalid input', () => {
      expect(normalizeAgentLocation(null)).toBeNull();
      expect(normalizeAgentLocation(undefined)).toBeNull();
      expect(normalizeAgentLocation('{invalid json}')).toBeNull();
      expect(normalizeAgentLocation({ invalid: 'format' })).toBeNull();
    });
  });
});