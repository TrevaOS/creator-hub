const STORAGE_KEY = 'creator_hub_admin_store_v1';

const DEFAULT_DATA = {
  creators: [],
  brands: [],
  deals: [],
  companies: [],
  supportTickets: [],
  chats: [],
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

export async function addSupportTicket(ticket) {
  const current = readStore();
  const next = {
    ...current,
    supportTickets: [{ id: Date.now(), ...ticket }, ...(current.supportTickets || [])],
  };
  writeStore(next);
  return next;
}

export function resetAdminData() {
  writeStore(DEFAULT_DATA);
  return DEFAULT_DATA;
}
