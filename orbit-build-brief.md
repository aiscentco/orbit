# Orbit Web App — Build Brief for Claude Code
### AIscent Co. · NPD Orchestrator · Phase 2

**Read this whole document before writing any code. It is the complete spec. Build in the order given. Stop and confirm with me after each milestone.**

---

## 0. What you are building (plain summary)

Orbit is a branded web application for a beauty-industry NPD (new product development) consultancy called AIscent Co. It tracks the products their clients are developing as those products move through a gated approval process (gates G1 to G5). It is the operational "Phase 2" tool in a three-part system: Nova (diagnostic, already built), **Orbit (this app)**, and Pulse (future monitoring).

The app reads from and writes to an existing **Notion** workspace that already holds the data (three databases described in section 4). The app is the professional interface; Notion is the database behind it.

The person running this build (Xo) is a non-developer using Claude Code for the first time. Explain each step in plain language. Never assume prior knowledge of terminal commands, environment variables, or deployment. After each milestone, give a short plain-language summary of what now works and what to test.

---

## 1. Tech stack (use exactly this — it is beginner-friendly and deployable)

- **Framework:** Next.js (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Hosting:** Vercel (free tier, one-command deploy)
- **Data source (pilot):** Notion, via the official `@notionhq/client` SDK
- **AI:** Anthropic API via `@anthropic-ai/sdk`, model `claude-sonnet-4-6`
- **Auth (for client logins, build last):** Clerk or NextAuth — recommend Clerk for simplicity

Do not use a separate database for the pilot. Notion IS the database. Design a thin data-access layer (`/lib/notion.ts`) so that if we later swap Notion for Supabase/Postgres, only that one file changes. This is important — keep all Notion calls in that one module, never scattered through components.

---

## 2. Design system (non-negotiable — this is the AIscent Co. brand)

```
WOW Pink   #FF2D7B   primary — buttons, active states, key accents
Bloom      #FF85B3   accent — secondary highlights, badges
Petal      #FFE8F2   light pink background tint
Ink        #1A1A1A   primary text
```

- **Headings:** Georgia serif (font-family: Georgia, 'Times New Roman', serif)
- **Body / UI:** DM Sans, falling back to Inter, then system sans-serif
- Clean, minimal, lots of whitespace. Thin borders (0.5px). Rounded corners (8px standard, 12px cards). No heavy shadows, no gradients except subtle brand-coloured headers.
- Status colours: green = on track / done, amber = due soon / waiting, red = late / critical, purple = waiting.
- The whole app must support **per-client theming**: each client record carries a primary and accent hex colour. When viewing a client, the app re-skins to their colours. Default to AIscent Co. pink.

---

## 3. Gate model (domain logic — get this right)

Products move through eight stages:
```
Pre-G1 → G1 → Post-G1 → G2 → Post-G2 → G3 → G4 → G5
```

Progress percentage per stage (for progress bars/rings):
Pre-G1=8, G1=22, Post-G1=38, G2=52, Post-G2=67, G3=78, G4=90, G5=97.

For the pipeline kanban, collapse the eight stages into four columns:
- **Briefing** = Pre-G1, G1
- **Development** = Post-G1, G2
- **Review** = Post-G2, G3, G4
- **Production** = G5

**Risk logic** (based on days until "Next gate date"):
- more than 7 days away → on track (green)
- 0 to 7 days → due soon (amber)
- 1 to 14 days late → late (red)
- more than 14 days late → critical (dark red, flag icon)

**Gate decisions:** GO (on time), GO (late), HOLD, POSTPONE, CANCEL.

---

## 4. The Notion data source (already built — connect to it)

The Notion workspace already contains three databases. You will be given a Notion integration token (an environment variable, `NOTION_TOKEN`). The three data source IDs are:

- **Clients:** `b68b1b7a-30be-4e87-8479-7c0bfae9adcd`
- **Products:** `d9289c44-a176-424b-ba97-2414c0f32fed`
- **Actions:** `6c6cad9d-9aa2-4be8-9722-72d8d0443126`

### Clients fields
Client name (title), Engagement start (date), Consulting lead (select: Xo/Lydia), Status (select: Pilot/Active/Paused/Completed), Label: campaign (text), Label: demand (text), Label: revenue KPI (text), Label: margin KPI (text), Label: planning system (text), Label: BM role (text), Brand primary color (text/hex), Brand accent color (text/hex), HALAL required (checkbox), China compliance required (checkbox), Notes (text).

### Products fields
Product name (title), Client (relation → Clients), Product code (text), Campaign (text), Gate stage (select, the 8 stages), Gate decision (select), Next gate date (date), Launch type (select: Regular/Super/Mega/Hero), Product life (select: New/Limited life), Brand manager (text), Formulation lead (text), Procurement lead (text), Regulatory lead (text), Intended supplier (text), Awarded supplier (text), Annual demand (text), MOQ (number), Revenue target (number), Margin target % (number), Shade count (number, optional), HALAL compliant (select: Yes/No/N/A), Brief link (url), Project status (select: Active/On hold/Cancelled/Completed).

**Important on labels:** Products columns are generic (e.g. "Revenue target"). The client's own name for each KPI lives on the Client record (e.g. "Label: revenue KPI" = "NSV"). When displaying a product, look up its client's labels and render the client's wording. This is the core display rule. A field whose value is empty should be hidden, not shown blank (this handles optional-per-client fields like Shade count).

### Actions fields
Action (title — the note text), Product (relation → Products), Status (select: To do/Waiting/Done), Owner (text), Date logged (date), Source (select: Manual/AI-extracted/Skill trigger).

Keep all Notion read/write logic in `/lib/notion.ts`. Map Notion's response shape into clean TypeScript types (Client, Product, Action) so components never touch raw Notion JSON.

---

## 5. Screens to build (build in this order)

### Milestone 1 — Shell + data layer
- Next.js app, Tailwind, brand fonts and colours configured.
- `/lib/notion.ts` with typed functions: `getClients()`, `getClient(id)`, `getProducts(clientId?)`, `getProduct(id)`, `updateProduct(id, fields)`, `getActions(productId)`, `createAction(...)`, `updateAction(...)`.
- A sidebar layout: Dashboard, Pipeline, Actions, Agenda, Reports, Setup.
- Confirm: app runs locally, sidebar navigates, Notion data loads (log clients to console to prove the connection).

### Milestone 2 — Dashboard
- Greeting band (time-of-day) in the active client's brand colour.
- Four health stat cards: products in development, late/critical, due soon, open actions.
- Project health cards with circular progress rings, sorted by urgency, each showing name, stage, BM, campaign, and a risk badge.
- "Today's focus" and "Needs attention" side panels.
- Client switcher (dropdown) — switching re-skins the app to that client's colours and filters all data to that client.

### Milestone 3 — Pipeline
- Four-column kanban (Briefing / Development / Review / Production) per the collapse rule.
- Product cards: name (Georgia), code, campaign, progress bar, BM, risk badge, launch type, open-action dot.
- Drag a card between columns → updates the product's Gate stage in Notion.
- Toggle: group by gate stage vs by campaign.
- Click a card → product detail.

### Milestone 4 — Product detail
- Header: name, code, campaign, type, risk badge, save button.
- A clickable gate stepper (the 8 stages) — clicking a stage moves the product there (writes to Notion).
- Progress bar with "Step N of 8" context.
- Editable fields (all product fields), using the client's KPI labels for display.
- Right panel: the action log for this product (To do / Waiting / Done), with an input to add a new action. Tapping a status cycles it To do → Waiting → Done (writes to Notion).

### Milestone 5 — Agenda generator
- Select which gate stages to include (multi-select pills).
- "Build agenda" generates a timed, full-day gate meeting agenda (09:00 start) from the live product data: welcome, supply planning, then products grouped by gate with realistic time per product (Mega 25min, Super 20min, Regular 15min), a lunch break inserted around midday, AOB, close. Late products flagged and given extra time.
- Branded agenda header in the client's colour. Energetic but clean, no emojis.
- "Enhance with AI" button: calls Claude (claude-sonnet-4-6) to add a one-line context note per product, pulled from that product's recent actions. (See section 6.)

### Milestone 6 — Actions view
- All actions across all products (for the active client) in one place.
- Filter by status. Tap status to advance it. Click a row to jump to its product.

### Milestone 7 — Skill triggers
- On the product detail, a "Skills" panel showing which skills apply at the product's current gate stage (mapping in section 7).
- Built skills show a "Launch" button; unbuilt show "Soon".
- Launching a skill (for now) creates an Action tagged Source = "Skill trigger" recording that it was launched, and opens the skill (for built ones, open the skill's URL in a new tab — URLs to be provided; for XO WOW Intelligence Studio and NPD Submission Review, leave configurable placeholders).

### Milestone 8 — AI action extraction
- On the product detail, a "Paste meeting notes" box.
- Pasting notes and clicking Extract calls Claude (claude-sonnet-4-6) with a prompt that returns structured JSON: an array of {owner, note, status}. Create one Action per item, tagged Source = "AI-extracted". (See section 6.)
- Future: replace the paste box with a Granola transcript pull. Leave a clearly commented integration point.

### Milestone 9 — Setup
- Client profile editor: company name, KPI label mappings, brand colours (colour pickers), market flags.
- Saving writes back to the Notion Client record.

### Milestone 10 — Auth + per-client access (build last)
- Add Clerk auth. Two roles: AIscent Co. consultant (sees all clients) and client user (sees only their own client's data).
- A client user logging in lands on a dashboard filtered to their client only, in their brand colours.
- This is what enforces "each client sees only their own data."

### Milestone 11 — Reports
- Products by stage (bar), late products by lead (delay attribution), late & critical list, action completion rate.

---

## 6. AI calls (exact specifications)

All AI calls go through a server route (never expose the API key to the browser). Use `@anthropic-ai/sdk`, model `claude-sonnet-4-6`, max_tokens 1000.

**Agenda enhancement** — system prompt: "You are an NPD project manager assistant for a beauty consultancy. For each product, write exactly one sentence (max 12 words) naming the single most important decision needed at today's gate meeting. Be specific, no filler, no markdown." Send the product list with stage, risk, and latest action. Expect plain text or JSON array of one-liners.

**Action extraction** — system prompt: "Extract structured action items from NPD meeting notes. Return JSON only, no markdown: {\"actions\":[{\"owner\":\"name\",\"note\":\"action description\",\"status\":\"To do\"}]}. Status is one of To do, Waiting, Done. Be specific and concise." Send the product name, stage, and the pasted notes. Parse the JSON, create one Action per item.

Always wrap AI calls in try/catch and handle the case where JSON parsing fails (strip markdown fences first, then parse).

---

## 7. Skill-to-gate mapping (for the Skills panel)

```
Pre-G1:  NPD brief generator (Marketing) [BUILT — XO WOW Intelligence Studio]
G1:      Brief quality checker (Marketing), Product name generator (Marketing)
Post-G1: Submission review (Cross-functional) [BUILT], Supplier RFI drafter (Procurement)
G2:      Commercial strategy (Marketing), Cost comparison (Procurement), INCI generator (R&D)
Post-G2: Submission review (Cross-functional) [BUILT]
G3:      Regulatory compliance (Regulatory)
G4:      Production readiness (R&D)
G5:      Launch comms generator (Marketing)
```

Function colours: Marketing = #FF2D7B, Procurement = #EF9F27, R&D = #5DCAA5, Regulatory = #AFA9EC, Cross-functional = #64748b.

---

## 8. Environment variables needed

```
NOTION_TOKEN=        (Notion internal integration token — Xo creates this in Notion settings)
ANTHROPIC_API_KEY=   (from console.anthropic.com)
CLERK_*=             (added at Milestone 10)
```

Tell Xo exactly how to obtain each one when it's first needed, step by step.

---

## 9. How to work with Xo (the person running you)

- She is not a developer. Explain every terminal command before she runs it and say what success looks like.
- Build one milestone at a time. After each, summarise in plain language what now works and exactly what to click to test it.
- When something needs a credential or a manual step in Notion/Vercel/Clerk, give numbered click-by-click instructions.
- Commit to git after each working milestone so nothing is lost.
- The Orbit manual (separate document) is the source of truth for the data model and architecture — follow it where this brief and the manual agree; if they ever conflict, ask.

---

## 10. Definition of done (v1)

A deployed Orbit web app on Vercel where: a consultant logs in, sees a branded dashboard, switches between clients (each re-skinning to their colours), works a gate pipeline kanban, opens products and edits them, generates a full-day gate agenda with AI context notes, extracts actions from pasted meeting notes, triggers skills, and a client user can log in to see only their own pipeline. All data living in the existing Notion databases.

---

## 11. Extension milestones (added after Monday.com benchmark)

Build these AFTER Milestones 1–11 are complete and working. Do not start them early.

### Quick wins — fold into existing screens (low effort)
- **Workload view** (add to Reports): active products per lead (BM / FRM / PRO), bar per person, red highlight when someone carries a disproportionate share of late products.
- **Time-in-stage counter** (add to product cards + detail): days the product has been at its current gate stage. Store a `stage_entered_date` whenever the stage changes (write it to a new Notion property "Stage entered" — create it if missing). Show "12d at G2" on cards; highlight amber/red when it exceeds 30/60 days.
- **Activity timeline** (add to product detail): merge actions, gate decisions, and skill triggers into one chronological feed per product — the product's full story in one scroll.
- **Actionable gate-alert emails** (Milestone 13 follow-up): for "just went late" and "just went critical" items specifically, include the top 3 open actions for that product directly in the digest email (not just a link) - so the recipient sees what needs to happen without opening the app. Skip this for "gate date in 7 days" alerts (just a heads-up, nothing to list yet) and don't build until real client feedback says it's needed.

### Milestone 12 — Launch timeline (Gantt-style)
A horizontal timeline view: each product is a bar from its brief date to launch date, gate milestones as diamond markers, grouped by campaign. Today-line vertical marker. Late products' bars tinted red. Read-only in v1 (no drag-to-reschedule yet). This is the "whole campaign at a glance" view.

### Milestone 13 — Gate alerts (automations)
Server-side scheduled job (Vercel cron) that runs daily and sends email alerts (use Resend — the account exists) for: gate date 7 days out, product just went late, product crossed into critical (>14d late). Recipients: the client's distribution emails from the Client record (Distribution: Project Manager etc.). Each alert links to the product in the app. Keep it digest-style: one email per client per day maximum, listing all triggered items — never one email per product.

### Milestone 14 — Product intake form
A public form page (no login) per client, at a shareable URL: marketing submits a new product concept (name, campaign, launch type, target date, short description). Submission creates a Pre-G1 product in Notion linked to that client, and logs an action "New intake — review and complete registry fields." This is the pipeline's front door.

### Milestone 15 — Cost tracking
Add to product detail and G2 views: Target cost, Quoted cost, Final cost (create Notion properties if missing). Show variance vs target with color coding. Feed into Reports as a budget-vs-actual chart per campaign.

### Milestone 16 — Orbit Assistant (AI chat over the pipeline)
A chat panel (collapsible, bottom-right) where the user asks natural-language questions about their pipeline: "which products are late?", "what's blocking W4-27?", "summarize what happened this week." Implementation: server route that sends the question + a compact JSON snapshot of the active client's products and open actions to claude-sonnet-4-6, returns a concise answer with product names as links. No write actions in v1 — read-only answers. Keep responses short and specific. This is a differentiator for client demos.

### Milestone 17 — Predictive delay insights
Once real client data has accumulated over enough gate cycles (the "History" log from the history-fix milestone is the raw material), look for patterns in what tends to cause delays — e.g. certain campaign types, suppliers, or launch types consistently slipping at a particular gate — and surface that as a forward-looking signal on new products ("products like this one have historically run ~2 weeks over at G2"). Do not start this before there's enough real history to learn from; on a handful of products this would just be guessing dressed up as data. Revisit scoping (what to predict, what counts as "similar") once that data exists.

## 12. UI/UX principles (apply across ALL milestones, including 1–11)

- **Inline editing everywhere.** Click any field value to edit it in place; save on blur. Avoid separate edit modes and Save buttons where possible (keep one explicit Save only on complex forms).
- **Color = status, always.** Green/amber/red/purple carry the same meaning on every screen. Never use status colors decoratively.
- **One-click view switching.** Pipeline/timeline/workload toggles are single clicks, position persisted per user.
- **Skeleton loading states** — never blank screens while Notion data loads; show gray placeholder cards.
- **Designed empty states.** Every list/board with no data shows a short helpful line and the next action (e.g. "No products yet — add one or share the intake form"). Never a blank void.
- **Undo toasts.** Destructive or status-changing actions show a 5-second toast with Undo instead of confirmation dialogs.
- **Command palette (Cmd+K):** jump to any product or view by typing. Fast for power users, invisible to everyone else.
- **A quiet moment of delight:** when a product passes a gate (decision set to GO), a brief, subtle brand-pink pulse animation on the card. No confetti, no emojis — restrained.
- **Keyboard-first data entry** on forms: tab order correct, Enter submits, Esc cancels.
- **Mobile-responsive throughout** — PMs check status from phones; the dashboard and pipeline must work on a phone screen (cards stack vertically).

> **Audit resolution (post-Milestone 7):** Product Detail's single batch "Save" button for its ~15 fields was reviewed against "inline editing everywhere" and confirmed compliant — it qualifies as the "complex form" exception this principle already carves out. Not a gap; no change needed.

## 13. Where Pulse lives (architecture note — do not build yet)

Pulse (Phase 3, ongoing monitoring) will live INSIDE the Orbit web app as a separate section/tab — not a separate application. It reads the same data Orbit already collects and turns it into process-health monitoring over time: gate slippage trends, average time-in-stage vs template norms, late-rate per function, action completion rates, skill usage. Design decisions now should keep this possible: keep historical data (never hard-delete actions or gate decisions; keep stage-change history via the "Stage entered" property and an append-only log if needed). Nova stays separate (pre-engagement diagnostic); Pulse may later trigger periodic mini-surveys reusing Nova's question engine, but that is a future integration, not part of this build.

> **Audit resolution (post-Milestone 7):** three test records (2 actions, 1 product) created during Milestone 4/7 verification were archived to Notion's trash (soft-delete, recoverable) after testing. These were synthetic data created and removed within the same session, not real business history, so this doesn't violate the no-hard-delete rule. No action needed. Fixed going forward by the history-fix milestone: real "Gate stage" and "Gate decision" changes are now logged (never overwritten silently) via a `Source: "History"` action and the new "Stage entered" date property.

## 14. Features added during build

Anything built that isn't described elsewhere in this brief gets logged here, in the same commit as the feature. Newest first.

- **"+ New client" creation flow** — after Milestone 11. Milestone 9's Setup was scoped as an editor for clients that already exist in Notion; there was no in-app way to create a brand-new one. Added a lean creation form (company name, consulting lead, status, engagement start) reachable from Setup, writing a new Clients row via a new `createClient()` in `lib/notion.ts`. Consultant-only (checked server-side via a new `assertConsultant()` in `lib/auth.ts`) - a client-role user has no reason to create clients.
- **Agenda "Enhance with AI" folded into "Build agenda"** (no separate button) — Milestone 5. The brief specifies a distinct "Enhance with AI" button; Xo asked that AI usage not be visible as its own feature, so the context-note call now fires automatically inside the same "Build agenda" click. If it fails, the schedule still renders fully and the failure is only logged, never shown.
- **Configurable meeting start time and lunch time on Agenda** — Milestone 5. The brief specifies a fixed 09:00 start and lunch "around midday"; both are now user-set inputs (defaulting to 09:00 / 12:00) after Xo found the fixed values impractical.
- **Inline client picker on Agenda's empty state** — after Milestone 5. When no client is selected, the page originally just said "select a client from the sidebar." Xo got stuck on this, so the empty state now also lists clickable client buttons directly on the page.
- **"← Back" link on product detail** — after Milestone 4. Not in the brief; Xo asked how to get back to Pipeline besides the browser back button.
- **"+ New product" creation flow** — between Milestones 4 and 5. The original 11 milestones assume products already exist in Notion, with no in-app way to create one. Added a lean creation form (name, client, code, campaign, launch type, starting gate stage) reachable from Pipeline, writing a new Products row via a new `createProduct()` in `lib/notion.ts`.
