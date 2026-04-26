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
    case 'bold_modern':
    default:
      return {
        className:
          'w-full py-3 text-sm font-black text-white shadow-sm transition hover:brightness-105 rounded-xl',
        style: { backgroundColor: '#dc2626' },
      }
  }
}
