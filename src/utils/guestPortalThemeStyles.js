/**
 * Visual treatment for the guest portal contact CTA per design template.
 * Uses brand primary/accent where appropriate; bold_modern keeps a strong red CTA.
 */
export function contactSendButtonProps(themePreset, primaryColor) {
  const primary = typeof primaryColor === 'string' && primaryColor.trim() ? primaryColor.trim() : '#1B4F8A'

  switch (themePreset) {
    case 'soft_friendly':
      return {
        className:
          'w-full py-3.5 text-sm font-bold text-white shadow-md transition hover:opacity-95 active:scale-[0.99] rounded-full',
        style: { backgroundColor: primary },
      }
    case 'clean_minimal':
      return {
        className:
          'w-full py-3 text-sm font-semibold tracking-wide text-white rounded-md border border-slate-900/10 shadow-sm transition hover:opacity-90',
        style: { backgroundColor: primary },
      }
    case 'nature_warm':
      return {
        className:
          'w-full py-3 text-sm font-black text-white shadow-md transition hover:opacity-95 rounded-2xl',
        style: { backgroundColor: primary },
      }
    case 'editorial':
      return {
        className:
          'w-full py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:opacity-90 rounded-none',
        style: { backgroundColor: primary },
      }
    case 'luxe_glass':
    case 'sanctuary':
      return {
        className:
          'w-full py-3.5 text-sm font-bold text-white shadow-md transition hover:opacity-95 rounded-full',
        style: { backgroundColor: primary },
      }
    case 'gallery_split':
    case 'ribbon':
      return {
        className:
          'w-full py-3.5 text-sm font-black text-white shadow-sm transition hover:opacity-95 rounded-2xl',
        style: { backgroundColor: primary },
      }
    case 'midnight':
      return {
        className:
          'w-full py-3 text-xs font-black uppercase tracking-[0.2em] text-[#1a1408] transition hover:opacity-90 rounded-full',
        style: { backgroundColor: '#f3e6c4' },
      }
    case 'atrium':
    case 'harbor':
    case 'ledger':
    case 'concierge':
    case 'monument':
    case 'residence':
      return {
        className:
          'w-full py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:opacity-90',
        style: { backgroundColor: primary },
      }
    case 'crown_royal':
    case 'palace':
    case 'imperial':
    case 'regent':
    case 'sovereign':
    case 'dynasty':
      return {
        className:
          'w-full py-3 text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1408] transition hover:opacity-90 rounded-full',
        style: { backgroundColor: '#e8c872' },
      }
    case 'bold_modern':
    default:
      return {
        className:
          'w-full py-3 text-sm font-black text-white shadow-sm transition hover:brightness-105 rounded-xl',
        style: { backgroundColor: '#dc2626' },
      }
  }
}

const CLASSIC_CHROME = {
  composition: 'classic',
  searchShape: 'pill',
  accentBar: false,
  page: 'min-h-[100svh] w-full bg-gradient-to-b from-slate-200/95 via-slate-100 to-slate-200/85 text-slate-900 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] [padding-left:max(0px,env(safe-area-inset-left))] [padding-right:max(0px,env(safe-area-inset-right))] [padding-top:max(0px,env(safe-area-inset-top))] sm:min-h-screen sm:px-3 sm:py-4 md:px-5 md:py-5',
  shell:
    'mx-auto flex min-h-[100svh] w-full max-w-full flex-col overflow-hidden bg-white shadow-none ring-0 sm:min-h-[calc(100vh-2rem)] sm:max-w-[min(90rem,calc(100vw-1.5rem))] sm:rounded-2xl sm:shadow-2xl sm:ring-1 sm:ring-slate-900/[0.06] md:max-w-[min(90rem,calc(100vw-2.5rem))] lg:max-w-[min(92rem,calc(100vw-3rem))]',
  header: 'flex flex-col gap-4 border-b border-slate-200/90 px-4 py-4 sm:px-6 sm:py-4 lg:px-8',
  headerTone: 'primary',
  brandWrap: 'min-w-0 sm:pr-3',
  navWrap: 'flex w-full shrink-0 items-center gap-2 sm:w-auto sm:justify-end',
  tagline: 'mt-1 text-pretty text-xs font-medium leading-snug text-slate-500 sm:text-sm',
  infoBar:
    'break-words border-b border-slate-100 bg-slate-50/90 px-4 py-2.5 text-center text-[11px] leading-relaxed text-slate-600 sm:px-6 sm:text-xs lg:px-8',
  brand: 'block text-pretty text-lg font-black leading-tight tracking-tight sm:text-xl',
  navLink:
    'flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-center text-xs font-bold text-slate-600 transition hover:bg-slate-50 sm:flex-none sm:px-3',
  navPlaceholder:
    'flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-center text-xs font-bold text-slate-400 sm:flex-none sm:px-3',
  bookNow:
    'flex-1 rounded-lg px-4 py-2.5 text-xs font-black text-[#0f3f73] shadow-sm transition hover:brightness-105 sm:flex-none sm:py-2',
  bookNowFill: 'accent',
  heroSection:
    'relative min-h-[min(52dvh,26rem)] overflow-hidden px-4 pb-10 pt-12 text-center sm:min-h-[min(64dvh,34rem)] sm:px-6 sm:pb-14 sm:pt-16 md:min-h-[min(70dvh,36rem)] md:px-10 md:pb-16 md:pt-20',
  heroOverlay: 'linear-gradient(to bottom, rgba(12,45,90,0.45), rgba(15,23,42,0.82))',
  heroCopy: 'relative z-[1] mx-auto w-full max-w-2xl px-1 sm:px-0',
  heroTitle:
    'text-[clamp(1.5rem,5vw+0.5rem,2.5rem)] font-black leading-tight tracking-tight text-white text-balance drop-shadow-md',
  heroMessage:
    'mx-auto mt-3 max-w-xl text-pretty text-sm font-medium leading-relaxed text-white/95 drop-shadow sm:mt-4 sm:text-base',
  heroSearch: 'relative z-[1] mx-auto mt-8 flex w-full justify-center px-1 sm:mt-10 sm:px-0 md:mt-12',
  unitsSection: 'scroll-mt-4 border-t border-slate-200 bg-slate-50 px-4 py-8 sm:scroll-mt-6 sm:px-6 sm:py-10 lg:px-10',
  sectionInner: 'mx-auto w-full max-w-6xl',
  unitsTitle: 'text-center text-xl font-black tracking-tight sm:text-2xl',
  unitsIntro: 'mx-auto mt-2 max-w-2xl text-center text-xs leading-relaxed text-slate-500 sm:text-sm',
  unitGrid: 'portal-units-classic mt-6 grid gap-4 sm:mt-8',
  unitCard: 'flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5',
  unitIcon: 'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-black text-white shadow-inner',
  bookBtn:
    'mt-5 inline-flex w-full items-center justify-center rounded-xl py-2.5 text-center text-xs font-black text-white no-underline transition hover:opacity-95',
  band: 'border-t border-slate-200 bg-[#e8f2fc] px-4 py-8 sm:px-6 sm:py-10 lg:px-10',
  bandInner: 'mx-auto w-full max-w-3xl md:max-w-4xl',
  bandTitle: 'text-center text-lg font-black sm:text-xl',
  amenityGrid: 'portal-amenities-classic mt-6 grid gap-3 sm:gap-4',
  amenityChip:
    'flex items-center gap-2 rounded-2xl border border-sky-100 bg-sky-50/90 px-3 py-3 text-sm font-bold shadow-sm',
  reviewCard: 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5',
  reviewInner: 'mx-auto w-full max-w-2xl md:max-w-3xl',
  reviewList: 'mt-6 space-y-4',
  reviewQuoteFirst: false,
  reviewAvatar: true,
  field: 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600',
  contactInner: 'mx-auto w-full max-w-md',
  contactSplit: false,
  map: 'mt-6 h-40 w-full rounded-xl border border-slate-200 bg-slate-200/80 text-center text-xs text-slate-500',
  copyright: 'mt-6 text-center text-xs text-slate-500',
  footer: 'mt-auto border-t border-slate-100 bg-slate-50/90 px-4 py-4 text-center text-[11px] text-slate-500 sm:px-6 lg:px-8',
}

