/**
 * Page layouts for the direct booking site.
 * `bold_modern` is the original Hofros design.
 * The first five layouts belong to the Basic collection.
 */
export const TEMPLATE_TIERS = [
  { id: 'basic', label: 'Basic' },
  { id: 'advance', label: 'Advance' },
  { id: 'professional', label: 'Professional' },
  { id: 'premium', label: 'Premium' },
]

export const DESIGN_TEMPLATES = [
  {
    id: 'bold_modern',
    name: 'Classic',
    hint: 'Centered hero, rooms in a grid',
    primary: '#1B4F8A',
    accent: '#F5A623',
    sketch: 'classic',
    tier: 'basic',
  },
  {
    id: 'soft_friendly',
    name: 'Soft & Friendly',
    hint: 'Welcome beside the photo, rooms in rows',
    primary: '#38bdf8',
    accent: '#fcd34d',
    sketch: 'soft',
    tier: 'basic',
  },
  {
    id: 'clean_minimal',
    name: 'Clean Minimal',
    hint: 'Title above the photo, search below',
    primary: '#2563eb',
    accent: '#e2e8f0',
    sketch: 'minimal',
    tier: 'basic',
  },
  {
    id: 'nature_warm',
    name: 'Nature & Warm',
    hint: 'Story at the foot of the photo',
    primary: '#15803d',
    accent: '#fef3c7',
    sketch: 'nature',
    tier: 'basic',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    hint: 'Dark column beside a full photo',
    primary: '#1c1917',
    accent: '#d6b25e',
    sketch: 'editorial',
    tier: 'basic',
  },
  {
    id: 'luxe_glass',
    name: 'Luxe Glass',
    hint: 'Frosted search over a full-bleed photo',
    primary: '#12304f',
    accent: '#e4c98a',
    sketch: 'luxe',
    tier: 'advance',
  },
  {
    id: 'gallery_split',
    name: 'Gallery',
    hint: 'Photo beside a color booking panel',
    primary: '#1d4e89',
    accent: '#f6efe4',
    sketch: 'gallery',
    tier: 'advance',
  },
  {
    id: 'ribbon',
    name: 'Ribbon',
    hint: 'A floating sheet across the photo',
    primary: '#0f4c5c',
    accent: '#f6d58a',
    sketch: 'ribbon',
    tier: 'advance',
  },
  {
    id: 'sanctuary',
    name: 'Sanctuary',
    hint: 'Framed photo, title set below',
    primary: '#6d4c41',
    accent: '#efe4d4',
    sketch: 'sanctuary',
    tier: 'advance',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    hint: 'Dark page with a gold welcome',
    primary: '#d4af37',
    accent: '#f3e6c4',
    sketch: 'midnight',
    tier: 'advance',
  },
  {
    id: 'atrium',
    name: 'Atrium',
    hint: 'Title on the photo, search in a white band',
    primary: '#0b1f33',
    accent: '#c4a46a',
    sketch: 'atrium',
    tier: 'professional',
  },
  {
    id: 'concierge',
    name: 'Concierge',
    hint: 'Ivory desk beside a tall photo',
    primary: '#1f3a2e',
    accent: '#f4efe6',
    sketch: 'concierge',
    tier: 'professional',
  },
  {
    id: 'monument',
    name: 'Monument',
    hint: 'Large type beside a framed portrait',
    primary: '#111827',
    accent: '#d6d3d1',
    sketch: 'monument',
    tier: 'professional',
  },
  {
    id: 'harbor',
    name: 'Harbor',
    hint: 'Short photo, navy booking band below',
    primary: '#0c2340',
    accent: '#d6b25e',
    sketch: 'harbor',
    tier: 'professional',
  },
  {
    id: 'residence',
    name: 'Residence',
    hint: 'Name above a framed photo',
    primary: '#3f3a36',
    accent: '#efe8df',
    sketch: 'residence',
    tier: 'professional',
  },
  {
    id: 'ledger',
    name: 'Ledger',
    hint: 'Type on white, photo ruled beside it',
    primary: '#1c1917',
    accent: '#b45309',
    sketch: 'ledger',
    tier: 'professional',
  },
  {
    id: 'crown_royal',
    name: 'Crown Royal',
    hint: 'Crown over a full-bleed photo, champagne search card',
    primary: '#1a2744',
    accent: '#e8c872',
    sketch: 'royal',
    tier: 'premium',
  },
  {
    id: 'palace',
    name: 'Palace',
    hint: 'Gold crown on a dark panel beside the photo',
    primary: '#1a1408',
    accent: '#e8c872',
    sketch: 'palace',
    tier: 'premium',
  },
  {
    id: 'imperial',
    name: 'Imperial',
    hint: 'Centered crown, title, then a gold-framed photo',
    primary: '#4a3424',
    accent: '#e8c872',
    sketch: 'imperial',
    tier: 'premium',
  },
  {
    id: 'regent',
    name: 'Regent',
    hint: 'Floating crown and a gold-ringed search over the photo',
    primary: '#10243f',
    accent: '#e8c872',
    sketch: 'regent',
    tier: 'premium',
  },
  {
    id: 'sovereign',
    name: 'Sovereign',
    hint: 'Black field, large crown, gold rules, framed photo',
    primary: '#1a1408',
    accent: '#e8c872',
    sketch: 'sovereign',
    tier: 'premium',
  },
  {
    id: 'dynasty',
    name: 'Dynasty',
    hint: 'Crown resting on a gold frame, search beneath',
    primary: '#6b1d2a',
    accent: '#e8c872',
    sketch: 'dynasty',
    tier: 'premium',
  },
]

const TEMPLATE_IDS = new Set(DESIGN_TEMPLATES.map((template) => template.id))

export function resolveDesignTemplate(designTemplate, themePreset) {
  if (TEMPLATE_IDS.has(designTemplate)) {
    return designTemplate
  }
  if (TEMPLATE_IDS.has(themePreset)) {
    return themePreset
  }
  return 'bold_modern'
}
