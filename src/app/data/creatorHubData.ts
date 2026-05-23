export type DeliverableLabel = string;

export type MarketingStatus = 'Active' | 'Upcoming' | 'Paused' | 'Completed';
export type MarketingPipelineStage = 'Brief' | 'Shortlist' | 'Negotiation' | 'Live' | 'Wrap';

export interface MarketingMeta {
  status: MarketingStatus;
  pipelineStage: MarketingPipelineStage;
  budget: number;
  spendToDate: number;
  targetLaunch: string;
  campaignObjective: string;
  owner: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };
  tags: string[];
  inboundLeads: number;
  notes: string;
}

export interface BrandCampaign {
  id: number;
  name: string;
  tagline: string;
  location: string;
  rating: number;
  offer: string;
  deliverables: DeliverableLabel[];
  audienceFit: number;
  fitGrade: string;
  brief: string;
  gallery: string[];
  thumb: string;
  lat: number;
  lng: number;
  category: string;
  averageTicket: string;
  marketing: MarketingMeta;
}

export type ChatMessageType = 'text' | 'profileCard' | 'offer' | 'counter' | 'calendar';

export interface BaseChatMessage {
  id: string;
  type: ChatMessageType;
  from: 'brand' | 'creator';
  createdAt: string; // ISO timestamp
}

export interface TextChatMessage extends BaseChatMessage {
  type: 'text';
  text: string;
}

export interface ProfileCardChatMessage extends BaseChatMessage {
  type: 'profileCard';
  profile: {
    name: string;
    handle: string;
    avatar: string;
    niches: string[];
    reach: string;
    engagement: string;
    intro: string;
  };
}

export interface OfferChatMessage extends BaseChatMessage {
  type: 'offer' | 'counter';
  amount: number;
  currency: 'INR';
  deliverables: string[];
  label: string;
  note?: string;
}

export interface CalendarChatMessage extends BaseChatMessage {
  type: 'calendar';
  date: string;
  timeSlot: string;
  status: 'proposed' | 'accepted' | 'declined';
}

export type ChatMessage =
  | TextChatMessage
  | ProfileCardChatMessage
  | OfferChatMessage
  | CalendarChatMessage;

export type ChatStage = 'match' | 'negotiating' | 'booked' | 'content' | 'done';

export interface ChatThread {
  brandId: number;
  stage: ChatStage;
  unreadCount: number;
  lastMessagePreview: string;
  lastMessageAtLabel: string;
  matchedLabel: string;
  lastMessageIso: string;
  messages: ChatMessage[];
}

export type ActivityCategory =
  | 'pitch'
  | 'like'
  | 'star'
  | 'negotiation'
  | 'profile'
  | 'note'
  | 'support';

export interface ActivityEvent {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  category: ActivityCategory;
  brandId?: number;
  amount?: number;
}

export type SupportTicketStatus = 'Open' | 'In Progress' | 'Waiting' | 'Resolved';

export interface SupportTicket {
  id: string;
  brandId?: number;
  title: string;
  summary: string;
  status: SupportTicketStatus;
  submittedAt: string;
  owner: {
    name: string;
    role: string;
  };
  channel: 'Email' | 'In-product' | 'Whatsapp';
  type: 'Dispute' | 'Payout' | 'Bug' | 'Feature' | 'General';
  priority: 'High' | 'Medium' | 'Low';
}

export interface AdminAlert {
  id: string;
  label: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
}

export type PortfolioItemType = 'Case Study' | 'Video' | 'Press' | 'Post' | 'Link';

export interface PortfolioItem {
  id: string;
  title: string;
  url: string;
  description: string;
  type: PortfolioItemType;
}

export interface CreatorHighlight {
  label: string;
  value: string;
}

export interface CreatorProfileData {
  bio: string;
  tagline: string;
  location: string;
  niches: string[];
  highlights: CreatorHighlight[];
  about: string;
  spotifyPlaylistUrl?: string;
  spotifyPlaylistTitle?: string;
  spotifyPlaylistDescription?: string;
  spotifyPlaylistFollowers?: string;
  portfolio: PortfolioItem[];
  gallery: string[];
}

