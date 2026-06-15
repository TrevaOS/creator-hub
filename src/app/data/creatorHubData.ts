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
  createdAt: string;
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

export const BRAND_CAMPAIGNS: BrandCampaign[] = [];

export const CREATOR_ACTIVITY_EVENTS: ActivityEvent[] = [];

export const SUPPORT_TICKETS: SupportTicket[] = [];

export const ADMIN_ALERTS: AdminAlert[] = [];
