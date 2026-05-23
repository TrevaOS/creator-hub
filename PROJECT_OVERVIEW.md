# Creator Dock — Project Overview

> **One file to understand the entire product.**

---

## 1. What Is This?

**Creator Dock** is a dual-sided React web application that connects **restaurants / venues** with **content creators** (food bloggers, Instagram influencers, etc.) for marketing collaborations.

It is a **Marketing OS** — a single tool where a venue can:
- Discover creators nearby
- Receive and manage collaboration pitches
- Track campaigns from pitch → visit → posted content
- Book tables for collabs directly inside the same system

And where a creator can:
- Browse nearby brands with collab offers
- Pitch (swipe right) or pass (swipe left)
- Track pitch status and messages
- Manage their profile and social stats

---

## 2. Dual-App Architecture

The codebase contains **two apps** running inside one React bundle:

| App | Audience | URL Path | Layout |
|-----|----------|----------|--------|
| **Brand Dashboard** | Restaurant owners / managers | `/` (root) | Desktop sidebar nav |
| **Creator Hub** | Content creators | `/creatorhub/*` | Mobile phone mockup (max-width 390px) |

```
App.tsx
├── /creatorhub/*          → CreatorHubApp (mobile)
│     ├── /creatorhub/home     → Swipeable brand cards
│     ├── /creatorhub/inbox    → Pitch status + messages
│     └── /creatorhub/profile  → Profile + Instagram sync
│
└── /                      → Layout (desktop sidebar)
      ├── /dashboard         → Stats, activity, quick actions
      ├── /floor             → Table + reservation management
      ├── /marketing
      │     ├── /inbound     → Review incoming creator pitches
      │     ├── /discover    → Find + invite creators
      │     └── /campaigns   → Track collab lifecycle
      └── /settings          → Venue profile, billing, team
```

---

## 3. Brand Dashboard (Restaurant Side)

### 3.1 Dashboard (`/dashboard`)
- **Stats cards**: Active campaigns, new pitches, total reach, avg engagement
- **Quick actions**: Review pitches, discover creators, manage campaigns, view floor
- **Activity feed**: Recent creator actions (pitched, accepted, content draft, posted)
- **Top creators**: Ranked list with follower count, engagement rate, and match score

### 3.2 Floor & Live (`/floor`)
- **Table grid**: Visual floor plan showing table status (available, occupied, reserved, collab)
- **Collab tables**: Special tables tagged with creator name + "Marketing: Barter"
- **Waitlist**: Walk-ins and collab guests waiting for tables
- **Actions**: Seat walk-ins, view reservations, manage collab seating

### 3.3 Inbound Matches (`/marketing/inbound`)
- **Purpose**: Review pitches sent by creators who want to collab with your venue
- **Three views**:
  - **Ranked**: AI-scored list (audience overlap, engagement, niche fit)
  - **Kanban**: Drag cards across stages — New → Reviewing → Accepted → Active
  - **Grid**: Card grid for quick scanning
- **Actions**: Accept, decline, or dismiss a pitch
- **Badges**: "Super" badge for top-tier creators

### 3.4 Outbound Discovery (`/marketing/discover`)
- **Purpose**: Proactively find and invite creators
- **Three views**:
  - **Grid**: Creator cards with photo, followers, engagement, niche, distance
  - **Map**: Map with creator pins around your location
  - **Lists**: Saved lists (e.g., "Anniversary Push", "Sunday Brunch")
- **Filters**: Distance radius, niche (Food / Lifestyle / Travel), search by name
- **Actions**: Invite creators directly; status updates to "Pending invite", "Accepted", "Declined"

### 3.5 Campaign Manager (`/marketing/campaigns`)
- **Purpose**: Track every collab from start to finish
- **Lifecycle stages**:
  1. **Awaiting Visit** — pitch accepted, needs table booking
  2. **Booked** — reservation confirmed
  3. **Content Pending** — creator visited, waiting for draft
  4. **Done** — content posted, reach reported
- **Timeline view**: Step-by-step progress for each campaign
- **Actions**: Book table from campaign, export report, view content

### 3.6 Settings (`/settings`)
- **Profile**: Venue name, location, contact info, logo upload
- **Notifications**: Toggle alerts for new pitches, acceptances, booking reminders, content due, weekly reports
- **Billing**: Plan details, pitch credit usage, invoices
- **Team**: Members (Owner, Manager, Staff) with roles
- **Integrations**: Instagram connect, calendar sync, webhooks
- **Security**: Password, 2FA, active sessions