export const MARKETING_STATUS_META: Record<MarketingStatus, { label: string; tone: 'emerald' | 'sky' | 'amber' | 'gray'; }> = {
  Active: { label: 'Active', tone: 'emerald' },
  Upcoming: { label: 'Upcoming', tone: 'sky' },
  Paused: { label: 'Paused', tone: 'amber' },
  Completed: { label: 'Completed', tone: 'gray' },
};

export const MARKETING_PIPELINE_META: Record<MarketingPipelineStage, { label: string; tone: 'purple' | 'cyan' | 'amber' | 'emerald' | 'gray'; }> = {
  Brief: { label: 'Briefing', tone: 'purple' },
  Shortlist: { label: 'Shortlist', tone: 'cyan' },
  Negotiation: { label: 'Negotiation', tone: 'amber' },
  Live: { label: 'Live Now', tone: 'emerald' },
  Wrap: { label: 'Wrap Up', tone: 'gray' },
};

export const BRAND_CAMPAIGNS: BrandCampaign[] = [
  {
    id: 1,
    name: 'The Smokehouse Bar',
    tagline: 'Weekend smokehouse brunch & craft cocktails',
    location: 'Indiranagar · 2.5 km',
    rating: 4.6,
    offer: 'Free Meal + ₹5,000 stipend',
    deliverables: ['1 Reel', '2 Stories', '15 Photos'],
    audienceFit: 92,
    fitGrade: 'A+',
    brief: "Capture our new smoked brisket board and bourbon cocktails with warm, editorial vibes.",
    gallery: [
      'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1555992336-cbf8e70f7317?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 12.9716,
    lng: 77.6412,
    category: 'Smokehouse',
    averageTicket: '₹1,800',
    marketing: {
      status: 'Active',
      pipelineStage: 'Live',
      budget: 85000,
      spendToDate: 42000,
      targetLaunch: '2026-05-20',
      campaignObjective: 'Drive brunch reservations & cocktail bookings',
      owner: { name: 'Rhea Mathews', role: 'Brand Manager', email: 'rhea@smokehouse.in', phone: '+91 99802 33441' },
      tags: ['Brunch', 'Cocktails', 'Premium'],
      inboundLeads: 18,
      notes: 'High intent audience from Koramangala and Indiranagar.'
    }
  },
  {
    id: 2,
    name: 'Cafe Verde',
    tagline: 'Plant-forward all-day cafe',
    location: 'Koramangala · 1.2 km',
    rating: 4.4,
    offer: '₹3,000 + Chef’s Tasting Menu',
    deliverables: ['2 Reels', 'Carousel Post'],
    audienceFit: 88,
    fitGrade: 'A',
    brief: 'Tell the story of our seasonal brunch board and cold brew tower.',
    gallery: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1520854221050-0f4caff449fb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 12.9352,
    lng: 77.6245,
    category: 'Cafe',
    averageTicket: '₹950',
    marketing: {
      status: 'Active',
      pipelineStage: 'Negotiation',
      budget: 55000,
      spendToDate: 18000,
      targetLaunch: '2026-06-01',
      campaignObjective: 'Launch summer brunch & cold brew tower',
      owner: { name: 'Arvind Rao', role: 'Marketing Lead', email: 'arvind@cafeverde.in', phone: '+91 98450 11223' },
      tags: ['Sustainable', 'Brunch'],
      inboundLeads: 11,
      notes: 'Need creator who can handle moody interiors + product close-ups.'
    }
  },
  {
    id: 3,
    name: 'Roasted Bean Co.',
    tagline: 'Single origin micro-roastery',
    location: 'HSR Layout · 3.1 km',
    rating: 4.2,
    offer: '₹2,500 + Coffee Subscription',
    deliverables: ['1 Reel', '3 Stories', 'Newsletter Feature'],
    audienceFit: 79,
    fitGrade: 'B+',
    brief: 'Morning ritual content featuring our new pour-over bar and roastery.',
    gallery: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1527169402691-feff5539e52c?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 12.9081,
    lng: 77.6476,
    category: 'Coffee',
    averageTicket: '₹650',
    marketing: {
      status: 'Paused',
      pipelineStage: 'Shortlist',
      budget: 32000,
      spendToDate: 9000,
      targetLaunch: '2026-06-15',
      campaignObjective: 'Promote subscription service & new origins',
      owner: { name: 'Nina Kapur', role: 'Growth Marketer', email: 'nina@roastedbean.co', phone: '+91 88612 44332' },
      tags: ['Coffee', 'Subscriptions'],
      inboundLeads: 6,
      notes: 'Awaiting updated photography mood-board from agency.'
    }
  },
  {
    id: 4,
    name: 'Urban Taco Lab',
    tagline: 'Modern Mexican test kitchen',
    location: 'Church Street · 0.9 km',
    rating: 4.7,
    offer: '₹6,000 + Unlimited Tasting',
    deliverables: ['2 Reels', 'TikTok Short', '1 Blog'],
    audienceFit: 94,
    fitGrade: 'A+',
    brief: 'Story-led content on taco R&D nights and tasting menu.',
    gallery: [
      'https://images.unsplash.com/photo-1608032361389-03a99f1583e5?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1612872087720-bb876e1169a6?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1608032361389-03a99f1583e5?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 12.9724,
    lng: 77.6084,
    category: 'Mexican',
    averageTicket: '₹1,350',
    marketing: {
      status: 'Active',
      pipelineStage: 'Live',
      budget: 92000,
      spendToDate: 61000,
      targetLaunch: '2026-05-30',
      campaignObjective: 'Launch chef residencies & tasting menus',
      owner: { name: 'Kabir Shah', role: 'Head of Marketing', email: 'kabir@urbantacolab.com', phone: '+91 80732 11881' },
      tags: ['Chef Collab', 'Experiential'],
      inboundLeads: 24,
      notes: 'Strong engagement from foodie micro-influencers.'
    }
  },
  {
    id: 5,
    name: 'Moonlit Rooftop',
    tagline: 'Skyline dining & live music',
    location: 'MG Road · 1.8 km',
    rating: 4.5,
    offer: '₹7,500 + Experience Voucher',
    deliverables: ['1 Reel', 'Drone Shots', 'Live Stories'],
    audienceFit: 90,
    fitGrade: 'A',
    brief: 'Highlight sunset golden hour cocktails and acoustic sets.',
    gallery: [
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 12.9710,
    lng: 77.6205,
    category: 'Rooftop',
    averageTicket: '₹2,200',
    marketing: {
      status: 'Upcoming',
      pipelineStage: 'Brief',
      budget: 120000,
      spendToDate: 15000,
      targetLaunch: '2026-06-20',
      campaignObjective: 'Summer sundowner launch & corporate bookings',
      owner: { name: 'Ananya Joshi', role: 'Experience Lead', email: 'ananya@moonlit.com', phone: '+91 96062 77891' },
      tags: ['Luxury', 'Events'],
      inboundLeads: 9,
      notes: 'Shortlist creators with drone or FPV capability.'
    }
  },
  {
    id: 6,
    name: 'Seoul Bowl Kitchen',
    tagline: 'Fast-casual Korean rice bowls',
    location: 'BTM Layout · 4.4 km',
    rating: 4.3,
    offer: '₹3,500 + Yearly Membership',
    deliverables: ['1 Reel', 'UGC Video', 'Review'],
    audienceFit: 81,
    fitGrade: 'B+',
    brief: 'Hero the sizzle, plating and K-pop vibe inside the store.',
    gallery: [
      'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 12.9121,
    lng: 77.6100,
    category: 'Fast Casual',
    averageTicket: '₹550',
    marketing: {
      status: 'Active',
      pipelineStage: 'Negotiation',
      budget: 48000,
      spendToDate: 22000,
      targetLaunch: '2026-05-25',
      campaignObjective: 'Launch loyalty program and late-night delivery',
      owner: { name: 'Seung Min', role: 'Marketing Coordinator', email: 'seung@seoulbowl.in', phone: '+91 81470 33445' },
      tags: ['Korean', 'Delivery'],
      inboundLeads: 13,
      notes: 'Wants bilingual captions (English + Korean slang).'
    }
  },
  {
    id: 7,
    name: 'Bombay Soda Club',
    tagline: 'Nostalgic soda & chaat bar',
    location: 'Jayanagar · 5.1 km',
    rating: 4.1,
    offer: '₹2,200 + Custom Soda Box',
    deliverables: ['1 Reel', 'Photo Set'],
    audienceFit: 76,
    fitGrade: 'B',
    brief: 'Showcase colourful golas, neon lighting and retro soda machine.',
    gallery: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 12.9250,
    lng: 77.5938,
    category: 'Dessert Bar',
    averageTicket: '₹400',
    marketing: {
      status: 'Paused',
      pipelineStage: 'Brief',
      budget: 28000,
      spendToDate: 4000,
      targetLaunch: '2026-07-10',
      campaignObjective: 'Reopen refurbished flagship store',
      owner: { name: 'Ishika Patel', role: 'Brand Strategist', email: 'ishika@bombaysoda.club', phone: '+91 74111 66432' },
      tags: ['Heritage', 'Family'],
      inboundLeads: 4,
      notes: 'Waiting on final decor photoshoot before reactivating.'
    }
  },
  {
    id: 8,
    name: 'Noodle District',
    tagline: 'Pan-Asian noodle hall',
    location: 'Whitefield · 11 km',
    rating: 4.3,
    offer: '₹4,800 + Unlimited Tastings',
    deliverables: ['2 Reels', 'Story Set', 'Blog'],
    audienceFit: 83,
    fitGrade: 'B+',
    brief: 'Highlight variety of noodles, wok flames and family-style dining.',
    gallery: [
      'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 12.9698,
    lng: 77.7499,
    category: 'Asian',
    averageTicket: '₹1,200',
    marketing: {
      status: 'Active',
      pipelineStage: 'Shortlist',
      budget: 76000,
      spendToDate: 27000,
      targetLaunch: '2026-06-05',
      campaignObjective: 'Promote corporate lunch subscriptions',
      owner: { name: 'Vikram Iyer', role: 'Marketing Director', email: 'vikram@noodledistrict.in', phone: '+91 95382 88421' },
      tags: ['Family', 'Corporate'],
      inboundLeads: 16,
      notes: 'Prefers creators with family audience in East Bangalore.'
    }
  },
  {
    id: 9,
    name: 'Craft Tonic Lab',
    tagline: 'Apothecary gin bar & tonic studio',
    location: 'Lavelle Road · 1.4 km',
    rating: 4.8,
    offer: '₹8,500 + Mixology Kit',
    deliverables: ['Behind-the-scenes Reel', 'Cocktail Tutorial', 'Instagram Live'],
    audienceFit: 95,
    fitGrade: 'A+',
    brief: 'Showcase the infusion wall and custom tonic pairings.',
    gallery: [
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1527169402691-feff5539e52c?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1527169402691-feff5539e52c?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 12.9690,
    lng: 77.5942,
    category: 'Bar',
    averageTicket: '₹2,600',
    marketing: {
      status: 'Active',
      pipelineStage: 'Negotiation',
      budget: 135000,
      spendToDate: 51000,
      targetLaunch: '2026-05-28',
      campaignObjective: 'Launch gin residency with international guest bartenders',
      owner: { name: 'Meera Fernandes', role: 'Mixology Lead', email: 'meera@crafttoniclab.com', phone: '+91 91133 22014' },
      tags: ['Luxury', 'Nightlife'],
      inboundLeads: 21,
      notes: 'Requires invites for media tasting on 22 May.'
    }
  },
  {
    id: 10,
    name: 'Sourdough Society',
    tagline: 'Artisan bakery & fermentation studio',
    location: 'Sadashivanagar · 6.4 km',
    rating: 4.6,
    offer: '₹5,000 + Baking Workshop',
    deliverables: ['Recipe Reel', 'Photography Set', 'Newsletter Feature'],
    audienceFit: 89,
    fitGrade: 'A',
    brief: 'Document the slow ferment process, crumb shots and community bake mornings.',
    gallery: [
      'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 13.0119,
    lng: 77.5697,
    category: 'Bakery',
    averageTicket: '₹750',
    marketing: {
      status: 'Upcoming',
      pipelineStage: 'Shortlist',
      budget: 62000,
      spendToDate: 12000,
      targetLaunch: '2026-06-12',
      campaignObjective: 'Launch fermentation studio & weekend workshops',
      owner: { name: 'Deepika Anand', role: 'Community Lead', email: 'deepika@sourdoughsociety.in', phone: '+91 99002 11981' },
      tags: ['Workshops', 'Fermentation'],
      inboundLeads: 8,
      notes: 'Mandates mention of sustainable sourcing and local grains.'
    }
  },
  {
    id: 11,
    name: 'Bayleaf Thali House',
    tagline: 'Regional Indian thalis on rotating menus',
    location: 'J.P. Nagar · 7.2 km',
    rating: 4.3,
    offer: '₹3,800 + Family Dining Voucher',
    deliverables: ['1 Reel', 'Photo Story'],
    audienceFit: 82,
    fitGrade: 'B+',
    brief: 'Highlight the variety of thalis and chef stories behind heirloom recipes.',
    gallery: [
      'https://images.unsplash.com/photo-1576402187878-974f70cd814c?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1576402187878-974f70cd814c?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 12.9054,
    lng: 77.5850,
    category: 'Indian',
    averageTicket: '₹850',
    marketing: {
      status: 'Active',
      pipelineStage: 'Negotiation',
      budget: 54000,
      spendToDate: 21000,
      targetLaunch: '2026-05-27',
      campaignObjective: 'Drive weekday lunch footfall',
      owner: { name: 'Sameera Kulkarni', role: 'Marketing Manager', email: 'sameera@bayleaf.in', phone: '+91 99864 55221' },
      tags: ['Family', 'Regional'],
      inboundLeads: 12,
      notes: 'Needs creators comfortable telling cultural food stories.'
    }
  },
  {
    id: 12,
    name: 'Soho Salad Bar',
    tagline: 'Build-your-own salad with seasonal produce',
    location: 'UB City · 1.1 km',
    rating: 4.1,
    offer: '₹2,900 + Meal Subscription',
    deliverables: ['UGC Reel', 'Story Pack'],
    audienceFit: 77,
    fitGrade: 'B',
    brief: 'Focus on ingredient provenance, macro tracking and office lunch use-cases.',
    gallery: [
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 12.9719,
    lng: 77.5965,
    category: 'Healthy',
    averageTicket: '₹600',
    marketing: {
      status: 'Paused',
      pipelineStage: 'Shortlist',
      budget: 30000,
      spendToDate: 7000,
      targetLaunch: '2026-06-18',
      campaignObjective: 'Reboot corporate catering program',
      owner: { name: 'Varun Desai', role: 'Growth Analyst', email: 'varun@sohosalad.in', phone: '+91 73374 44990' },
      tags: ['Health', 'Corporate'],
      inboundLeads: 5,
      notes: 'Waiting on new packaging assets from design team.'
    }
  },
  {
    id: 13,
    name: 'Habibi Mezze Club',
    tagline: 'Modern Levantine plates & nightlife',
    location: 'Koramangala · 2.0 km',
    rating: 4.6,
    offer: '₹6,800 + VIP Table',
    deliverables: ['Nightlife Reel', 'Photo Set', 'Live Stories'],
    audienceFit: 91,
    fitGrade: 'A',
    brief: 'Capture the mezze spread, DJ nights and belly dance performances.',
    gallery: [
      'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 12.9392,
    lng: 77.6260,
    category: 'Mediterranean',
    averageTicket: '₹2,800',
    marketing: {
      status: 'Active',
      pipelineStage: 'Live',
      budget: 150000,
      spendToDate: 92000,
      targetLaunch: '2026-05-22',
      campaignObjective: 'Launch weekend supper club series',
      owner: { name: 'Layla Rahim', role: 'Experience Director', email: 'layla@habibiclub.com', phone: '+91 91088 66452' },
      tags: ['Nightlife', 'Luxury'],
      inboundLeads: 26,
      notes: 'Requires bilingual creators (English + Arabic phrases) for authenticity.'
    }
  },
  {
    id: 14,
    name: 'Tiffin Tales',
    tagline: 'Workday subscription tiffin boxes',
    location: 'Electronic City · 15 km',
    rating: 4.0,
    offer: '₹2,200 + 1 Month Subscription',
    deliverables: ['1 Reel', 'Review', 'Stories'],
    audienceFit: 74,
    fitGrade: 'B',
    brief: 'Focus on convenience, packaging, and weekly rotating menus.',
    gallery: [
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1506368083636-6defb67639c5?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 12.8389,
    lng: 77.6770,
    category: 'Subscription',
    averageTicket: '₹320',
    marketing: {
      status: 'Upcoming',
      pipelineStage: 'Brief',
      budget: 28000,
      spendToDate: 3000,
      targetLaunch: '2026-07-01',
      campaignObjective: 'Acquire tech park subscriptions',
      owner: { name: 'Chirag Bansal', role: 'Growth Lead', email: 'chirag@tiffintales.in', phone: '+91 87480 11211' },
      tags: ['Subscription', 'Corporate'],
      inboundLeads: 3,
      notes: 'Wants creators who can shoot office lunchtime POVs.'
    }
  },
  {
    id: 15,
    name: 'Artisan Gelato Lab',
    tagline: 'Small batch gelato & dessert studio',
    location: 'Indiranagar · 2.7 km',
    rating: 4.7,
    offer: '₹4,200 + Bespoke Flavor Creation',
    deliverables: ['Stop-motion Reel', 'Photography Set'],
    audienceFit: 93,
    fitGrade: 'A+',
    brief: 'Showcase churn process, limited edition flavors and tasting flights.',
    gallery: [
      'https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1551972873-bc03d240a910?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 12.9714,
    lng: 77.6404,
    category: 'Dessert',
    averageTicket: '₹450',
    marketing: {
      status: 'Active',
      pipelineStage: 'Negotiation',
      budget: 60000,
      spendToDate: 26000,
      targetLaunch: '2026-05-24',
      campaignObjective: 'Launch summer gelato flights',
      owner: { name: 'Beatrice Pinto', role: 'Brand Custodian', email: 'bea@gelatolab.in', phone: '+91 91233 77880' },
      tags: ['Dessert', 'Lifestyle'],
      inboundLeads: 17,
      notes: 'Wants creators experienced with macro dessert photography.'
    }
  },
  {
    id: 16,
    name: 'Forest & Flame',
    tagline: 'Wood-fired dining inside urban greenhouse',
    location: 'Hebbal · 9.2 km',
    rating: 4.8,
    offer: '₹9,500 + Chef’s Table',
    deliverables: ['Cinematic Reel', 'Editorial Photo Set', 'Story Highlights'],
    audienceFit: 97,
    fitGrade: 'A+',
    brief: 'Emphasize greenhouse architecture, open fire kitchen and hyperlocal produce.',
    gallery: [
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 13.0510,
    lng: 77.5900,
    category: 'Fine Dining',
    averageTicket: '₹3,500',
    marketing: {
      status: 'Active',
      pipelineStage: 'Live',
      budget: 210000,
      spendToDate: 148000,
      targetLaunch: '2026-05-18',
      campaignObjective: 'Launch immersive greenhouse dinners',
      owner: { name: 'Harper Nayak', role: 'Experience Curator', email: 'harper@forestandflame.co', phone: '+91 90199 22331' },
      tags: ['Fine Dining', 'Experiential'],
      inboundLeads: 34,
      notes: 'Requires moodboard approvals before shoot day.'
    }
  },
  {
    id: 17,
    name: 'Bao Binge',
    tagline: 'Modern Asian bites & craft sodas',
    location: 'HSR Layout · 3.7 km',
    rating: 4.2,
    offer: '₹3,200 + Bao Kits',
    deliverables: ['1 Reel', 'How-to Story', 'UGC Clip'],
    audienceFit: 80,
    fitGrade: 'B+',
    brief: 'Highlight bao shaping, steaming, and dipping sauces.',
    gallery: [
      'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1604908176997-12518821a22d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 12.9154,
    lng: 77.6415,
    category: 'Asian',
    averageTicket: '₹680',
    marketing: {
      status: 'Active',
      pipelineStage: 'Negotiation',
      budget: 42000,
      spendToDate: 15000,
      targetLaunch: '2026-05-26',
      campaignObjective: 'Drive delivery orders for bao party boxes',
      owner: { name: 'Gwen Lin', role: 'Operations & Marketing', email: 'gwen@baobinge.asia', phone: '+91 98860 33412' },
      tags: ['Delivery', 'Asian'],
      inboundLeads: 10,
      notes: 'Prefer creators who can shoot ASMR steam reveals.'
    }
  },
  {
    id: 18,
    name: 'Plant Haus',
    tagline: 'Vegan cafe meets botanical studio',
    location: 'Malleshwaram · 6.8 km',
    rating: 4.4,
    offer: '₹3,700 + Botanical Workshop',
    deliverables: ['Reel', 'Photo Essay', 'Blog Feature'],
    audienceFit: 85,
    fitGrade: 'A',
    brief: 'Showcase edible flowers, plant styling workshops and zero-waste ethos.',
    gallery: [
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1525338078858-d762b5e32ce5?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 13.0016,
    lng: 77.5695,
    category: 'Vegan',
    averageTicket: '₹740',
    marketing: {
      status: 'Active',
      pipelineStage: 'Shortlist',
      budget: 52000,
      spendToDate: 16000,
      targetLaunch: '2026-06-03',
      campaignObjective: 'Grow workshop bookings & cafe sales',
      owner: { name: 'Neha Krishnan', role: 'Founder', email: 'neha@planthaus.in', phone: '+91 90360 77812' },
      tags: ['Vegan', 'Workshops'],
      inboundLeads: 14,
      notes: 'Needs creators with earthy, slow living aesthetic.'
    }
  },
  {
    id: 19,
    name: 'Midnight Commissary',
    tagline: 'Late night comfort food & delivery bar',
    location: 'Koramangala · 2.8 km',
    rating: 4.2,
    offer: '₹4,000 + Midnight Feast',
    deliverables: ['After-hours Reel', 'Story Series'],
    audienceFit: 86,
    fitGrade: 'A',
    brief: 'Capture kitchen hustle, packaging and best-selling midnight menu.',
    gallery: [
      'https://images.unsplash.com/photo-1546069901-5ec6a79120b0?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1546069901-5ec6a79120b0?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 12.9346,
    lng: 77.6201,
    category: 'Delivery',
    averageTicket: '₹520',
    marketing: {
      status: 'Active',
      pipelineStage: 'Negotiation',
      budget: 58000,
      spendToDate: 19000,
      targetLaunch: '2026-05-21',
      campaignObjective: 'Grow late-night orders & new dark menu launch',
      owner: { name: 'Vivaan Kapoor', role: 'Ops & Growth', email: 'vivaan@midnightcommissary.in', phone: '+91 99004 33112' },
      tags: ['Late Night', 'Delivery'],
      inboundLeads: 15,
      notes: 'Wants creators comfortable filming at 1am kitchen rush.'
    }
  },
  {
    id: 20,
    name: 'Coastal Catch Club',
    tagline: 'Seafood shack with day-boat sourcing',
    location: 'Yelahanka · 14 km',
    rating: 4.5,
    offer: '₹6,200 + Fisherman’s Experience',
    deliverables: ['Travel Reel', 'Story Highlights', 'Blog Feature'],
    audienceFit: 88,
    fitGrade: 'A',
    brief: 'Tell the journey from morning catch to coastal-inspired plates.',
    gallery: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1514516430032-7d5c4f0ace2b?auto=format&fit=crop&w=900&q=80'
    ],
    thumb: 'https://images.unsplash.com/photo-1514516430032-7d5c4f0ace2b?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
    lat: 13.1035,
    lng: 77.5962,
    category: 'Seafood',
    averageTicket: '₹1,650',
    marketing: {
      status: 'Upcoming',
      pipelineStage: 'Shortlist',
      budget: 88000,
      spendToDate: 14000,
      targetLaunch: '2026-06-25',
      campaignObjective: 'Launch weekend coastal brunch and fish market pop-up',
      owner: { name: 'Joanne D’Souza', role: 'Marketing Captain', email: 'jo@coastalcatch.club', phone: '+91 98805 22009' },
      tags: ['Seafood', 'Experiential'],
      inboundLeads: 12,
      notes: 'Needs creators comfortable traveling to docks pre-dawn.'
    }
  }
];

export const CREATOR_ACTIVITY_EVENTS: ActivityEvent[] = [
  {
    id: 'act-1001',
    timestamp: '2026-05-12T14:32:00+05:30',
    title: 'Pitch sent to Bayleaf Thali House',
    description: 'Shared profile preview and quoted ₹38,000 package.',
    category: 'pitch',
    brandId: 11,
  },
  {
    id: 'act-1002',
    timestamp: '2026-05-12T13:20:00+05:30',
    title: 'Offer accepted — Artisan Gelato Lab',
    description: 'Negotiated to ₹45,000 + bespoke flavor session.',
    category: 'negotiation',
    brandId: 15,
    amount: 45000,
  },
  {
    id: 'act-1003',
    timestamp: '2026-05-12T11:05:00+05:30',
    title: 'Creator starred Plant Haus campaign',
    category: 'star',
    brandId: 18,
  },
  {
    id: 'act-1004',
    timestamp: '2026-05-11T18:20:00+05:30',
    title: 'Calendar slot confirmed with Forest & Flame',
    description: 'Dinner tasting locked for May 24, 8:00 PM.',
    category: 'negotiation',
    brandId: 16,
  },
  {
    id: 'act-1005',
    timestamp: '2026-05-11T16:10:00+05:30',
    title: 'Support ticket created — Midnight Commissary',
    description: 'Reported late payment for April deliverable.',
    category: 'support',
    brandId: 19,
  },
  {
    id: 'act-1006',
    timestamp: '2026-05-11T12:45:00+05:30',
    title: 'Profile updated with new portfolio deck',
    category: 'profile',
  },
  {
    id: 'act-1007',
    timestamp: '2026-05-10T21:00:00+05:30',
    title: 'Liked Soho Salad Bar brief',
    category: 'like',
    brandId: 12,
  },
];

export const SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'sup-501',
    brandId: 19,
    title: 'Payout delay — April deliverable',
    summary: 'Creator reports pending payout of ₹18,500. Finance verification requested.',
    status: 'In Progress',
    submittedAt: '2026-05-11T15:05:00+05:30',
    owner: { name: 'Isha B.', role: 'Creator Success' },
    channel: 'In-product',
    type: 'Payout',
    priority: 'High',
  },
  {
    id: 'sup-502',
    brandId: 13,
    title: 'Usage rights clarification',
    summary: 'Brand asking for 6-month paid amplification — needs contract template.',
    status: 'Open',
    submittedAt: '2026-05-12T09:40:00+05:30',
    owner: { name: 'Ravi K.', role: 'Account Manager' },
    channel: 'Email',
    type: 'Dispute',
    priority: 'Medium',
  },
  {
    id: 'sup-503',
    brandId: 7,
    title: 'Map pin incorrect on CreatorHome',
    summary: 'Seoul Bowl location off by 1.5 km on map — requires update.',
    status: 'Waiting',
    submittedAt: '2026-05-10T19:25:00+05:30',
    owner: { name: 'Neeraj D.', role: 'Product Ops' },
    channel: 'In-product',
    type: 'Bug',
    priority: 'Low',
  },
  {
    id: 'sup-504',
    title: 'Creator onboarding request',
    summary: 'New cafe collective wants 5 seats for internal marketers.',
    status: 'Resolved',
    submittedAt: '2026-05-09T10:10:00+05:30',
    owner: { name: 'Divya S.', role: 'Support Lead' },
    channel: 'Whatsapp',
    type: 'General',
    priority: 'Low',
  },
  {
    id: 'sup-505',
    brandId: 3,
    title: 'Content revision dispute',
    summary: 'Creator declined additional free reshoot; mediation needed.',
    status: 'Open',
    submittedAt: '2026-05-12T07:55:00+05:30',
    owner: { name: 'Amaan P.', role: 'Disputes Desk' },
    channel: 'Email',
    type: 'Dispute',
    priority: 'High',
  },
];

export const ADMIN_ALERTS: AdminAlert[] = [
  {
    id: 'alert-1',
    label: 'Creator payout SLA risk',
    detail: '3 payouts cross 48h threshold — finance escalation triggered.',
    severity: 'critical',
  },
  {
    id: 'alert-2',
    label: 'Campaign approvals backlog',
    detail: '7 briefs pending compliance sign-off for more than 24h.',
    severity: 'warning',
  },
  {
    id: 'alert-3',
    label: 'New brand signups',
    detail: '5 new brands onboarded this week — assign success owners.',
    severity: 'info',
  },
];
