# Creator Hub CRM - Full Walkthrough

## 1) Product Purpose
Creator Hub CRM is a multi-role marketplace platform that connects:
- Creators (influencers)
- Brands (companies)
- Admin (platform operator)

The platform acts as an intermediary system for:
- Profile and portfolio discovery
- Deal publishing and applications
- Negotiation and communication
- Assignment and lifecycle tracking
- Support and operations monitoring

This is not a generic CRM. It is a role-based influencer-brand deal network with marketplace + chat + admin orchestration.

## 2) User Roles and Responsibilities

### Admin
- Full operational visibility
- Manages creators, brands, deals, support
- Monitors analytics counters (data-driven)
- Manages chats and support flows
- Can create accounts/deals
- Should not view raw passwords (only create/reset flow)

### Creator (Influencer)
- Builds portfolio and public profile
- Connects social platforms (OAuth token storage)
- Curates featured work/gallery
- Browses marketplace deals
- Applies/accepts deals
- Chats and negotiates

### Brand
- Maintains brand profile
- Posts deals and requirements
- Reviews creator applications
- Communicates with creators
- Selects one creator for assignment

## 3) Core Marketplace Flow
1. Brand creates a deal.
2. Deal appears in creator-side deal feed.
3. Multiple creators can apply/accept.
4. Chat negotiation occurs.
5. Brand assigns one creator.
6. Deal progresses through lifecycle states.

## 4) Current Architecture (Frontend)

### App shell and routing
- Entry: `src/main.jsx`
- Routes and guards: `src/App.jsx`
- Uses React Router with protected routes and admin route guard.

### Core stores/contexts
- `AuthContext`: auth session, profile mapping, sign in/up/out, role awareness
- `ThemeContext`: light/dark + accent theme
- `ProfileContext`: creator profile-linked module state

### Screens
- `Auth`: login/signup
- `Dashboard`: creator portfolio + cards + stats + featured work
- `Deals`: marketplace listing and accepted deal tabs
- `DealDetail`: full deal view + accept/apply entry
- `DealChat`: conversation tied to deal
- `Search`: discovery image/user view
- `Setup`: profile management, social links, modules, support
- `AdminDashboard`: admin control desk (creators, brands, deals, support, chat)

## 5) Data Layer (Supabase)

### Primary used tables
- `creator_profiles`
- `creator_social_accounts`
- `creator_dashboard_modules`
- `creator_carousel_images`
- `creator_collab_brands`
- `creator_hub_deals`
- `creator_hub_accepted_deals`
- `creator_hub_messages` (legacy deal chat)
- `support_tickets`
- `ticket_messages`
- `org_users`
- `organizations`

### New migration-introduced tables
- `brand_profiles`
- `creator_hub_conversations`
- `creator_hub_conversation_messages`

### Migration file
- `supabase/creator_hub_crm_migration.sql`

This migration also:
- Extends `org_users.role_type` for `creator` and `brand`
- Adds deal assignment/lifecycle fields
- Adds unique constraints and indexes
- Adds triggers and baseline RLS
- Backfills unified conversation data from legacy deal messages

## 6) Interlinking (How modules connect)

### Auth <-> Profile <-> Role
- User authenticates via Supabase Auth (`auth.users`)
- Profile data comes from `creator_profiles` and/or `org_users`
- Route access and admin capabilities depend on role mapping (`role_type`)

### Creator profile <-> Dashboard
- Setup writes profile/modules/social/gallery data
- Dashboard reads these tables and renders user portfolio cards

### Deals <-> Applications <-> Chat
- Deals screen reads `creator_hub_deals`
- Creator apply/accept writes to `creator_hub_accepted_deals`
- Chat currently works through deal-linked message flows; system is migrating to unified conversation tables

### Admin <-> Ops
- Admin dashboard aggregates creators, brands, deals, support, chat
- Creates/updates records via Supabase writes
- Monitoring cards and pipeline views are expected to be data-driven

### Support
- Creators submit support ticket from Setup
- Tickets stored in `support_tickets`, threaded in `ticket_messages`
- Admin replies through support inbox workflows

## 7) What Was Cleaned/Improved
- Local fake fallback removed from key discovery/deal/detail flows.
- Role access improved to use profile role data rather than email-only checks.
- Supabase-only expectation strengthened in support submission path.
- SQL migration added for scalable role-brand-conversation architecture.

## 8) What still needs completion for fully unified architecture
- Complete UI migration of all chat panels to `creator_hub_conversations` + `creator_hub_conversation_messages`
- Normalize admin metrics to pure backend aggregation (no local state assumptions)
- Fully retire `src/services/adminStore.js` usage in all remaining code paths
- Add explicit brand-facing screen workflows for posting and assigning deals (if separate brand UI is needed)
- Harden RLS policies table-by-table for strict tenant isolation and role-permission rules

## 9) Engineering Principles for Agents
When modifying this app:
- Use Supabase as single source of truth.
- Avoid local fallback storage for business data.
- Keep role separation explicit in route guards and data writes.
- Preserve existing UI layout unless behavior requires change.
- Favor modular services/hooks for table operations.
- Keep migration scripts idempotent and reversible where possible.

## 10) Quick File Map for New Agents
- Routing/guards: `src/App.jsx`
- Auth and role logic: `src/store/AuthContext.jsx`
- Supabase utilities: `src/services/supabase.js`
- Admin operations: `src/screens/AdminDashboard/AdminDashboard.jsx`
- Creator setup: `src/screens/Setup/Setup.jsx`
- Deals flow: `src/screens/Deals/Deals.jsx`, `DealDetail.jsx`, `DealChat.jsx`
- Discovery: `src/screens/Search/Search.jsx`
- Migration SQL: `supabase/creator_hub_crm_migration.sql`

## 11) Summary Understanding
Creator Hub CRM is a role-driven marketplace CRM where:
- Admin operates and governs the system
- Brands create opportunities
- Creators discover and convert those opportunities
- Chat + support + assignment close the loop

The platform’s value is in trusted intermediation, structured workflow, and measurable operational visibility across the creator-brand lifecycle.
