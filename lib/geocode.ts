/**
 * Geocode a US address using OpenStreetMap Nominatim (free, no API key).
 * Rate limit: 1 request per second per their usage policy.
 *
 * Returns null if the address can't be geocoded.
 */
export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  if (!address || !address.trim()) return null;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', address);
  url.searchParams.set('format', 'json');
  url.searchParams.set('countrycodes', 'us');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '0');

  try {
    const resp = await fetch(url.toString(), {
      headers: { 'User-Agent': 'FlipTracker/1.0 (+https://github.com)' },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);
    if (!isFinite(lat) || !isFinite(lon)) return null;
    return { latitude: lat, longitude: lon };
  } catch {
    return null;
  }
}
