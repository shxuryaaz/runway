# Stitch folder – full UI analysis

The `stitch/` folder is the **single source of truth for the Runway landing (and related) UI**. It was generated with Stitch/Framer. This doc maps every section, component, and copy so the app can reuse the same structure and semantics.

---

## Folder structure

| Path | Type | Purpose |
|------|------|--------|
| `runway_landing_page_-_hero_section/` | code.html + screen.png | Hero, nav, dashboard mockup, social proof |
| `runway_landing_page_-_execution_section/` | code.html + screen.png | Execution management: 2-col layout, task list preview, feature chips |
| `runway_landing_page_-_features_grid/` | code.html + screen.png | Capabilities: bento grid, CTA strip, footer |
| `runway_landing_page_-_insights_section/` | code.html + screen.png | Progress & insights: metrics card, chart, risk callout |
| `runway_landing_page_-_ai_layer/` | code.html + screen.png | AI intelligence: 3 cards + dark CTA |
| `runway_landing_page_-_trust_&_final_cta/` | code.html + screen.png | Trust/blockchain + final CTA + full footer |
| `screenshot_2026-02-07_at_4.49.*.png/` | screen.png only | 5 extra screens (no HTML) – likely dashboard/app views |

---

## 1. Hero section (`runway_landing_page_-_hero_section`)

### Layout
- **Header**: Logo (R mark in primary box) + “Runway” wordmark; nav (Features, Benefits, Pricing, Blog, Contact Us); primary CTA “Try Runway free”.
- **Hero**: Centered; H1 “Give your startup a real Runway”; subtext; two buttons (Try Runway free, See features).
- **Dashboard mockup**: Mac-style bar (red/yellow/green); sidebar (placeholder bars); main area: greeting “Hello, Leonardo” / “Welcome back to your workspace”; 2 stat cards; chart area.
- **Social proof**: “Built for early teams” + logo row (Stripe, Netflix, Google, Coinbase, Airbnb).
- **Background**: `hero-gradient`; fixed blur orbs (primary/5, primary/10).

### Design tokens
- **Colors**: `primary: #137fec`, `background-light: #f6f7f8`, `background-dark: #101922`.
- **Font**: Manrope (display).
- **Border radius**: default, lg, xl, full.
- **Custom class**: `.hero-gradient` (radial gradient top-center).

### Copy to keep (startup semantics)
- Headline and subtext are already startup-focused.
- **Replace in mockup**: “Hello, Leonardo” → “Welcome back, Founder” (or dynamic name); “Total projects” → “Startup workspaces”; “Active projects” → “Active sprints”; “Earning over time” → “Execution over time”; “Past 6 months” → “Past 6 sprints”.

### Logo
- Same SVG in all sections: viewBox 0 0 48 48, path for stylized “R” (L-shaped block). Used in header and footer; sometimes in a `bg-primary` rounded box.

---

## 2. Execution section (`runway_landing_page_-_execution_section`)

### Layout
- **Header**: Same Runway logo (no bg box here, just `text-primary` SVG + wordmark); nav (Product, Features, Solutions, Pricing); “Try Runway free” + “Login”.
- **Main**: Two columns (lg).
  - **Left**: Card with decorative `bg-primary/5` wrapper; inner card: title “Projects”, Mac dots; **tabs** “Ongoing” | “In Review” | “Completed”; **task rows** (avatar, title, subtitle, badge, check icon). Floating card: “On-Chain Ledger” / “Execution Verified”.
  - **Right**: Eyebrow “Execution Management”; H1 “Plan, track and move your startup forward”; body copy; primary CTA; **4 feature chips** (Tasks, Weekly Tracking, Validation feedback, Progress Analytics) in 2×2 grid.

### Copy
- **Replace**: “Projects” → “Startup workspaces” (or “Workspace” for the card title). Task examples can stay as placeholders or become “Sprint: Week 1”, “Milestone: Alpha”, etc.
- Keep: “Ongoing” / “In Review” / “Completed” (maps to sprint/task states).
- Keep: “On-Chain Ledger” / “Execution Verified” for trust layer.

### Structure to preserve
- Sticky header with backdrop blur.
- Left: single card with tabs + list of task-like rows.
- Right: headline + description + one CTA + 4 icon+label chips (checklist, update, reviews, insights).

