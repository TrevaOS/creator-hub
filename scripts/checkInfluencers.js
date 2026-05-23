import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_URL = path.join(__dirname, '..', 'public', 'data', 'influencers.csv');
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&h=200&crop=faces';

function parseCsv(text) {
  const rows = [];
  let current = [];
  let cell = '';
  let insideQuotes = false;

  const pushCell = () => {
    current.push(normalizeValue(cell));
    cell = '';
  };

  const pushRow = () => {
    if (current.length === 0 || current.every((value) => value === '')) {
      current = [];
      return;
    }
    rows.push(current);
    current = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (insideQuotes && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === ',' && !insideQuotes) {
      pushCell();
      continue;
    }

    if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && text[i + 1] === '\n') {
        i += 1;
      }
      pushCell();
      pushRow();
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || current.length > 0) {
    pushCell();
    pushRow();
  }

  return rows;
}

function normalizeHeader(value) {
  return value.replace(/\uFEFF/g, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function normalizeValue(value) {
  const cleaned = value.replace(/\uFEFF/g, '').trim();
  if (!cleaned) {
    return '';
  }

  const normalized = cleaned.replace(/\s+/g, ' ');
  const lowered = normalized.toLowerCase();
  if (lowered === 'na' || lowered === 'n/a' || lowered === 'profile not available') {
    return '';
  }

  return normalized;
}

function splitTags(value) {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return [];
  }

  const pieces = normalized
    .split(/[,/|·]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const seen = new Set();
  const result = [];

  pieces.forEach((part) => {
    const normalizedPart = part.replace(/\s+/g, ' ');
    const key = normalizedPart.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(normalizedPart);
    }
  });

  return result;
}

function buildInstagramHandle(profileId, profileUrl) {
  let candidate = profileId;

  if (!candidate && profileUrl) {
    const match = profileUrl.match(/instagram\.com\/([^/?#]+)/i);
    if (match && match[1]) {
      candidate = match[1];
    }
  }

  if (!candidate) {
    return null;
  }

  const sanitized = candidate.replace(/^@/, '').replace(/\s+/g, '').replace(/[^a-z0-9._]/gi, '');
  return sanitized || null;
}

function buildAvatarUrl(profileUrl, handle) {
  if (handle) {
    return `https://unavatar.io/instagram/${encodeURIComponent(handle)}`;
  }

  if (profileUrl) {
    return `https://unavatar.io/${encodeURIComponent(profileUrl)}`;
  }

  return DEFAULT_AVATAR;
}

function buildIdentifier(handle, profileUrl, name, index) {
  const base = handle ?? profileUrl ?? name;
  if (!base) {
    return `influencer-${index + 1}`;
  }

  const slug = base
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || `influencer-${index + 1}`;
}

function buildInfluencerRecords(rows) {
  if (rows.length === 0) {
    return [];
  }

  const header = rows[0];
  const headerIndex = new Map();
  header.forEach((label, index) => {
    headerIndex.set(normalizeHeader(label), index);
  });

  return rows
    .slice(1)
    .map((row, index) => createInfluencer(row, headerIndex, index))
    .filter((record) => record !== null);
}

function createInfluencer(row, headerIndex, index) {
  const get = (label) => {
    const idx = headerIndex.get(normalizeHeader(label));
    return normalizeValue(idx === undefined ? '' : row[idx] ?? '');
  };

  const name = get('Name');
  const profileIdRaw = get('Profile ID');
  const profileUrl = get('Profile URL');
  const gender = get('Gender');
  const followers = get('Followers');
  const category = get('Category');
  const avgPlays = get('Avg. Plays');
  const impressions = get('Impressions');
  const areaOrCity = get('Area/City');
  const influencerType = get('Influencer Type');
  const response = get('Response');
  const cost = get('Cost');
  const phone = get('Phone');
  const email = get('Email');
  const notes = get('Notes');
  const source = get('Source');

  if (![name, profileIdRaw, profileUrl].some(Boolean)) {
    return null;
  }

  const handleCore = buildInstagramHandle(profileIdRaw, profileUrl);
  const handle = handleCore ? `@${handleCore}` : '';
  const id = buildIdentifier(handleCore, profileUrl, name, index);
  const categories = splitTags(category);
  const primaryCategory = categories[0] ?? category;
  const sourceTags = splitTags(source);
  const avatarUrl = buildAvatarUrl(profileUrl, handleCore);

  return {
    id,
    name: name || (handle ? handle.slice(1) : 'Unnamed Creator'),
    handle,
    profileId: profileIdRaw || (handleCore ?? ''),
    profileUrl,
    gender,
    followers,
    category,
    categories,
    primaryCategory,
    avgPlays,
    impressions,
    areaOrCity,
    influencerType,
    response,
    cost,
    phone,
    email,
    notes,
    source,
    sourceTags,
    avatarUrl,
  };
}

function main() {
  const csv = fs.readFileSync(CSV_URL, 'utf8');
  const rows = parseCsv(csv);
  const records = buildInfluencerRecords(rows);

  console.error(`raw rows: ${rows.length}`);
  const total = records.length;
  const missingAvatar = records.filter((record) => record.avatarUrl === DEFAULT_AVATAR).length;
  const avatarFromHandle = records.filter((record) => record.avatarUrl.startsWith('https://unavatar.io/instagram/')).length;
  const avatarFromUrl = records.filter((record) => record.avatarUrl.startsWith('https://unavatar.io/http')).length;
  const missingCategories = records.filter((record) => record.categories.length === 0 && !record.primaryCategory).length;
  const missingNicheLabel = records.filter((record) => !record.primaryCategory).length;

  const duplicates = new Map();
  records.forEach((record) => {
    duplicates.set(record.id, (duplicates.get(record.id) || 0) + 1);
  });
  const duplicateCount = Array.from(duplicates.values()).filter((count) => count > 1).length;

  const categoryCounts = new Map();
  records.forEach((record) => {
    const label = record.primaryCategory || 'Uncategorized';
    categoryCounts.set(label, (categoryCounts.get(label) || 0) + 1);
  });

  const topCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log(JSON.stringify({
    total,
    missingAvatar,
    avatarFromHandle,
    avatarFromUrl,
    missingCategories,
    missingNicheLabel,
    duplicateCount,
    categoryCount: categoryCounts.size,
    topCategories,
  }, null, 2));
}

main();
