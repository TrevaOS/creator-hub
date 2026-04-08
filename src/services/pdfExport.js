import jsPDF from 'jspdf';

const CANE = [201, 169, 110];
const BLACK = [17, 17, 17];
const WHITE = [255, 255, 255];
const GREY = [158, 158, 158];

function addFooter(doc, username, pageNum, totalPages) {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  doc.setFillColor(...CANE);
  doc.rect(0, pageHeight - 16, pageWidth, 16, 'F');

  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('CreatorHub', 10, pageHeight - 5);
  doc.text(`ourcreatorhub.com/${username || 'creator'}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
  doc.text(`${pageNum} / ${totalPages}`, pageWidth - 10, pageHeight - 5, { align: 'right' });
}

export async function generateMediaKit(profile, analytics, carouselImages, collabBrands) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageWidth = doc.internal.pageSize.width;
  const totalPages = 4;

  // ===== PAGE 1: Profile =====
  // Header bar
  doc.setFillColor(...CANE);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Name
  doc.setTextColor(...WHITE);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(profile?.name || 'Creator', 20, 28);

  // Tagline
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(profile?.tagline || '', 20, 40);

  // Location
  if (profile?.location) {
    doc.setFontSize(10);
    doc.text(`📍 ${profile.location}`, 20, 65);
  }

  // Bio
  doc.setTextColor(...BLACK);
  doc.setFontSize(11);
  const bioLines = doc.splitTextToSize(profile?.bio || '', pageWidth - 40);
  doc.text(bioLines, 20, 80);

  // Niche Tags
  if (profile?.niche_tags?.length) {
    doc.setFontSize(9);
    doc.setTextColor(...CANE);
    doc.setFont('helvetica', 'bold');
    doc.text('NICHES', 20, 115);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BLACK);

    let xPos = 20;
    profile.niche_tags.forEach(tag => {
      const tagWidth = doc.getTextWidth(tag) + 10;
      doc.setFillColor(...CANE);
      doc.roundedRect(xPos, 120, tagWidth, 8, 2, 2, 'F');
      doc.setTextColor(...WHITE);
      doc.setFontSize(8);
      doc.text(tag, xPos + 5, 126);
      xPos += tagWidth + 5;
    });
  }

  // Profile URL
  doc.setTextColor(...GREY);
  doc.setFontSize(10);
  doc.text(`ourcreatorhub.com/${profile?.username || 'creator'}`, 20, 150);

  addFooter(doc, profile?.username, 1, totalPages);

  // ===== PAGE 2: Stats =====
  doc.addPage();

  doc.setFillColor(...CANE);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Social Media Stats', 20, 14);

  const stats = analytics || {
    instagram: { followers: '12.5K', engagement: '4.2%', reach: '45K' },
    youtube: { subscribers: '8.2K', views: '120K', watchTime: '3.2K hrs' },
  };

  let yPos = 35;
  const platforms = Object.entries(stats);
  platforms.forEach(([platform, data]) => {
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(15, yPos, pageWidth - 30, 45, 4, 4, 'F');

    doc.setTextColor(...BLACK);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(platform.charAt(0).toUpperCase() + platform.slice(1), 22, yPos + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let xStat = 22;
    Object.entries(data).forEach(([key, val]) => {
      doc.setTextColor(...GREY);
      doc.text(key.toUpperCase(), xStat, yPos + 24);
      doc.setTextColor(...BLACK);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(String(val), xStat, yPos + 35);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      xStat += 50;
    });

    yPos += 55;
  });

  addFooter(doc, profile?.username, 2, totalPages);

  // ===== PAGE 3: Featured Work =====
  doc.addPage();

  doc.setFillColor(...CANE);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Featured Work', 20, 14);

  if (carouselImages?.length) {
    doc.setTextColor(...BLACK);
    doc.setFontSize(10);
    doc.text(`${carouselImages.length} featured pieces`, 20, 32);

    // Placeholder grid for images
    let imgX = 15;
    let imgY = 40;
    carouselImages.slice(0, 6).forEach((img, i) => {
      if (i > 0 && i % 3 === 0) {
        imgX = 15;
        imgY += 75;
      }
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(imgX, imgY, 55, 65, 4, 4, 'F');
      doc.setTextColor(...GREY);
      doc.setFontSize(8);
      doc.text(`Image ${i + 1}`, imgX + 15, imgY + 35);
      imgX += 60;
    });
  } else {
    doc.setTextColor(...GREY);
    doc.setFontSize(12);
    doc.text('No featured work added yet', 20, 50);
  }

  addFooter(doc, profile?.username, 3, totalPages);

  // ===== PAGE 4: Collaborations =====
  doc.addPage();

  doc.setFillColor(...CANE);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Past Collaborations', 20, 14);

  if (collabBrands?.length) {
    let colY = 35;
    collabBrands.forEach((brand, i) => {
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(15, colY, pageWidth - 30, 20, 4, 4, 'F');
      doc.setTextColor(...BLACK);
      doc.setFontSize(12);
      doc.text(brand.brand_name, 25, colY + 13);
      colY += 26;
    });
  } else {
    doc.setTextColor(...GREY);
    doc.setFontSize(12);
    doc.text('No collaborations listed yet', 20, 50);
  }

  addFooter(doc, profile?.username, 4, totalPages);

  // Save
  const filename = `${profile?.username || 'creator'}_MediaKit.pdf`;
  doc.save(filename);
}

export async function generateAnalyticsReport(profile, analytics, dateRange = 'Last 30 days') {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageWidth = doc.internal.pageSize.width;

  // Header
  doc.setFillColor(...CANE);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Analytics Report', 20, 17);

  // Meta
  doc.setFontSize(10);
  doc.text(dateRange, pageWidth - 20, 17, { align: 'right' });

  // Creator info
  doc.setTextColor(...BLACK);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(profile?.name || 'Creator', 20, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  if (profile?.niche_tags?.length) {
    doc.text(profile.niche_tags.join(' · '), 20, 48);
  }

  // Stats grid
  const mockStats = [
    { label: 'Total Reach', value: '125K', delta: '+12%' },
    { label: 'Impressions', value: '340K', delta: '+8%' },
    { label: 'Engagement Rate', value: '4.2%', delta: '+0.5%' },
    { label: 'New Followers', value: '2.1K', delta: '+23%' },
    { label: 'Total Likes', value: '18.5K', delta: '+15%' },
    { label: 'Comments', value: '1.2K', delta: '+7%' },
  ];

  let xPos = 15;
  let yPos = 60;
  mockStats.forEach((stat, i) => {
    if (i > 0 && i % 3 === 0) {
      xPos = 15;
      yPos += 45;
    }
    const cardWidth = (pageWidth - 35) / 3;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(xPos, yPos, cardWidth, 38, 4, 4, 'F');

    doc.setTextColor(...GREY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(stat.label, xPos + 5, yPos + 10);

    doc.setTextColor(...BLACK);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.value, xPos + 5, yPos + 24);

    doc.setTextColor(...CANE);
    doc.setFontSize(9);
    doc.text(stat.delta, xPos + 5, yPos + 34);

    xPos += cardWidth + 5;
  });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(...CANE);
  doc.rect(0, pageHeight - 16, pageWidth, 16, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.text('CreatorHub Analytics', 10, pageHeight - 5);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 5, { align: 'center' });

  doc.save(`${profile?.username || 'creator'}_Analytics.pdf`);
}