---

## 3. Features grid (`runway_landing_page_-_features_grid`)

### Layout
- **Header**: Same Runway + nav (Product, Features, Pricing, About) + Get Started / Sign In.
- **Main**: `grid-bg` background; max-w-[1200px]; centered section.
  - **Section header**: “Capabilities”; H1 “Built for early stage founders”; subtext.
  - **Bento grid** (grid-cols-1 md:2 lg:6):
    - **Card 1** (lg:col-span-3): “Execution & milestone tracking” + timeline mock (Phase 1–3: MVP Design, Alpha Launch, Beta Scale) + overlay image.
    - **Card 2** (lg:col-span-3): “Integrates seamlessly” + 4×3 icon grid (Slack, GitHub, etc. as Material icons).
    - **Card 3** (lg:col-span-2): “Team roles” (handshake icon).
    - **Card 4** (lg:col-span-2): “Progress” (language icon).
    - **Card 5** (lg:col-span-2): “View things your way” (view_quilt).
  - **CTA strip**: `bg-primary` rounded-2xl; “Ready to accelerate your runway?”; “Join 500+ startups…”; Get Started Free / Request Demo.
- **Footer**: Logo + “Runway © 2024”; Privacy, Terms, Status, Security.

### Design
- **Custom class**: `.grid-bg` (radial dot grid); dark variant for dark mode.
- Cards: white/dark:bg-slate-900, border, hover:shadow-xl; small cards have hover:-translate-y-1.

### Copy
- All headings and body are already founder/startup-oriented; no “projects” or “clients” in this section.
- Phase labels (MVP Design, Alpha Launch, Beta Scale) are good as milestone examples.

---

## 4. Insights section (`runway_landing_page_-_insights_section`)

### Layout
- **No full-page header** in this snippet; assumes same global header.
- **Main**: Two columns (layout-content-container flex-col lg:flex-row, order-2 lg:order-1 for text).
  - **Left (copy)**: “Progress & Insights”; H1 “Understand what’s working and what isn’t”; body; “View analytics dashboard” button; **4 chips** (Tasks Completed, Expected Profit, Margin, Integrations).
  - **Right (visual)**: Card in `bg-primary/10` rounded-[2rem] wrapper; inner card: “Project progress”; **metrics grid** (Tasks 84%, Milestones 12/15, Blocked 2, Score 9.2); **chart** “Budget used vs Forecast” + SVG line chart + Jan–Jun labels; footer (avatars “+4”, “Updated 2m ago”); **floating risk card** “Risk Detected” / “Runway Gap High”.

### Copy to adjust for startup
- “Project progress” → “Workspace progress” or “Execution progress”.
- “Budget used vs Forecast” → “Execution vs plan” or “Sprint completion vs goal” (keep chart structure).
- Chips: “Expected Profit” / “Margin” → e.g. “Sprint reliability”, “Validation score” (or keep for investor angle).
- Risk: “Runway Gap High” is already startup language; keep.

### Structure to preserve
- Left: eyebrow + H1 + body + one CTA + horizontal chip row.
- Right: one large card (metrics 2×2 or 4 in a row, then chart, then small footer row + floating risk callout).

---

## 5. AI layer (`runway_landing_page_-_ai_layer`)

### Layout
- **Header**: Logo in primary rounded box (rocket_launch icon) + “Runway”; nav (Product, Solutions, Blockchain, Pricing); Sign In + Get Started.
- **Hero**: Badge “The Intelligence Layer”; H2 “AI-Powered Intelligence”; subtext.
- **Feature grid**: 3 cards (md:grid-cols-3), each: icon in primary/10 box, H3, body, “Learn more” / “See how it works” / “View samples” with arrow on hover.
  - Card 1: “AI-assisted execution insights” (insights icon).
  - Card 2: “Validation signal analysis” (biotech icon).
  - Card 3: “Investor-ready summaries” (summarize icon).
- **CTA**: Dark rounded-3xl section (“Experience the future of startup execution”; “Get Started Now” / “Schedule Demo”).
- **Footer**: Logo + Runway; Privacy, Terms, Contact; LinkedIn/Twitter icons; “© 2024 Runway AI. Built for the founders of tomorrow.”

