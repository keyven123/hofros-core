/** Default micro-site layout (must stay aligned with `App\Support\GuestPortalLayout::defaults()` in PHP). */
export function emptyGuestPortalLayout() {
  return {
    businessName: '',
    businessTagline: '',
    phone: '',
    email: '',
    address: '',
    amenities: ['Free WiFi', 'Parking', 'Air Conditioning', 'Pool'],
    reviews: [
      { name: 'Sarah L.', initial: 'S', rating: 5, text: 'Amazing stay! Everything was perfect.' },
      { name: 'James M.', initial: 'J', rating: 5, text: 'Great location and super clean.' },
      { name: 'Aira K.', initial: 'A', rating: 5, text: 'We will definitely book again.' },
    ],
    sectionOrder: ['hero', 'units', 'amenities', 'reviews', 'contact'],
    sectionVisibility: {
      hero: true,
      units: true,
      amenities: true,
      reviews: true,
      contact: true,
    },
    showReviews: true,
    showMap: true,
  }
}
