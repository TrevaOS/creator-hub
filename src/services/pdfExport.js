import jsPDF from 'jspdf';

const ACCENT = [29, 78, 216];
const TEXT = [15, 23, 42];
const MUTED = [100, 116, 139];
const CARD = [248, 250, 252];
const WHITE = [255, 255, 255];

function addHeader(doc, title) {
  const width = doc.internal.pageSize.width;
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, width, 26, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 16);
}

function addFooter(doc, username, page, total) {
  const pageHeight = doc.internal.pageSize.height;
  const width = doc.internal.pageSize.width;
  doc.setTextColor(...MUTED);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`creatorhub.treva.in/${username || 'creator'}`, 14, pageHeight - 8);
  doc.text(`${page}/${total}`, width - 14, pageHeight - 8, { align: 'right' });
}

async function imageToDataUrl(url) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function formatMetric(value) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

export async function generateMediaKit(profile, analytics, carouselImages, collabBrands) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const width = doc.internal.pageSize.width;
  const totalPages = 2;
  const avatarData = await imageToDataUrl(profile?.avatar_url);

  addHeader(doc, 'Media Kit');

  if (avatarData) {
    doc.addImage(avatarData, 'JPEG', 14, 34, 34, 34);
  } else {
    doc.setFillColor(226, 232, 240);
    doc.circle(31, 51, 17, 'F');
  }

  doc.setTextColor(...TEXT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(profile?.name || 'Creator', 54, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  doc.text(`@${profile?.username || 'creator'}`, 54, 52);
  doc.text(profile?.location || 'Location not set', 54, 58);

  const bioText = profile?.bio || profile?.tagline || 'Professional creator profile for brand collaborations.';
  doc.setTextColor(...TEXT);
  doc.setFontSize(11);
  const bioLines = doc.splitTextToSize(bioText, width - 28);
  doc.text(bioLines, 14, 80);

  const cards = [
    { label: 'Followers', value: analytics?.followers || profile?.follower_count || '-' },
    { label: 'Engagement', value: analytics?.engagement || '-' },
    { label: 'Reach', value: analytics?.reach || '-' },
    { label: 'Top Platform', value: analytics?.topPlatform || '-' },
  ];

  let y = 104;
  cards.forEach((card, i) => {
    const x = 14 + (i % 2) * ((width - 38) / 2 + 10);
    if (i > 0 && i % 2 === 0) y += 30;
    doc.setFillColor(...CARD);
    doc.roundedRect(x, y, (width - 38) / 2, 24, 3, 3, 'F');
    doc.setTextColor(...MUTED);
    doc.setFontSize(9);
    doc.text(card.label, x + 4, y + 8);
    doc.setTextColor(...TEXT);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(formatMetric(card.value), x + 4, y + 18);
  });

  addFooter(doc, profile?.username, 1, totalPages);

  doc.addPage();
  addHeader(doc, 'Work Highlights');

  doc.setTextColor(...TEXT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Featured Work', 14, 36);

  const featured = (carouselImages || []).slice(0, 4);
  if (featured.length === 0) {
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.text('No featured work uploaded yet.', 14, 44);
  } else {
    let imageY = 42;
    for (let i = 0; i < featured.length; i += 1) {
      const imageData = await imageToDataUrl(featured[i]?.image_url);
      const x = 14 + (i % 2) * 92;
      if (i > 0 && i % 2 === 0) imageY += 56;
      if (imageData) {
        doc.addImage(imageData, 'JPEG', x, imageY, 86, 48);
      } else {
        doc.setFillColor(226, 232, 240);
        doc.rect(x, imageY, 86, 48, 'F');
      }
    }
  }

  const brands = (collabBrands || []).slice(0, 6);
  const brandsY = featured.length > 2 ? 160 : 128;
  doc.setTextColor(...TEXT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Past Collaborations', 14, brandsY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  if (brands.length === 0) {
    doc.text('No brand collaborations listed yet.', 14, brandsY + 8);
  } else {
    brands.forEach((brand, index) => {
      doc.text(`- ${brand.brand_name || brand.name || 'Brand'}`, 14, brandsY + 8 + index * 6);
    });
  }

  addFooter(doc, profile?.username, 2, totalPages);
  doc.save(`${profile?.username || 'creator'}_MediaKit.pdf`);
}

export async function generateAnalyticsReport(profile, analytics, dateRange = 'Last 30 days') {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const width = doc.internal.pageSize.width;
  addHeader(doc, 'Analytics Report');
  doc.setTextColor(...MUTED);
  doc.setFontSize(10);
  doc.text(dateRange, width - 14, 16, { align: 'right' });
  doc.setTextColor(...TEXT);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(profile?.name || 'Creator', 14, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const metrics = Object.entries(analytics || {});
  metrics.forEach(([key, value], idx) => {
    doc.text(`${key}: ${formatMetric(value)}`, 14, 52 + idx * 8);
  });
  addFooter(doc, profile?.username, 1, 1);
  doc.save(`${profile?.username || 'creator'}_Analytics.pdf`);
}