### Copy
- All three card titles and descriptions align with Runway’s AI spec (execution insights, validation analysis, investor summaries). Keep as-is.
- CTA and footer are already startup/AI/blockchain themed.

---

## 6. Trust & final CTA (`runway_landing_page_-_trust_&_final_cta`)

### Layout
- **Header**: Logo (size-8) + “Runway”; nav (Product, Features, Pricing, About); “Try Runway free”.
- **Trust section**: “Security & Transparency”; H1 “Trust Layer: Blockchain Ledger”; **two-column block** (lg:flex-row): left = visual with `trust-grid` bg + small card “EXECUTION_HASH_V2.0” + progress bars + hash “0x71C7…”; right = “Secure Execution History” copy + **3 sub-cards** (Innovation & scalability, Investor readiness, Real-world applicability).
- **Final CTA**: Dark section with `trust-grid` overlay; “Give your startup a real Runway”; “Stop assuming progress…”; Try Runway free / Contact Sales; “No credit card required. 14-day free trial.”
- **Footer**: 5-column grid (Runway + tagline; Product; Resources; Company; Connect with icons); then bottom bar (© 2024 Runway Inc.; Status, Cookies, Sitemap).

### Design
- **Custom class**: `.trust-grid` (radial gradient #137fec 0.5px, 24px spacing).
- Hash card: verified_user icon, mono “EXECUTION_HASH_V2.0”, progress bars, truncate hash.

### Copy
- “Trust Layer: Blockchain Ledger” and “Secure Execution History” match the app’s “Execution & Validation Ledger”. Keep.
- Sub-points (Investor readiness, Proof of execution for VCs, etc.) are already correct.

---

## Shared design system (all sections)

- **Colors**: primary `#137fec`, background-light `#f6f7f8`, background-dark `#101922`, text `#111418`, muted `#617589`.
- **Font**: Manrope (display), Material Symbols Outlined for icons.
- **Tailwind**: darkMode: "class"; same theme extensions in every file.
- **Logo**: One SVG path for “R” mark; sometimes in a `bg-primary` rounded container, sometimes plain.
- **Nav**: 4–5 links (Product, Features, Pricing, etc.); primary CTA (“Try Runway free” / “Get Started”); secondary “Login” / “Sign In”.
- **Footer**: Varies from minimal (logo + 3–4 links) to full (Product, Resources, Company, Connect + legal line).

---

## Copy replacement checklist (freelancer → startup)

| Stitch / generic | Use in app |
|------------------|------------|
| Projects | Startup workspaces / Workspace |
| Total projects / Active projects | Startup workspaces / Active sprints |
| Earning over time | Execution over time |
| Past 6 months | Past 6 sprints |
| Hello, Leonardo | Welcome back, Founder (or user displayName) |
| Marketing Team / Strategy Phase | Milestone or sprint name |
| Asana website audit, etc. | Task title examples or real task titles |
| Project progress | Workspace progress / Execution progress |
| Budget used vs Forecast | Execution vs plan / Sprint completion |
| Expected Profit / Margin (chips) | Optional: Sprint reliability, Validation score |

---

## Screenshot-only folders

- `screenshot_2026-02-07_at_4.49.10 pm.png` through `4.49.36 pm.png`: **no code.html**. These are likely:
  - Alternative landing layouts, or
  - **App/dashboard screens** (e.g. workspace view, sprint view, analytics).
- Use the `screen.png` assets as visual reference only; replicate layout/copy in React where needed.

---

## Recommended landing page order (single scroll)

1. **Hero** (hero_section): nav, hero, dashboard mockup, social proof.
2. **Execution** (execution_section): “Plan, track and move your startup forward” + workspace/task preview + feature chips.
3. **Features** (features_grid): “Built for early stage founders” bento + CTA strip.
4. **Insights** (insights_section): “Understand what’s working and what isn’t” + metrics/chart card + risk.
5. **AI** (ai_layer): “AI-Powered Intelligence” + 3 cards + dark CTA.
6. **Trust** (trust_&_final_cta): Trust Layer + final CTA + full footer.

Use one shared header/footer for the whole page; inject each section’s main content block so structure and classes match Stitch as closely as possible.