---

## 4. Creator Hub (Creator Side)

Rendered inside a **mobile phone mockup** (max-width 390px, centered on screen) to simulate a native app experience.

### 4.1 Home (`/creatorhub/home`)
- **Swipeable brand cards**: Tinder-style card stack
  - **Pass** (swipe left / X) — skip the brand
  - **Pitch** (swipe right / heart) — send collaboration request
- **Card info**: Brand name, location, rating, offer (e.g., "Free Meal + ₹5,000"), deliverables (1 Reel, 2 Stories), audience fit score (A+ to B+), brief description
- **Detail view**: Tap to expand full brief and requirements
- **Map view**: Toggle to see brands plotted on a map

### 4.2 Inbox (`/creatorhub/inbox`)
- **Messages & updates**: Pitch accepted, table booked, content reminder
- **Status tracking**: See where each pitch stands

### 4.3 Profile (`/creatorhub/profile`)
- **Creator info**: Name, handle, bio, niche
- **Social sync**: Connect Instagram (auto-pulls follower count, verified badge)
- **Stats**: Followers, engagement rate, total collaborations
- **Edit profile**: Update details, change niche, set preferences

---

## 5. Key Domain Concepts

| Term | Meaning |
|------|---------|
| **Pitch** | A creator sends a request to collaborate with a venue |
| **Barter** | Free meal / experience in exchange for content (no cash) |
| **Pitch Credit** | Quota of pitches a creator can send (deducted on each pitch) |
| **Audience Fit Score** | Algorithmic score (0–100) matching creator's audience to venue's target |
| **Collab Table** | A restaurant table reserved specifically for a creator visit |
| **Deliverables** | Content the creator must produce (e.g., 1 Reel + 2 Stories) |
| **Super Badge** | Top-tier creator badge shown on their profile |

---

## 6. Design System

- **Framework**: React 18 + Vite + Tailwind CSS v4 + TypeScript
- **Router**: `react-router` v7 (HashRouter)
- **Icons**: `lucide-react`
- **UI Primitives**: shadcn/ui components (installed via Radix UI primitives)
- **Animations**: `motion` (Framer Motion)
- **Charts**: `recharts`
- **Map**: `maplibre-gl`

### Color Language
| Color | Role |
|-------|------|
| **Orange** | Primary CTA / brand action |
| **Cyan** | Marketing / collab / pitch actions |
| **Green** | Success / match / available |
| **Blue** | Secondary / external action / reserved |
| **Red** | Destructive / pass / declined |
| **Amber** | Pending / content due / warning |
| **Violet** | Campaigns / reach stats |

---

## 7. Folder Structure

```
creatordockweb/
├── index.html                  # Entry point → /src/main.tsx
├── src/
│   ├── main.tsx                # React root render
│   ├── styles/
│   │   └── index.css           # Tailwind + global styles
│   ├── app/
│   │   ├── App.tsx             # Root router ( HashRouter )
│   │   ├── components/
│   │   │   └── Layout.tsx      # Sidebar navigation shell
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── FloorLive.tsx
│   │   │   ├── InboundMatches.tsx
│   │   │   ├── OutboundDiscovery.tsx
│   │   │   ├── CampaignManager.tsx
│   │   │   └── Settings.tsx
│   │   └── creatorhub/
│   │       ├── CreatorHubApp.tsx      # Mobile shell + bottom nav
│   │       ├── pages/
│   │       │   ├── CreatorHome.tsx
│   │       │   ├── CreatorInbox.tsx
│   │       │   └── CreatorProfile.tsx
│   │       └── components/
│   │           └── MapView.tsx
│   └── imports/                # Design spec files (not runtime)
│       ├── screen-states.js    # Button lifecycle matrix
│       └── ... (wireframe exports)
├── guidelines/
│   └── Guidelines.md           # AI assistant rules
└── README.md                   # Setup instructions
```

---

## 8. How to Run

```bash
npm i          # install dependencies
npm run dev    # start Vite dev server
npm run build  # production build → dist/
```

---

## 9. Attribution

- UI components from **shadcn/ui** (MIT)
- Photos from **Unsplash**
- Originally designed in **Figma**
