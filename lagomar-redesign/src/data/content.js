// Shared copy and image URLs for all concepts. Same content, different visual treatment.

const IMG = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=85`

export const content = {
  hero: {
    title: 'A Timeless Beachfront Retreat',
    subtitle: 'Where family traditions meet coastal elegance on Fort Lauderdale’s finest stretch of sand.',
    cta: 'Explore Your Stay',
    image: IMG('1507525428034-723d964cab35', 1600), // beach resort
  },
  intro: {
    heading: 'Gracious Hospitality, Unchanged in Spirit',
    body: 'For generations, Lago Mar has welcomed families to our private beach and gracious accommodations. We offer the warmth of a classic Florida resort with the polish and comfort today’s guests expect—without the crowds, without the rush.',
  },
  accommodations: {
    heading: 'Accommodations',
    subheading: 'Rooms and suites designed for comfort and ease.',
    description: 'From spacious guest rooms to multi-bedroom suites with full kitchens, our accommodations suit families and extended stays. Many offer direct ocean or lagoon views and private balconies.',
    cta: 'View Rooms & Suites',
    image: IMG('1582719478250-c89cae4dc85b', 800),
    image2: IMG('1590496793902-7c3d327259c9', 800),
  },
  dining: {
    heading: 'Dining',
    subheading: 'From casual poolside to refined coastal fare.',
    description: 'Savor fresh, locally inspired cuisine in settings that range from relaxed to elegant. Our restaurants and bars reflect the ease of beach life and the standards of gracious hospitality.',
    cta: 'Explore Dining',
    image: IMG('1414237427422-19c4c2d33b2d', 800),
  },
  amenities: {
    heading: 'Beach, Pool & Amenities',
    subheading: 'A private beach and resort amenities at your doorstep.',
    description: 'Our half-mile of private beach, lagoon-style pool, and well-appointed grounds give guests space to unwind. Tennis, fitness, and organized activities round out the resort experience.',
    cta: 'See Amenities',
    image: IMG('1576013551621-5e8f9c26663f', 800),
    image2: IMG('1506953820596-b2f2c786753c', 800),
  },
  family: {
    heading: 'Family Experiences',
    subheading: 'Moments that become traditions.',
    description: 'Lago Mar has long been a place where families return year after year. We offer supervised programs for children, family-friendly dining, and a safe, welcoming environment for all ages.',
    cta: 'Family Programs',
    image: IMG('1506953820596-b2f2c786753c', 800),
  },
  weddings: {
    heading: 'Weddings & Events',
    subheading: 'Celebrate against the backdrop of the Atlantic.',
    description: 'Our oceanfront lawns and indoor spaces host weddings, reunions, and corporate events. Dedicated coordinators and experienced catering ensure every detail reflects your vision.',
    cta: 'Plan Your Event',
    image: IMG('1519225421980-71533d96097f', 800),
  },
  membership: {
    heading: 'Resort Club & Membership',
    subheading: 'A place to return to, year after year.',
    description: 'Lago Mar’s club membership offers preferred access to accommodations, dining, and events. It’s designed for families who have made—or wish to make—our resort a part of their story.',
    cta: 'Learn About Membership',
    image: IMG('1507525428034-723d964cab35', 800),
  },
  gallery: {
    images: [
      IMG('1507525428034-723d964cab35', 600),
      IMG('1576013551621-5e8f9c26663f', 600),
      IMG('1582719478250-c89cae4dc85b', 600),
      IMG('1414237427422-19c4c2d33b2d', 600),
      IMG('1519225421980-71533d96097f', 600),
    ],
  },
  nav: {
    links: [
      { label: 'Accommodations', href: '#accommodations' },
      { label: 'Dining', href: '#dining' },
      { label: 'Beach & Pool', href: '#amenities' },
      { label: 'Family', href: '#family' },
      { label: 'Weddings & Events', href: '#weddings' },
      { label: 'Membership', href: '#membership' },
    ],
  },
  footer: {
    tagline: 'Lago Mar Beach Resort & Club',
    address: '1700 South Ocean Lane, Fort Lauderdale, Florida 33316',
    phone: '(954) 523-6511',
    links: [
      { label: 'Contact', href: '#' },
      { label: 'Reservations', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Privacy', href: '#' },
    ],
  },
}
