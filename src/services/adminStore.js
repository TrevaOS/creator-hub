const STORAGE_KEY = 'creator_hub_admin_store_v1';

const DEFAULT_DATA = {
  creators: [
    { id: 1, name: 'Priya Sharma', niche: 'Fashion', followers: 145000, city: 'Mumbai' },
    { id: 2, name: 'Rahul Verma', niche: 'Tech', followers: 89000, city: 'Bengaluru' },
    { id: 3, name: 'Aisha Khan', niche: 'Fitness', followers: 210000, city: 'Delhi' },
  ],
  brands: [
    {
      id: 1,
      name: 'StyleCo Private Limited',
      industry: 'Fashion',
      budget: 450000,
      pan: 'AAECS1022K',
      gst: '27AAECS1022K1ZQ',
      cin: 'U18109MH2018PTC123456',
      email: 'finance@styleco.in',
      phone: '+91 98765 12345',
      address: 'BKC, Mumbai, Maharashtra',
      history: [
        { date: '2026-03-12', note: 'GST details verified by admin.' },
        { date: '2026-04-01', note: 'KYC documents updated.' },
      ],
    },
    {
      id: 2,
      name: 'TechGear Pro LLP',
      industry: 'Electronics',
      budget: 800000,
      pan: 'AABFT4001R',
      gst: '29AABFT4001R1ZQ',
      cin: 'U72900KA2019PTC654321',
      email: 'accounts@techgear.pro',
      phone: '+91 90000 12345',
      address: 'Indiranagar, Bengaluru',
      history: [{ date: '2026-02-21', note: 'Signed annual campaign MSA.' }],
    },
    {
      id: 3,
      name: 'FitLife Wellness Pvt Ltd',
      industry: 'Health',
      budget: 350000,
      pan: 'AACCF3009M',
      gst: '07AACCF3009M1ZA',
      cin: 'U85100DL2020PTC777888',
      email: 'ops@fitlife.in',
      phone: '+91 95555 12121',
      address: 'Saket, New Delhi',
      history: [{ date: '2026-01-09', note: 'Compliance review completed.' }],
    },
  ],
  deals: [
    { id: 1, brand: 'StyleCo', creator: 'Priya Sharma', type: '2 Reels + 3 Stories', status: 'Active', payout: 120000 },
    { id: 2, brand: 'TechGear Pro', creator: 'Rahul Verma', type: '1 Long Video', status: 'Pending', payout: 180000 },
  ],
  companies: [],
  supportTickets: [
    {
      id: 1,
      source: 'App',
      title: 'Creator app crash on setup image upload',
      raisedBy: 'Priya Sharma',
      severity: 'High',
      status: 'Open',
      linkedDealId: 1,
      createdAt: '2026-04-18T10:20:00.000Z',
    },
    {
      id: 2,
      source: 'Brand Portal',
      title: 'Deal chat notifications delayed',
      raisedBy: 'StyleCo Ops',
      severity: 'Medium',
      status: 'In Progress',
      linkedDealId: 1,
      createdAt: '2026-04-17T13:45:00.000Z',
    },
  ],
  chats: [
    {
      id: 1,
      participantType: 'Brand',
      participantName: 'StyleCo Campaign Team',
      topic: 'Deal #1 delivery timeline',
      unread: 2,
      messages: [
        { id: 1, from: 'brand', text: 'Can we get the first reel by Friday?', time: '10:10 AM' },
        { id: 2, from: 'admin', text: 'Yes, we are coordinating with creator now.', time: '10:12 AM' },
      ],
    },
    {
      id: 2,
      participantType: 'Creator',
      participantName: 'Rahul Verma',
      topic: 'TechGear Pro approval pending',
      unread: 0,
      messages: [
        { id: 1, from: 'creator', text: 'Brand has requested script edits.', time: '9:40 AM' },
      ],
    },
  ],
};

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function readStore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? safeParse(raw) : null;
  if (!parsed) return DEFAULT_DATA;
  return {
    creators: Array.isArray(parsed.creators) ? parsed.creators : DEFAULT_DATA.creators,
    brands: Array.isArray(parsed.brands) ? parsed.brands : DEFAULT_DATA.brands,
    deals: Array.isArray(parsed.deals) ? parsed.deals : DEFAULT_DATA.deals,
    companies: Array.isArray(parsed.companies) ? parsed.companies : DEFAULT_DATA.companies,
    supportTickets: Array.isArray(parsed.supportTickets) ? parsed.supportTickets : DEFAULT_DATA.supportTickets,
    chats: Array.isArray(parsed.chats) ? parsed.chats : DEFAULT_DATA.chats,
  };
}

function writeStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function delay(ms = 120) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loadAdminData() {
  await delay();
  return readStore();
}

export async function saveAdminData(data) {
  await delay();
  writeStore(data);
  return data;
}

export function resetAdminData() {
  writeStore(DEFAULT_DATA);
  return DEFAULT_DATA;
}