function premiumChrome(overrides) {
  return {
    ...CLASSIC_CHROME,
    searchShape: 'stack',
    page: 'min-h-[100svh] w-full bg-[#ebe4d4] text-[#1a1408] sm:min-h-screen sm:px-3 sm:py-4',
    shell:
      'portal-premium mx-auto flex min-h-[100svh] w-full max-w-full flex-col overflow-hidden bg-[#fbf7ef] sm:min-h-[calc(100vh-2rem)] sm:max-w-[min(90rem,calc(100vw-1.5rem))] sm:rounded-[1.75rem] sm:shadow-2xl sm:ring-1 sm:ring-[#e8c872]/50',
    header: 'flex flex-col gap-3 border-b border-[#e8c872]/50 px-4 py-5 sm:px-8',
    brandWrap: 'min-w-0',
    brand: 'block text-2xl font-semibold tracking-wide',
    tagline: 'mt-1 text-[11px] uppercase tracking-[0.22em] text-[#8a7040]',
    navWrap: 'mt-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em]',
    navLink: 'text-[#8a7040] hover:underline',
    navPlaceholder: 'text-[#8a7040]/70',
    bookNow:
      'flex-1 rounded-full px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#1a1408] sm:flex-none',
    unitsSection: 'bg-[#fbf7ef] px-4 py-12 sm:px-8',
    sectionInner: 'mx-auto w-full max-w-5xl',
    unitsTitle: 'text-center text-xs font-semibold uppercase tracking-[0.28em]',
    unitsIntro: 'mx-auto mt-3 max-w-xl text-center text-sm text-stone-500',
    unitGrid: 'portal-units-luxe mt-8',
    band: 'border-t border-[#e8c872]/40 bg-[#f4efe4] px-4 py-12 sm:px-8',
    bandInner: 'mx-auto w-full max-w-5xl',
    bandTitle: 'text-center text-xs font-semibold uppercase tracking-[0.28em]',
    amenityChip:
      'flex items-center gap-2 rounded-full border border-[#e8c872]/70 bg-white px-4 py-3 text-sm font-semibold',
    reviewCard: 'rounded-2xl border border-[#e8c872]/50 bg-white p-5 text-center shadow-sm',
    reviewInner: 'mx-auto w-full max-w-3xl',
    field: 'w-full rounded-full border border-[#e8c872]/70 bg-white px-4 py-2.5 text-sm',
    map: 'mt-6 flex h-40 w-full items-center justify-center rounded-2xl border border-[#e8c872]/50 bg-white text-xs text-stone-500',
    footer:
      'mt-auto border-t border-[#e8c872]/50 bg-[#fbf7ef] px-4 py-4 text-center text-[11px] uppercase tracking-[0.18em] text-[#8a7040]',
    headingColor: '#1a1408',
    ...overrides,
  }
}

/**
 * Structural classes for a booking-site template.
 * Classic matches the original microsite exactly.
 */
