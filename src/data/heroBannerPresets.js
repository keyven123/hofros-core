/**
 * Built-in royalty-free hero banners (Unsplash) for direct booking micro-sites.
 * URLs are stable `images.unsplash.com` links sized for wide hero use.
 */
export const HERO_BANNER_PRESETS = [
  {
    id: 'resort_pool',
    name: 'Resort pool',
    hint: 'Tropical pool & palm trees',
    url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'suite_interior',
    name: 'Suite interior',
    hint: 'Modern bedroom & living',
    url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'city_night',
    name: 'City skyline',
    hint: 'Urban hotel at night',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'tropical',
    name: 'Tropical escape',
    hint: 'Beach chairs & ocean',
    url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'boutique_room',
    name: 'Boutique room',
    hint: 'Warm accent lighting',
    url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'mountain_lodge',
    name: 'Mountain lodge',
    hint: 'Alpine wood & windows',
    url: 'https://images.unsplash.com/photo-1518732714860-b62714ce0c59?auto=format&fit=crop&w=1600&q=80',
  },
]

export const DEFAULT_HERO_BANNER_URL = HERO_BANNER_PRESETS[0].url

/** Photo ids Unsplash removed. Map them onto the replacement preset. */
const RETIRED_HERO_PHOTO_IDS = {
  '1566073771259-6a850eaba8c9': 'resort_pool',
  '1496417263024-38f4ede0531f': 'city_night',
  '1611892440504-42a792e54d66': 'boutique_room',
}

export function resolveHeroBannerUrl(url) {
  const value = typeof url === 'string' ? url.trim() : ''
  if (!value) {
    return DEFAULT_HERO_BANNER_URL
  }

  const retiredId = Object.keys(RETIRED_HERO_PHOTO_IDS).find((id) => value.includes(id))
  if (!retiredId) {
    return value
  }

  const presetId = RETIRED_HERO_PHOTO_IDS[retiredId]
  return HERO_BANNER_PRESETS.find((preset) => preset.id === presetId)?.url ?? DEFAULT_HERO_BANNER_URL
}
