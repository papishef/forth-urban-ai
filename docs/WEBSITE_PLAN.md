# Forth Urban Marketing Website & Public Layer Architecture

This document serves as the master blueprint and reference for the customer-facing marketing website of Forth Urban Limited. It sits directly on top of the existing AI Property Consultation Engine without modifying or disrupting the underlying business logic, decision algorithms, or authenticated consultation funnels.

---

## 1. Executive Summary & Objective

- **Purpose**: Transform the application into an enterprise-grade, customer-centric real estate web platform that drives user acquisition and leads directly into the AI consultation engine.
- **Conversion Alignment**: 90%+ of primary and secondary Calls-to-Action (CTAs) across the website resolve into the existing AI Property Advisor engine (Readiness Quiz, Matched Properties, Calculators, Site Inspection Booking) using role- and auth-aware routing.
- **Visual Aesthetic**: Futuristic **Liquid Glass UI** utilizing layered backdrop filters (`backdrop-blur-xl`, `saturate-180`), subtle white glass borders (`border-white/60`), glossy dynamic hover sheens (`.liquid-glass-sheen`), and ambient color orbs.
- **Device Support**: 100% responsive across mobile (375px+), tablet, and widescreen desktop displays with frictionless Framer Motion animations.

---

## 2. Information Architecture & Page Breakdown

```
                    ┌───────────────────────────────┐
                    │       MarketingLayout         │
                    │   (Header + Nav + Footer)     │
                    └───────────────┬───────────────┘
                                    │
    ┌────────────────┬──────────────┼───────────────┬──────────────┐
    ▼                ▼              ▼               ▼              ▼
┌──────────┐  ┌────────────┐  ┌───────────┐  ┌────────────┐  ┌──────────┐
│ HomePage │  │ServicesPage│  │ContactPage│  │BlogListPage│  │Legal/Auth│
└────┬─────┘  └──────┬─────┘  └─────┬─────┘  └─────┬──────┘  └────┬─────┘
     │               │              │              │              │
     └───────────────┴──────────────┼──────────────┴──────────────┘
                                    ▼
                 ┌──────────────────────────────────────┐
                 │    resolveEngineCta() Router Gate    │
                 └──────────────────┬───────────────────┘
                                    │
      ┌─────────────────────────────┼─────────────────────────────┐
      ▼                             ▼                             ▼
[Unauthenticated]           [Client / User]               [Staff / Admin]
  ↳ /quiz/home-readiness       ↳ /quiz/home-readiness       ↳ /admin/inspections
  ↳ /register?next=result      ↳ /properties/recommended    ↳ /admin/properties
  ↳ /login                     ↳ /dashboard                 ↳ /admin/crm
                               ↳ /inspections/book
```

### 2.1 The Landing / Home Page (`/`)
- **Hero Section**:
  - Inherits the premium dark gradient aesthetic (`from-[#181818] via-[#2c1d17] to-[#5C4033]`) with animated ambient golden orbs (`#d4af37`).
  - Core Headline: *"Own Real Estate That Grows in Value"*.
  - Subheadline emphasizing verified serviced plots in Guzape II & Kuje with genuine FCDA R-of-O titles.
  - Dual CTAs: Primary gold glass button to Take AI Readiness Quiz (`/quiz/home-readiness`), Secondary button to Explore Services.
- **Trust Metrics Grid**: 100% Genuine Titles (FCDA verified), 3+ Active Estate Developments, Flexible Financing Plans, Proven Capital Growth.
- **Interactive 4-Step Consultation Journey**:
  1. *AI Readiness Quiz* (Algorithmic scoring)
  2. *Area & Land Matching* (Matched Abuja estates)
  3. *Transparent Calculators* (Installments, hidden costs, 5-year ROI)
  4. *Site Inspection Booking* (Guided physical or virtual tours)
- **Services Teaser**: Highlights Land Sales, Title Verification, and Financing with direct engine CTAs.
- **Estate Portfolio Highlight**: Interactive glass showcase of Guzape II and Kuje active developments.
- **Latest Insights**: Live feed of latest 3 published blog posts.
- **Conversion CTA Banner**: High-impact closing banner driving quiz completions.

### 2.2 The Services Page (`/services`)
Showcases Forth Urban's 6 core service capabilities (matching official company offerings):
1. **Land Sales & Acquisition** &rarr; CTA leads to `/properties/recommended`
2. **Legal Documentation & Due Diligence** &rarr; CTA leads to `/inspections/book`
3. **Flexible Financing & Installment Plans** &rarr; CTA leads to `/dashboard` (Calculators)
4. **Property & Residential Estate Development** &rarr; CTA leads to `/properties/recommended`
5. **AI Real Estate Advisory & Consultation** &rarr; CTA leads to `/quiz/home-readiness`
6. **Property Valuation & ROI Analytics** &rarr; CTA leads to `/dashboard` (ROI Calculator)

### 2.3 The Contact Page (`/contact`)
- **Direct Channels**: Phone/WhatsApp (`+234 911 165 8936`), Email (`info@forthurban.com`), Office (`19 Ali Baba Cres, Jabi, Abuja 900108`), Working hours.
- **Inquiry Form**: Name, Email, Phone, Reason dropdown, Message, Bot Honeypot field (`companyWebsite`), and Zod validation. Submissions notify administrators via Resend and trigger automated client acknowledgments.
- **Interactive FAQ Accordion**: Smooth Framer Motion animated accordion answering key questions:
  - Title documents received (FCDA R-of-O, C-of-O, Deed of Assignment, Survey Plan)
  - Payment plan durations (6–12 months)
  - Physical vs virtual site inspections
  - Location appreciation metrics in Guzape II & Kuje
  - Step-by-step land purchasing procedure
  - Immediate construction readiness