export function micrositeChrome(templateId) {
  switch (templateId) {
    case 'soft_friendly':
      return {
        ...CLASSIC_CHROME,
        composition: 'soft',
        searchShape: 'stack',
        page: 'min-h-[100svh] w-full bg-gradient-to-b from-sky-100 via-white to-amber-50 text-slate-900 sm:min-h-screen sm:px-3 sm:py-4 md:px-5 md:py-5',
        shell:
          'mx-auto flex min-h-[100svh] w-full max-w-full flex-col overflow-hidden bg-white sm:min-h-[calc(100vh-2rem)] sm:max-w-[min(90rem,calc(100vw-1.5rem))] sm:rounded-[2rem] sm:shadow-xl sm:ring-1 sm:ring-sky-100',
        header: 'flex flex-col items-center gap-3 px-4 py-6 text-center sm:px-8',
        brandWrap: 'min-w-0',
        navWrap: 'flex items-center justify-center gap-2',
        tagline: 'mt-1 text-xs font-medium text-slate-500',
        infoBar:
          'break-words border-b border-sky-100 bg-sky-50/80 px-4 py-2.5 text-center text-[11px] leading-relaxed text-slate-600 sm:px-6 sm:text-xs',
        navLink:
          'flex-1 rounded-full border border-sky-100 bg-sky-50 py-2.5 text-center text-xs font-bold text-slate-600 sm:flex-none sm:px-4',
        navPlaceholder:
          'flex-1 rounded-full border border-sky-100 bg-sky-50 py-2.5 text-center text-xs font-bold text-slate-400 sm:flex-none sm:px-4',
        bookNow:
          'flex-1 rounded-full px-5 py-2.5 text-xs font-black text-[#0f3f73] shadow-sm sm:flex-none',
        heroOverlay: 'linear-gradient(to bottom, rgba(56,189,248,0.2), rgba(15,23,42,0.55))',
        heroTitle:
          'text-[clamp(1.5rem,5vw+0.5rem,2.5rem)] font-bold leading-tight tracking-tight text-white text-balance drop-shadow-md',
        unitsSection: 'scroll-mt-4 bg-gradient-to-b from-white to-amber-50/70 px-4 py-8 sm:px-6 sm:py-10 lg:px-10',
        sectionInner: 'mx-auto w-full max-w-5xl',
        unitsTitle: 'text-left text-xl font-bold tracking-tight sm:text-2xl',
        unitsIntro: 'mt-2 max-w-xl text-left text-xs leading-relaxed text-slate-500 sm:text-sm',
        unitGrid: 'mt-6 flex flex-col gap-3',
        unitCard: 'flex flex-col rounded-3xl border-0 bg-white p-5 shadow-md',
        unitIcon: 'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-black text-white',
        bookBtn:
          'inline-flex shrink-0 items-center justify-center rounded-full px-6 py-2.5 text-center text-xs font-black text-white no-underline transition hover:opacity-95',
        band: 'border-t border-amber-100 bg-[#fff7ed] px-4 py-8 sm:px-6 sm:py-10 lg:px-10',
        bandInner: 'mx-auto w-full max-w-5xl',
        bandTitle: 'text-left text-lg font-bold sm:text-xl',
        amenityGrid: 'mt-5 flex flex-wrap gap-2',
        amenityChip:
          'flex items-center gap-2 rounded-full border border-amber-100 bg-white px-3 py-3 text-sm font-bold shadow-sm',
        reviewCard: 'rounded-3xl border border-amber-100 bg-white p-4 shadow-sm sm:p-5',
        reviewInner: 'mx-auto w-full max-w-5xl',
        reviewList: 'portal-reviews-soft mt-6 grid grid-cols-1 gap-4',
        field: 'w-full rounded-full border border-amber-100 bg-white px-4 py-2.5 text-sm text-slate-600',
        contactInner: 'mx-auto w-full max-w-5xl',
        contactSplit: true,
        map: 'flex h-full min-h-40 w-full items-center justify-center rounded-3xl border border-amber-100 bg-amber-50 text-center text-xs text-slate-500',
        copyright: 'mt-6 text-left text-xs text-slate-500',
      }
    case 'clean_minimal':
      return {
        ...CLASSIC_CHROME,
        composition: 'minimal',
        searchShape: 'bar',
        page: 'min-h-[100svh] w-full bg-white text-slate-900 sm:min-h-screen',
        shell: 'mx-auto flex min-h-[100svh] w-full max-w-full flex-col overflow-hidden bg-white sm:min-h-screen',
        header:
          'flex flex-col gap-4 border-b border-slate-900 px-4 py-4 sm:px-6 lg:px-8',
        brandWrap: 'min-w-0 sm:pr-3',
        tagline: 'mt-1 text-xs font-medium text-slate-500',
        infoBar:
          'break-words border-b border-slate-200 bg-white px-4 py-2.5 text-left text-[11px] leading-relaxed text-slate-600 sm:px-6 sm:text-xs lg:px-8',
        brand: 'block text-pretty text-sm font-semibold uppercase tracking-[0.22em] sm:text-base',
        navLink:
          'flex-1 rounded-none border border-slate-300 bg-white py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-700 sm:flex-none sm:px-3',
        navPlaceholder:
          'flex-1 rounded-none border border-slate-300 bg-white py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 sm:flex-none sm:px-3',
        bookNow:
          'flex-1 rounded-none px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white sm:flex-none',
        bookNowFill: 'primary',
        heroSection:
          'relative min-h-[min(52dvh,26rem)] overflow-hidden px-4 pb-10 pt-12 text-left sm:min-h-[min(64dvh,34rem)] sm:px-6 sm:pb-14 sm:pt-16 md:min-h-[min(70dvh,36rem)] md:px-10 md:pb-16 md:pt-20',
        heroOverlay: 'linear-gradient(to right, rgba(15,23,42,0.78), rgba(15,23,42,0.12))',
        heroCopy: 'relative z-[1] w-full max-w-xl px-1 sm:px-0',
        heroTitle:
          'text-[clamp(1.5rem,5vw+0.5rem,2.5rem)] font-semibold leading-tight tracking-tight text-white text-balance',
        heroMessage: 'mt-3 max-w-xl text-pretty text-sm font-medium leading-relaxed text-white/95 sm:mt-4 sm:text-base',
        heroSearch: 'relative z-[1] mt-8 flex w-full justify-start px-1 sm:mt-10 sm:px-0 md:mt-12',
        unitsSection: 'scroll-mt-4 border-t border-slate-200 bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-10',
        sectionInner: 'w-full max-w-3xl',
        unitsTitle: 'text-left text-xl font-semibold tracking-tight sm:text-2xl',
        unitsIntro: 'mt-2 max-w-2xl text-left text-xs leading-relaxed text-slate-500 sm:text-sm',
        unitGrid: 'mt-4 divide-y divide-slate-200 border-t border-slate-200',
        unitCard: 'flex flex-col rounded-none border border-slate-200 bg-white p-5 shadow-none',
        unitIcon: 'flex h-12 w-12 shrink-0 items-center justify-center rounded-none text-base font-semibold text-white',
        bookBtn:
          'mt-5 inline-flex w-full items-center justify-center rounded-none py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-white no-underline',
        band: 'border-t border-slate-200 bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-10',
        bandInner: 'w-full max-w-3xl',
        bandTitle: 'text-left text-lg font-semibold sm:text-xl',
        amenityGrid: 'mt-4 flex flex-wrap gap-x-4 gap-y-1',
        amenityChip: 'inline-flex items-center gap-2 bg-transparent px-0 py-1 text-sm font-medium',
        reviewCard: 'border-b border-slate-200 bg-transparent py-4',
        reviewInner: 'w-full max-w-3xl',
        reviewList: 'mt-4 divide-y divide-slate-200',
        reviewAvatar: false,
        field: 'w-full rounded-none border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-600',
        contactInner: 'w-full max-w-5xl',
        contactSplit: true,
        map: 'flex h-full min-h-40 w-full items-center justify-center border border-slate-300 bg-slate-100 text-center text-xs text-slate-500',
        copyright: 'mt-6 text-left text-xs text-slate-500',
        footer: 'mt-auto border-t border-slate-900 bg-white px-4 py-4 text-center text-[11px] text-slate-500 sm:px-6 lg:px-8',
      }
    case 'nature_warm':
      return {
        ...CLASSIC_CHROME,
        composition: 'nature',
        searchShape: 'bar',
        accentBar: true,
        page: 'min-h-[100svh] w-full bg-gradient-to-b from-stone-100 via-[#f7f3ea] to-emerald-50 text-stone-900 sm:min-h-screen sm:px-3 sm:py-4 md:px-5 md:py-5',
        shell:
          'mx-auto flex min-h-[100svh] w-full max-w-full flex-col overflow-hidden bg-[#fbf8f3] sm:min-h-[calc(100vh-2rem)] sm:max-w-[min(90rem,calc(100vw-1.5rem))] sm:rounded-3xl sm:shadow-xl sm:ring-1 sm:ring-emerald-900/10',
        bookNow: 'flex-1 rounded-2xl px-4 py-2.5 text-xs font-black text-stone-900 shadow-sm sm:flex-none',
        heroOverlay: 'linear-gradient(to bottom, rgba(21,128,61,0.22), rgba(28,25,23,0.7))',
        unitsSection: 'scroll-mt-4 border-t border-emerald-900/10 bg-[#f7f3ea] px-4 py-8 sm:px-6 sm:py-10 lg:px-10',
        sectionInner: 'mx-auto w-full max-w-6xl',
        unitsTitle: 'text-left text-xl font-black tracking-tight sm:text-2xl',
        unitsIntro: 'mt-2 max-w-xl text-left text-xs leading-relaxed text-stone-500 sm:text-sm',
        unitGrid: 'portal-units-nature mt-6 grid grid-cols-1 gap-4',
        unitCard: 'flex flex-col rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm',
        bookBtn:
          'mt-5 inline-flex w-full items-center justify-center rounded-2xl py-2.5 text-center text-xs font-black text-white no-underline transition hover:opacity-95',
        band: 'border-t border-emerald-900/10 bg-[#f3eee4] px-4 py-8 sm:px-6 sm:py-10 lg:px-10',
        bandInner: 'mx-auto w-full max-w-6xl',
        bandTitle: 'text-left text-lg font-black sm:text-xl',
        amenityGrid: 'portal-amenities-nature mt-6 grid grid-cols-1 gap-3',
        amenityChip:
          'flex min-h-[4.5rem] flex-col items-start justify-center gap-2 rounded-3xl border border-emerald-100 bg-white px-4 py-4 text-sm font-bold shadow-sm',
        reviewCard: 'rounded-3xl border border-emerald-900/10 bg-white p-4 shadow-sm sm:p-5',
        reviewInner: 'mx-auto w-full max-w-6xl',
        reviewList: 'portal-reviews-nature mt-6 grid grid-cols-1 gap-4',
        field: 'w-full rounded-2xl border border-emerald-900/10 bg-white px-3 py-2.5 text-sm text-slate-600',
        contactInner: 'mx-auto w-full max-w-lg',
        map: 'mt-6 h-40 w-full rounded-3xl border border-emerald-900/10 bg-emerald-50 text-center text-xs text-slate-500',
        copyright: 'mt-6 text-center text-xs text-stone-500',
      }
    case 'editorial':
      return {
        ...CLASSIC_CHROME,
        composition: 'editorial',
        searchShape: 'column',
        page: 'min-h-[100svh] w-full bg-stone-200 text-stone-900 sm:min-h-screen sm:px-3 sm:py-4 md:px-5 md:py-5',
        shell:
          'mx-auto flex min-h-[100svh] w-full max-w-full flex-col overflow-hidden bg-white sm:min-h-[calc(100vh-2rem)] sm:max-w-[min(90rem,calc(100vw-1.5rem))] sm:shadow-2xl',
        header:
          'flex flex-col gap-4 bg-[#1c1917] px-4 py-4 text-white sm:px-6 lg:px-8',
        headerTone: 'inverse',
        tagline: 'mt-1 text-pretty text-xs font-medium leading-snug text-stone-300 sm:text-sm',
        infoBar:
          'break-words border-b border-stone-200 bg-stone-100 px-4 py-2.5 text-left text-[11px] leading-relaxed text-stone-600 sm:px-6 sm:text-xs lg:px-8',
        brand: 'block text-pretty text-lg font-semibold uppercase tracking-[0.18em] sm:text-xl',
        navLink:
          'flex-1 border border-white/30 bg-transparent py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-white sm:flex-none sm:px-3',
        navPlaceholder:
          'flex-1 border border-white/25 bg-transparent py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-white/70 sm:flex-none sm:px-3',
        bookNow:
          'flex-1 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#1c1917] sm:flex-none',
        heroSection:
          'relative min-h-[min(52dvh,26rem)] overflow-hidden px-4 pb-10 pt-12 text-left sm:min-h-[min(64dvh,34rem)] sm:px-6 sm:pb-14 sm:pt-16 md:min-h-[min(70dvh,36rem)] md:px-10 md:pb-16 md:pt-20',
        heroOverlay: 'linear-gradient(to right, rgba(28,25,23,0.82), rgba(28,25,23,0.2))',
        heroCopy: 'relative z-[1] w-full max-w-xl px-1 sm:px-0',
        heroTitle:
          'text-[clamp(1.6rem,5vw+0.5rem,3rem)] font-semibold uppercase leading-none tracking-tight text-white text-balance',
        heroMessage: 'mt-4 max-w-lg text-pretty text-sm font-medium leading-relaxed text-white/90 sm:text-base',
        heroSearch: 'relative z-[1] mt-8 flex w-full justify-start px-1 sm:mt-10 sm:px-0 md:mt-12',
        unitsSection: 'scroll-mt-4 border-t border-stone-200 bg-white px-4 py-10 sm:px-8 sm:py-12 lg:px-12',
        sectionInner: 'w-full max-w-5xl',
        unitsTitle: 'text-left text-xs font-black uppercase tracking-[0.22em]',
        unitsIntro: 'mt-2 max-w-2xl text-left text-xs leading-relaxed text-stone-500 sm:text-sm',
        unitGrid: 'mt-6 border-t border-stone-900',
        unitCard: 'flex flex-col border-l-4 border-stone-900 bg-white p-5',
        unitIcon: 'flex h-12 w-12 shrink-0 items-center justify-center text-base font-semibold text-white',
        bookBtn:
          'mt-5 inline-flex w-full items-center justify-center py-2.5 text-center text-xs font-black uppercase tracking-[0.16em] text-white no-underline',
        band: 'border-t border-stone-200 bg-white px-4 py-10 sm:px-8 sm:py-12 lg:px-12',
        bandInner: 'w-full max-w-5xl',
        bandTitle: 'text-left text-xs font-black uppercase tracking-[0.22em]',
        amenityGrid: 'mt-4 flex flex-col',
        amenityChip: 'flex items-center gap-3 border-b border-stone-200 bg-transparent px-0 py-3 text-sm font-semibold',
        reviewCard: 'border-b border-stone-200 bg-transparent py-6',
        reviewInner: 'w-full max-w-5xl',
        reviewList: 'mt-2',
        reviewQuoteFirst: true,
        reviewAvatar: false,
        field: 'w-full rounded-none border-b border-stone-300 bg-transparent px-1 py-2.5 text-sm text-slate-700',
        contactInner: 'w-full max-w-5xl',
        contactSplit: true,
        map: 'flex h-full min-h-48 w-full items-center justify-center border border-stone-300 bg-stone-100 text-center text-xs text-stone-500',
        copyright: 'mt-6 text-left text-xs text-stone-500',
        footer: 'mt-auto border-t border-stone-900 bg-[#1c1917] px-4 py-4 text-center text-[11px] text-stone-300 sm:px-6 lg:px-8',
      }
    case 'luxe_glass':
      return {
        ...CLASSIC_CHROME,
        composition: 'luxe',
        searchShape: 'glass',
        headerTone: 'float',
        page: 'min-h-[100svh] w-full bg-[#d7e2ee] text-slate-900 sm:min-h-screen sm:px-3 sm:py-4',
        shell:
          'mx-auto flex min-h-[100svh] w-full max-w-full flex-col overflow-hidden bg-[#f7f4ef] sm:min-h-[calc(100vh-2rem)] sm:max-w-[min(90rem,calc(100vw-1.5rem))] sm:rounded-[1.75rem] sm:shadow-2xl',
        header: 'flex flex-col gap-3 px-4 py-4 sm:px-6',
        navLink:
          'flex-1 rounded-full border border-white/40 bg-white/15 py-2.5 text-center text-xs font-bold text-white backdrop-blur-sm sm:flex-none sm:px-4',
        navPlaceholder:
          'flex-1 rounded-full border border-white/30 bg-white/10 py-2.5 text-center text-xs font-bold text-white/80 sm:flex-none sm:px-4',
        bookNow: 'flex-1 rounded-full px-5 py-2.5 text-xs font-black text-[#12304f] shadow-sm sm:flex-none',
        unitsSection: 'bg-[#f7f4ef] px-4 py-10 sm:px-8',
        sectionInner: 'mx-auto w-full max-w-6xl',
        unitsTitle: 'text-center font-serif text-2xl font-black tracking-tight',
        unitsIntro: 'mx-auto mt-2 max-w-xl text-center text-sm text-slate-500',
        unitGrid: 'portal-units-luxe mt-8',
        band: 'bg-[#efe8dc] px-4 py-10 sm:px-8',
        bandInner: 'mx-auto w-full max-w-5xl',
        bandTitle: 'text-center text-lg font-black',
        amenityChip:
          'flex items-center gap-2 rounded-full border border-[#e4c98a]/60 bg-white px-4 py-3 text-sm font-bold shadow-sm',
        reviewCard: 'rounded-[1.6rem] bg-white p-5 text-center shadow-md',
        reviewInner: 'mx-auto w-full max-w-3xl',
        field: 'w-full rounded-full border border-[#e4c98a]/70 bg-white px-4 py-2.5 text-sm',
        map: 'mt-6 flex h-40 w-full items-center justify-center rounded-[1.6rem] bg-white text-xs text-slate-500',
      }
    case 'gallery_split':
      return {
        ...CLASSIC_CHROME,
        composition: 'gallery',
        searchShape: 'stack',
        bookNowFill: 'primary',
        page: 'min-h-[100svh] w-full bg-slate-200 text-slate-900 sm:min-h-screen sm:px-3 sm:py-4',
        shell:
          'mx-auto flex min-h-[100svh] w-full max-w-full flex-col overflow-hidden bg-white sm:min-h-[calc(100vh-2rem)] sm:max-w-[min(90rem,calc(100vw-1.5rem))] sm:shadow-2xl',
        unitsSection: 'bg-slate-50 px-4 py-10 sm:px-8',
        sectionInner: 'mx-auto w-full max-w-5xl',
        unitsTitle: 'text-left text-2xl font-black tracking-tight',
        unitsIntro: 'mt-2 max-w-xl text-left text-sm text-slate-500',
        unitGrid: 'mt-6 flex flex-col gap-3',
        band: 'border-t border-slate-200 bg-white px-4 py-10 sm:px-8',
        bandInner: 'mx-auto w-full max-w-5xl',
        bandTitle: 'text-left text-lg font-black',
        contactSplit: true,
        contactInner: 'mx-auto w-full max-w-5xl',
        map: 'flex h-full min-h-40 w-full items-center justify-center rounded-2xl bg-slate-100 text-xs text-slate-500',
        copyright: 'mt-6 text-left text-xs text-slate-500',
      }
    case 'ribbon':
      return {
        ...CLASSIC_CHROME,
        composition: 'ribbon',
        searchShape: 'bar',
        page: 'min-h-[100svh] w-full bg-[#e7eef0] text-slate-900 sm:min-h-screen sm:px-3 sm:py-4',
        shell:
          'mx-auto flex min-h-[100svh] w-full max-w-full flex-col overflow-hidden bg-[#f4f8f8] sm:min-h-[calc(100vh-2rem)] sm:max-w-[min(90rem,calc(100vw-1.5rem))] sm:rounded-[1.75rem] sm:shadow-xl',
        unitsSection: 'bg-[#f4f8f8] px-4 py-12 sm:px-8',
        sectionInner: 'mx-auto w-full max-w-6xl',
        unitsTitle: 'text-left text-2xl font-black tracking-tight',
        unitsIntro: 'mt-2 max-w-xl text-left text-sm text-slate-500',
        unitGrid: 'portal-units-luxe mt-8',
        band: 'bg-white px-4 py-10 sm:px-8',
        bandInner: 'mx-auto w-full max-w-5xl',
        bandTitle: 'text-left text-lg font-black',
        amenityChip: 'flex items-center gap-2 rounded-2xl bg-[#e7eef0] px-4 py-3 text-sm font-bold',
        reviewList: 'portal-units-luxe mt-6',
        reviewInner: 'mx-auto w-full max-w-5xl',
        field: 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm',
      }
    case 'sanctuary':
      return {
        ...CLASSIC_CHROME,
        composition: 'sanctuary',
        searchShape: 'stack',
        bookNowFill: 'primary',
        page: 'min-h-[100svh] w-full bg-[#e7d9cc] text-stone-900 sm:min-h-screen sm:px-3 sm:py-4',
        shell:
          'mx-auto flex min-h-[100svh] w-full max-w-full flex-col overflow-hidden bg-[#f6f0e8] sm:min-h-[calc(100vh-2rem)] sm:max-w-[min(90rem,calc(100vw-1.5rem))] sm:rounded-[2rem] sm:shadow-xl',
        header: 'flex flex-col items-center gap-3 px-4 py-6 text-center',
        brandWrap: 'min-w-0',
        navWrap: 'flex items-center justify-center gap-2',
        unitsSection: 'bg-[#f6f0e8] px-4 py-10 sm:px-8',
        sectionInner: 'mx-auto w-full max-w-5xl',
        unitsTitle: 'text-center text-2xl font-black tracking-tight',
        unitsIntro: 'mx-auto mt-2 max-w-xl text-center text-sm text-stone-500',
        unitGrid: 'portal-units-luxe mt-8',
        band: 'bg-[#efe4d6] px-4 py-10 sm:px-8',
        bandInner: 'mx-auto w-full max-w-4xl',
        bandTitle: 'text-center text-lg font-black',
        amenityGrid: 'mt-6 flex flex-wrap justify-center gap-2',
        amenityChip: 'flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-bold shadow-sm',
        reviewInner: 'mx-auto w-full max-w-2xl',
        reviewCard: 'rounded-[1.75rem] bg-white p-5 text-center shadow-sm',
        field: 'w-full rounded-full border border-[#d7c4b4] bg-white px-4 py-2.5 text-sm',
        contactInner: 'mx-auto w-full max-w-md',
        map: 'mt-6 flex h-40 w-full items-center justify-center rounded-[1.75rem] bg-white text-xs text-stone-500',
      }
    case 'midnight':
      return {
        ...CLASSIC_CHROME,
        composition: 'midnight',
        searchShape: 'stack',
        headerTone: 'inverse',
        headerBg: '#09090b',
        headingColor: '#f6f1e6',
        page: 'min-h-[100svh] w-full bg-black text-[#f6f1e6] sm:min-h-screen sm:px-3 sm:py-4',
        shell:
          'mx-auto flex min-h-[100svh] w-full max-w-full flex-col overflow-hidden bg-[#09090b] sm:min-h-[calc(100vh-2rem)] sm:max-w-[min(90rem,calc(100vw-1.5rem))] sm:shadow-2xl',
        header: 'flex flex-col gap-4 bg-[#09090b] px-4 py-4 text-white sm:px-6',
        tagline: 'mt-1 text-xs text-white/60',
        infoBar: 'break-words border-b border-white/10 bg-[#09090b] px-4 py-2 text-center text-[11px] text-white/70',
        brand: 'block text-lg font-semibold uppercase tracking-[0.22em]',
        navLink:
          'flex-1 border border-white/25 bg-transparent py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-white sm:flex-none sm:px-3',
        navPlaceholder:
          'flex-1 border border-white/20 bg-transparent py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-white/70 sm:flex-none sm:px-3',
        bookNow: 'flex-1 rounded-full px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#1a1408] sm:flex-none',
        unitsSection: 'bg-[#09090b] px-4 py-10 sm:px-8',
        sectionInner: 'mx-auto w-full max-w-5xl',
        unitsTitle: 'text-center text-xs font-black uppercase tracking-[0.28em]',
        unitsIntro: 'mx-auto mt-3 max-w-xl text-center text-sm text-white/60',
        unitGrid: 'portal-units-luxe mt-8',
        band: 'border-t border-white/10 bg-[#111113] px-4 py-10 sm:px-8',
        bandInner: 'mx-auto w-full max-w-4xl',
        bandTitle: 'text-center text-xs font-black uppercase tracking-[0.28em]',
        amenityChip: 'flex items-center gap-2 border-b border-white/15 px-1 py-3 text-sm font-medium text-[#f6f1e6]',
        reviewCard: 'rounded-3xl border border-[#d4af37]/30 bg-[#161616] p-5',
        reviewInner: 'mx-auto w-full max-w-3xl',
        reviewList: 'mt-6 space-y-4',
        field: 'w-full rounded-none border-b border-white/20 bg-transparent px-1 py-2.5 text-sm text-[#f6f1e6] placeholder:text-white/40',
        map: 'mt-6 flex h-40 w-full items-center justify-center border border-white/15 bg-black text-xs text-white/50',
        copyright: 'mt-6 text-center text-xs text-white/50',
        footer: 'mt-auto border-t border-white/10 bg-black px-4 py-4 text-center text-[11px] text-white/50',
      }
    case 'atrium':
      return {
        ...CLASSIC_CHROME,
        composition: 'atrium',
        searchShape: 'bar',
        bookNowFill: 'primary',
        page: 'min-h-[100svh] w-full bg-[#e7edf2] text-slate-900 sm:min-h-screen sm:px-3 sm:py-4',
        shell:
          'mx-auto flex min-h-[100svh] w-full max-w-full flex-col overflow-hidden bg-white sm:min-h-[calc(100vh-2rem)] sm:max-w-[min(90rem,calc(100vw-1.5rem))] sm:shadow-2xl',
        header: 'flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:px-8',
        brand: 'block text-sm font-semibold uppercase tracking-[0.22em]',
        unitsSection: 'bg-white px-4 py-10 sm:px-8',
        sectionInner: 'mx-auto w-full max-w-5xl',
        unitsTitle: 'text-left text-xs font-semibold uppercase tracking-[0.24em]',
        unitsIntro: 'mt-2 max-w-2xl text-left text-sm text-slate-500',
        unitGrid: 'mt-6 border-t border-slate-900',
        band: 'border-t border-slate-200 bg-[#f7f5f1] px-4 py-10 sm:px-8',
        bandInner: 'mx-auto w-full max-w-5xl',
        bandTitle: 'text-left text-xs font-semibold uppercase tracking-[0.24em]',
        amenityChip: 'flex items-center gap-3 border-b border-slate-200 px-0 py-3 text-sm font-medium',
        reviewCard: 'border-b border-slate-200 py-5',
        reviewInner: 'mx-auto w-full max-w-3xl',
        field: 'w-full border-b border-slate-300 bg-transparent px-1 py-2.5 text-sm',
        map: 'mt-6 flex h-40 w-full items-center justify-center border border-slate-200 bg-slate-50 text-xs text-slate-500',
      }
    case 'concierge':
      return {
        ...CLASSIC_CHROME,
        composition: 'concierge',
        searchShape: 'stack',
        bookNowFill: 'primary',
        page: 'min-h-[100svh] w-full bg-[#e6e1d8] text-stone-900 sm:min-h-screen sm:px-3 sm:py-4',
        shell:
          'mx-auto flex min-h-[100svh] w-full max-w-full flex-col overflow-hidden bg-[#f7f4ee] sm:min-h-[calc(100vh-2rem)] sm:max-w-[min(90rem,calc(100vw-1.5rem))] sm:shadow-xl',
        header: 'flex flex-col gap-3 border-b border-stone-300 bg-[#f7f4ee] px-4 py-4 sm:px-6',
        unitsSection: 'bg-[#f7f4ee] px-4 py-10 sm:px-8',
        sectionInner: 'mx-auto w-full max-w-5xl',
        unitsTitle: 'text-left text-xs font-semibold uppercase tracking-[0.22em]',
        unitsIntro: 'mt-2 max-w-xl text-left text-sm text-stone-500',
        unitGrid: 'mt-4 border-t border-stone-300',
        band: 'border-t border-stone-300 bg-white px-4 py-10 sm:px-8',
        bandInner: 'mx-auto w-full max-w-5xl',
        bandTitle: 'text-left text-xs font-semibold uppercase tracking-[0.22em]',
        contactSplit: true,
        contactInner: 'mx-auto w-full max-w-5xl',
        map: 'flex h-full min-h-40 w-full items-center justify-center border border-stone-200 bg-[#f7f4ee] text-xs text-stone-500',
        copyright: 'mt-6 text-left text-xs text-stone-500',
      }
    case 'monument':
      return {
        ...CLASSIC_CHROME,
        composition: 'monument',
        searchShape: 'bar',
        bookNowFill: 'primary',
        page: 'min-h-[100svh] w-full bg-white text-slate-900 sm:min-h-screen',
        shell: 'mx-auto flex min-h-[100svh] w-full max-w-full flex-col overflow-hidden bg-white sm:min-h-screen',
        header: 'flex flex-col gap-3 border-b border-slate-900 px-4 py-4 sm:px-8',
        brand: 'block text-sm font-semibold uppercase tracking-[0.28em]',
        unitsSection: 'border-t border-slate-200 bg-white px-4 py-10 sm:px-8',
        sectionInner: 'w-full max-w-4xl',
        unitsTitle: 'text-left text-xs font-semibold uppercase tracking-[0.24em]',
        unitsIntro: 'mt-2 max-w-xl text-left text-sm text-slate-500',
        unitGrid: 'mt-6 border-t border-slate-900',
        band: 'border-t border-slate-200 bg-white px-4 py-10 sm:px-8',
        bandInner: 'w-full max-w-4xl',
        bandTitle: 'text-left text-xs font-semibold uppercase tracking-[0.24em]',
        amenityChip: 'flex items-center gap-2 border-b border-slate-200 py-3 text-sm',
        reviewCard: 'border-b border-slate-200 py-5',
        reviewInner: 'w-full max-w-3xl',
        field: 'w-full border border-slate-300 bg-white px-3 py-2.5 text-sm',
        footer: 'mt-auto border-t border-slate-900 bg-white px-4 py-4 text-center text-[11px] text-slate-500',
      }
    case 'harbor':
      return {
        ...CLASSIC_CHROME,
        composition: 'harbor',
        searchShape: 'bar',
        headerTone: 'inverse',
        headerBg: '#0c2340',
        page: 'min-h-[100svh] w-full bg-[#d9e2ec] text-slate-900 sm:min-h-screen sm:px-3 sm:py-4',
        shell:
          'mx-auto flex min-h-[100svh] w-full max-w-full flex-col overflow-hidden bg-white sm:min-h-[calc(100vh-2rem)] sm:max-w-[min(90rem,calc(100vw-1.5rem))] sm:shadow-2xl',
        header: 'flex flex-col gap-3 bg-[#0c2340] px-4 py-4 text-white sm:px-8',
        tagline: 'mt-1 text-xs text-white/60',
        brand: 'block text-sm font-semibold uppercase tracking-[0.22em]',
        navLink:
          'flex-1 border border-white/30 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-white sm:flex-none sm:px-3',
        navPlaceholder:
          'flex-1 border border-white/20 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-white/70 sm:flex-none sm:px-3',
        bookNow: 'flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0c2340] sm:flex-none',
        unitsSection: 'bg-white px-4 py-10 sm:px-8',
        sectionInner: 'mx-auto w-full max-w-5xl',
        unitsTitle: 'text-left text-xs font-semibold uppercase tracking-[0.24em]',
        unitsIntro: 'mt-2 max-w-2xl text-left text-sm text-slate-500',
        unitGrid: 'mt-6 border-t border-[#0c2340]',
        band: 'border-t border-slate-200 bg-[#f4f7fa] px-4 py-10 sm:px-8',
        bandInner: 'mx-auto w-full max-w-5xl',
        bandTitle: 'text-left text-xs font-semibold uppercase tracking-[0.24em]',
        field: 'w-full border border-slate-300 bg-white px-3 py-2.5 text-sm',
      }
    case 'residence':
      return {
        ...CLASSIC_CHROME,
        composition: 'residence',
        searchShape: 'stack',
        bookNowFill: 'primary',
        page: 'min-h-[100svh] w-full bg-[#e8e0d6] text-stone-900 sm:min-h-screen sm:px-3 sm:py-4',
        shell:
          'mx-auto flex min-h-[100svh] w-full max-w-full flex-col overflow-hidden bg-[#f7f3ee] sm:min-h-[calc(100vh-2rem)] sm:max-w-[min(90rem,calc(100vw-1.5rem))] sm:shadow-xl',
        header: 'flex flex-col gap-3 border-b border-stone-300 px-4 py-4 sm:px-10',
        unitsSection: 'bg-[#f7f3ee] px-4 py-10 sm:px-10',
        sectionInner: 'mx-auto w-full max-w-5xl',
        unitsTitle: 'text-left text-xs font-semibold uppercase tracking-[0.24em]',
        unitsIntro: 'mt-2 max-w-xl text-left text-sm text-stone-500',
        unitGrid: 'portal-units-luxe mt-8',
        band: 'border-t border-stone-300 bg-white px-4 py-10 sm:px-10',
        bandInner: 'mx-auto w-full max-w-5xl',
        bandTitle: 'text-left text-xs font-semibold uppercase tracking-[0.24em]',
        amenityChip: 'flex items-center gap-2 border border-stone-200 bg-[#f7f3ee] px-4 py-3 text-sm',
        reviewCard: 'border border-stone-200 bg-[#f7f3ee] p-5',
        field: 'w-full border border-stone-300 bg-white px-3 py-2.5 text-sm',
      }
    case 'ledger':
      return {
        ...CLASSIC_CHROME,
        composition: 'ledger',
        searchShape: 'stack',
        bookNowFill: 'primary',
        page: 'min-h-[100svh] w-full bg-stone-200 text-stone-900 sm:min-h-screen sm:px-3 sm:py-4',
        shell:
          'mx-auto flex min-h-[100svh] w-full max-w-full flex-col overflow-hidden bg-white sm:min-h-[calc(100vh-2rem)] sm:max-w-[min(90rem,calc(100vw-1.5rem))] sm:shadow-2xl',
        header: 'flex flex-col gap-3 border-b border-stone-900 px-4 py-4 sm:px-8',
        brand: 'block text-sm font-semibold uppercase tracking-[0.26em]',
        unitsSection: 'bg-white px-4 py-10 sm:px-8',
        sectionInner: 'w-full max-w-5xl',
        unitsTitle: 'text-left text-xs font-semibold uppercase tracking-[0.24em]',
        unitsIntro: 'mt-2 max-w-2xl text-left text-sm text-stone-500',
        unitGrid: 'mt-6 border-t border-stone-900',
        band: 'border-t border-stone-200 bg-stone-50 px-4 py-10 sm:px-8',
        bandInner: 'w-full max-w-5xl',
        bandTitle: 'text-left text-xs font-semibold uppercase tracking-[0.24em]',
        amenityGrid: 'mt-4 flex flex-col',
        amenityChip: 'flex items-center gap-3 border-b border-stone-200 py-3 text-sm',
        reviewCard: 'border-b border-stone-200 py-5',
        reviewInner: 'w-full max-w-3xl',
        field: 'w-full border-b border-stone-300 bg-transparent px-1 py-2.5 text-sm',
        footer: 'mt-auto border-t border-stone-900 bg-white px-4 py-4 text-center text-[11px] text-stone-500',
      }
    case 'crown_royal':
      return premiumChrome({
        composition: 'royal',
        header: 'flex flex-col items-center gap-3 border-b border-[#e8c872]/70 bg-[#fbf7ef] px-4 py-6 text-center sm:px-8',
        brandWrap: 'min-w-0 text-center',
        navWrap: 'flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em]',
      })
    case 'palace':
      return premiumChrome({
        composition: 'palace',
        headerTone: 'inverse',
        headerBg: '#120e0a',
        header: 'flex flex-col gap-3 px-4 py-4 sm:px-8',
        tagline: 'mt-1 text-[11px] uppercase tracking-[0.22em] text-[#e8c872]',
        navLink: 'text-white/80 hover:text-white',
        navPlaceholder: 'text-white/60',
      })
    case 'imperial':
      return premiumChrome({
        composition: 'imperial',
        header: 'flex flex-col items-center gap-3 border-b-2 border-[#e8c872] bg-[#fbf7ef] px-4 py-6 text-center',
        brandWrap: 'min-w-0 text-center',
        navWrap: 'flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em]',
      })
    case 'regent':
      return premiumChrome({
        composition: 'regent',
        searchShape: 'glass',
        headerTone: 'float',
        header: 'flex flex-col gap-3 px-4 py-4 sm:px-6',
        tagline: 'mt-1 text-[11px] uppercase tracking-[0.22em] text-[#e8c872]',
        navLink:
          'flex-1 rounded-full border border-[#e8c872]/70 bg-black/25 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm sm:flex-none sm:px-4',
        navPlaceholder:
          'flex-1 rounded-full border border-white/30 bg-black/20 py-2.5 text-center text-[11px] text-white/70 sm:flex-none sm:px-4',
      })
    case 'sovereign':
      return premiumChrome({
        composition: 'sovereign',
        headerTone: 'inverse',
        headerBg: '#0c0a09',
        header: 'flex flex-col items-center gap-3 px-4 py-6 text-center',
        brandWrap: 'min-w-0 text-center',
        tagline: 'mt-1 text-[11px] uppercase tracking-[0.22em] text-[#e8c872]',
        navWrap: 'flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em]',
        navLink: 'text-[#e8c872]',
        navPlaceholder: 'text-[#e8c872]/70',
      })
    case 'dynasty':
      return premiumChrome({
        composition: 'dynasty',
        searchShape: 'bar',
        headerTone: 'inverse',
        headerBg: '#6b1d2a',
        header: 'flex flex-col gap-3 px-4 py-4 sm:px-8',
        tagline: 'mt-1 text-[11px] uppercase tracking-[0.22em] text-[#e8c872]',
        navLink: 'text-white/85 hover:text-white',
        navPlaceholder: 'text-white/60',
        headingColor: '#6b1d2a',
      })
    default:
      return CLASSIC_CHROME
  }
}
