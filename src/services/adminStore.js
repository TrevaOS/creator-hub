const STORAGE_KEY = 'creator_hub_admin_store_v1';

const DEFAULT_DATA = {
  creators: [
    { id: 1, name: 'Priya Sharma', niche: 'Fashion', followers: 145000, city: 'Mumbai' },
    { id: 2, name: 'Rahul Verma', niche: 'Tech', followers: 89000, city: 'Bengaluru' },
    { id: 3, name: 'Aisha Khan', niche: 'Fitness', followers: 210000, city: 'Delhi' },
  ],
  brands: [
    { id: 1, name: 'StyleCo', industry: 'Fashion', budget: 450000 },
    { id: 2, name: 'TechGear Pro', industry: 'Electronics', budget: 800000 },
    { id: 3, name: 'FitLife', industry: 'Health', budget: 350000 },
  ],
  deals: [
    { id: 1, brand: 'StyleCo', creator: 'Priya Sharma', type: '2 Reels + 3 Stories', status: 'Active', payout: 120000 },
    { id: 2, brand: 'TechGear Pro', creator: 'Rahul Verma', type: '1 Long Video', status: 'Pending', payout: 180000 },
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