### 2.4 The Blog & Knowledge Hub (`/blog` & `/blog/:slug`)
- **Public Feed**: Filterable by category (*Market Insights*, *Investment Guides*, *Legal & Due Diligence*, *Company News*, *Area Spotlights*) with cover photo cards, excerpts, and date metadata.
- **Post Reader**: Markdown article rendering (headers, blockquotes, lists, images, links), author signature, social share link copy, and embedded AI engine CTA widgets.
- **Admin Authoring (`/admin/blog`)**: Markdown editor with live preview, Cloudinary cover photo upload, draft/publish statuses, and an automated dispatch toggle to broadcast the post via email to all confirmed newsletter subscribers.

### 2.5 Header & Footer Components
- **MarketingHeader**: Sticky Liquid Glass navbar with responsive hamburger slide-down, company Logo (`/FU-Logo.webp`), navigation links, and dynamic CTA button resolving into client login, signup, or staff dashboard.
- **MarketingFooter**: 5-column layout with company mission, direct contact coordinates, internal navigation, service links, copyright, legal links, and a **Double Opt-In Newsletter Signup Form** with bot honeypot protection.

---

## 3. CTA Resolution Engine (`apps/client/src/lib/engine-cta.ts`)

To guarantee 90%+ conversion without hardcoding rigid routes, every CTA button uses the unified `resolveEngineCta()` helper:

```typescript
export function resolveEngineCta(
  user: UserDTO | null,
  isAuthenticated: boolean,
  intent: EngineCtaIntent = "start"
): { to: string; label: string; isEngineRoute: boolean };
```

| User State | Requested Intent | Route Target | Button Label |
| :--- | :--- | :--- | :--- |
| **Unauthenticated** | `quiz` / `start` | `/quiz/home-readiness` | "Take AI Readiness Quiz" |
| **Unauthenticated** | `properties` | `/register` | "View Matched Properties" |
| **Unauthenticated** | `book-inspection`| `/register` | "Book Site Inspection" |
| **Unauthenticated** | `dashboard` | `/login` | "Client Login" |
| **User (Logged In)** | `quiz` | `/quiz/home-readiness`| "Continue AI Readiness Quiz" |
| **User (Logged In)** | `properties` | `/properties/recommended` | "View Matched Land" |
| **User (Logged In)** | `calculators` | `/dashboard` | "Open Financial Calculators" |
| **User (Logged In)** | `book-inspection`| `/inspections/book` | "Book Site Inspection" |
| **User (Logged In)** | `dashboard` / `start` | `/dashboard` | "Go to Dashboard" |
| **Owner or granted sub-admin** | Any general intent | First readable `/admin/*` menu | "Admin Dashboard" or the owner's custom sub-admin title |
| **Admin** | `properties` | `/admin/properties` | "Manage Properties" |

---

## 4. Backend Modules & API Endpoints

### 4.1 Contact Module (`/api/contact`)
- `POST /api/contact`: Public submission (rate-limited, bot honeypot validation). Saves message to MongoDB, emails admin, and sends confirmation to the user.
- `GET /api/admin/contact-messages`: Admin/Sales inbox with status filters (`new`, `read`, `archived`).
- `PATCH /api/admin/contact-messages/:id`: Updates message triage status.

### 4.2 Newsletter Module (`/api/newsletter`)
- `POST /api/newsletter/subscribe`: Double opt-in registration. Creates subscriber with `status: pending` and dispatches confirmation email via Resend.
- `GET /api/newsletter/confirm/:token`: Validates token and transitions status to `confirmed`.
- `GET /api/newsletter/unsubscribe/:token`: One-click unsubscription.
- `GET /api/admin/newsletter`: Admin dashboard tracking subscriber counts (Confirmed, Pending, Unsubscribed).

### 4.3 Blog Module (`/api/blog`)
- `GET /api/blog`: Paginated public list of published articles.
- `GET /api/blog/:slug`: Public article fetch by SEO slug.
- `GET /api/admin/blog`: Admin list of all drafts and published posts.
- `POST /api/admin/blog`: Admin creation with auto-slugification.
- `PATCH /api/admin/blog/:id`: Admin updates.
- `DELETE /api/admin/blog/:id`: Soft delete (`deletedAt` timestamp).
- `POST /api/admin/blog/:id/media`: Cloudinary cover photo upload.
- `POST /api/admin/blog/:id/publish`: Publishes article with optional `sendNewsletter: true` flag to broadcast campaign emails to all confirmed subscribers.

---

## 5. Liquid Glass Design System (`apps/client/src/index.css`)

```css
.liquid-glass {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow: 0 8px 32px 0 rgba(92, 64, 51, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9);
}

.liquid-glass-dark {
  background: rgba(24, 24, 24, 0.65);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.35), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2);
}

.liquid-glass-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.25) 100%);
  backdrop-filter: blur(16px) saturate(170%);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 10px 30px -5px rgba(92, 64, 51, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.9);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.liquid-glass-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -10px rgba(92, 64, 51, 0.14), inset 0 1px 2px rgba(255, 255, 255, 1);
}
```

---

## 6. Verification & Quality Assurance Checklist

1. **Backend Tests**: All 30 test suites (180 tests) pass including Supertest verification for contact forms, double opt-in subscriptions, and blog publishing.
2. **Frontend Tests**: All 8 client test suites (33 tests) pass covering marketing page rendering, accordion expand/collapse, and CTA routing logic across all user roles.
3. **TypeScript & Bundling**: Clean `tsc -b` compilation and Vite production build with zero errors.
4. **Logic Preservation**: Core decision engine, calculators, and protected routes remain untouched.
