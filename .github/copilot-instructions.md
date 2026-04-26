---
name: mindwood-copilot-instructions
description: "Mindwood App workspace conventions. Use when: developing features in Next.js frontend, API routes, Supabase integration, Stripe payments, audio recording/playback, or AI text-to-speech functionality."
applyTo: "**"
---

# Mindwood App – Workspace Instructions

**Project**: Mindwood (Atelier des Liens Invisibles) – Dual-type audio messaging platform  
**Stack**: Next.js 16 + React 19 + TypeScript + Supabase + Stripe + OpenAI TTS  
**Deployment**: Vercel (FR: `.fr`, EN: `.com`)

---

## 🚀 Quick Start

```bash
# Install & run dev server
npm install
npm run dev          # http://localhost:3000

# Build & test production
npm run build
npm start
npm run lint         # ESLint check
```

**Key .env variables**: See [STRIPE_SETUP.md](../STRIPE_SETUP.md) and [RECORDING_SETUP.sql](../RECORDING_SETUP.sql)

---

## 🏗️ Architecture: Dual Bijou Types

The app supports two message types, **enforced at UI level** via `useSetupSealGuard()`:

| Type | Content Source | Playback | Key Feature |
|------|---|---|---|
| **murmures_IA** | AI-generated text + OpenAI TTS | Auto-play | Immutable, system-controlled |
| **voix_enregistree** | User-recorded audio (5 attempts max) | Manual play | Locked after validation |

**Critical**: Once user selects a mode at setup, they **cannot switch modes**. The guard rejects cross-type operations.

---

## 📁 Directory Patterns

### Pages & Flows

```
src/app/
├── record/[id]/          # Recording UI + AudioRecorder component
│  └── RecordClient.tsx    # "use client" — manages draft→final upload, validation
├── listen/[id]/          # AI message playback (auto-detect type, auto-play)
│  ├── ListenClient.tsx
│  └── murmure/           # murmures_IA specific variant
├── setup/[id]/           # Mode selection + composition wizard (7-step flow)
├── recharge/[id]/        # Buy message credits (Stripe checkout)
└── api/                  # See API Routes section below
```

**Server vs Client**: Page shells are Server Components (async data fetch). Interactive work → `"use client"` components.

### Components

```
src/components/
├── AudioRecorder.tsx     # Reusable mic capture + preview widget
├── RechargePanel.tsx     # Stripe checkout trigger
├── LuxeDropdown.tsx      # Themed select component
└── LuxeSelect.tsx        # Multi-select variant
```

All components marked `"use client"` for interactivity.

### Utilities & Hooks

```
src/lib/
├── supabaseClient.ts     # Singleton Supabase instance
├── i18n.ts               # getLocaleFromHost() — domain → lang mapping
├── useSetupSealGuard.ts  # Hook: Prevent mode-switching after setup
└── murmures/
    ├── setup-draft.ts    # Theme + composition state management
    └── theme-definitions.ts
```

---

## 🔧 API Routes & Patterns

### Audio Recording Flow

**`POST /api/record`** – Upload audio (draft or final)
```typescript
// Request
{ id_bijou, audioBase64, durationSeconds, isDraft, enregistreur_nom? }

// Response: { status: 'draft' | 'locked', voix_id, essais_restants }
```

- `isDraft: true` → Save to `recording_drafts` for preview/playback
- `isDraft: false` → Save to `voix_enregistrees` + lock session (no more uploads)
- Returns remaining attempts (`essais_restants`)

**`GET /api/record?id_bijou=uuid`** – Fetch session status + audio refs

### AI Message Flow

**`POST /api/tts`** – Generate text-to-speech audio
```typescript
{ text, voix_id, theme } // theme influences voice params
```

**`POST /api/murmures`** – Create/update AI message  
**`GET /api/murmures/[id]/listen`** – Fetch + stream audio

### Stripe Integration

**`POST /api/stripe/create-checkout-session`** – Initiate payment  
**`POST /api/stripe/webhook`** – Handle `payment_intent.succeeded` events  
→ Updates `bijoux` credits after webhook verification

See [STRIPE_SETUP.md](../STRIPE_SETUP.md) for webhook setup (requires Stripe CLI locally).

---

## 🎯 Common Development Tasks

### Adding a New Page

1. Create `src/app/new-route/[id]/page.tsx` (Server Component)
2. If interactive: add `NewClient.tsx` marked `"use client"`
3. Use `useSetupSealGuard()` if mode-sensitive
4. Fetch data via Supabase in server component, pass to client component as props

### Recording or Playback Flows

- **Recording**: Use `<AudioRecorder>` component, POST to `/api/record` with `isDraft: true/false`
- **Playback**: Fetch audio URL from DB, use HTML5 `<audio>` element or Web Audio API
- ⚠️ **WebM codec**: No Safari support on iOS/Mac → Consider MP3 fallback

### Adding Stripe Products

1. Update pricing in Supabase `bijoux` table
2. Modify checkout session in `POST /api/stripe/create-checkout-session`
3. Test locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Internationalization

- Domain-based: `.com` → English, `.fr` → French
- Auto-detected in `getLocaleFromHost()` utility
- Update UI strings in `src/lib/i18n.ts`
- **Gotcha**: Locale won't update on mid-session domain navigation (users need full page reload)

---

## 🗄️ Database Schema Overview

See [RECORDING_SETUP.sql](../RECORDING_SETUP.sql) for full schema.

### Core Tables

- **`bijoux`** – Main entity: user assets, bijou type (`type_bijou: 'murmures_IA' | 'voix_enregistree'`), credits
- **`recording_sessions`** – Attempt tracking: `essais_restants`, `is_locked`, timestamps
- **`recording_drafts`** – Temporary audio blobs (TTL managed, auto-cleaned)
- **`voix_enregistrees`** – Final validated recordings (immutable once locked)

---

## ⚠️ Critical Gotchas & Pitfalls

| Issue | Impact | Solution |
|-------|--------|----------|
| **Recording Lock** | Users cannot re-record once validated | Design flow to capture all attempts before validation |
| **Draft Expiry** | Temporary audios have TTL | Always check timestamps in `recording_drafts` before playback |
| **Service Role Key Exposure** | Security breach | Never include `SUPABASE_SERVICE_ROLE_KEY` in client code; server-side only |
| **WebM on Safari** | Audio won't play on iOS/Mac | Provide fallback codec or alert users |
| **Stripe CLI Required** | Local webhook testing fails silently | Run `stripe listen` before testing payments locally |
| **Locale Static** | Language won't switch mid-session | Users must do full page reload to change domain/locale |
| **Mode-Switching Guards** | Silent rejection of cross-type API calls | Always call `useSetupSealGuard()` in mode-aware components |
| **Audio Base64 Encoding** | Large payloads can timeout | Compress audio before upload; consider chunked streaming |

---

## 📚 Documentation Links

| Topic | File | Purpose |
|-------|------|---------|
| **Dual System Overview** | [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md) | Feature details, DB schema, API examples |
| **Recording & DB** | [RECORDING_GUIDE.md](../RECORDING_GUIDE.md) | SQL schema, setup walkthrough |
| **Stripe Setup** | [STRIPE_SETUP.md](../STRIPE_SETUP.md) | Payment config, webhook CLI, testing |
| **Deployment** | [VERCEL_DEPLOYMENT.md](../VERCEL_DEPLOYMENT.md) | Vercel config, environment variables, domains |
| **Architecture & Convention** | [WORKSPACE_GUIDE.md](../WORKSPACE_GUIDE.md) | Comprehensive reference for onboarding |
| **Recording Checklist** | [RECORDING_CHECKLIST.md](../RECORDING_CHECKLIST.md) | Feature validation checklist |

---

## 🔄 Typical User Journeys

### 1️⃣ First-Time User – Recording Path

```
/setup/[id]  → Select "voix_enregistree" mode
            → Enter name, theme, composition
            → /record/[id] → Capture audio (5 attempts)
            → Validate → Lock session
            → Done
```

### 2️⃣ Receiving User – Playback Path

```
/listen/[id]  → Auto-detect message type
  IF murmures_IA:
    → Fetch TTS audio → Auto-play
  IF voix_enregistree:
    → Fetch recorded audio → Show play button
```

### 3️⃣ Low on Credits – Recharge Path

```
/recharge/[id]  → Select package (e.g., 20 messages €10)
               → POST to Stripe checkout
               → User completes payment
               → Webhook updates `bijoux.credits`
               → Redirect to /recharge/[id]/success
```

---

## 🧪 Testing & Debugging

### Local Environment Checklist

- [ ] `.env.local` configured with Supabase keys
- [ ] Stripe test keys in `.env.local`
- [ ] OpenAI API key set (if testing TTS)
- [ ] `stripe listen` running in separate terminal (for webhook testing)
- [ ] PostgreSQL migrations applied (see [RECORDING_SETUP.sql](../RECORDING_SETUP.sql))

### Common Debugging Steps

1. **Audio upload fails**: Check browser console for FormData encoding; verify `id_bijou` UUID format
2. **Playback doesn't auto-start**: Verify `listen/[id]/ListenClient.tsx` useEffect; check audio MIME type
3. **Stripe webhook not received**: Confirm `stripe listen` CLI is running and forwarding to correct URL
4. **Mode-switch silently fails**: Check `useSetupSealGuard()` return value; verify stored session type

---

## 🛠️ Code Style & Conventions

- **TypeScript strict mode**: Enable by default in `tsconfig.json`
- **Component naming**: Suffixed `Client` for `"use client"`; no suffix for Server Components
- **Routing**: Predictable `[id]` param names match entity types (e.g., `[id]` for `bijoux.id_bijou`)
- **Error handling**: Catch and log API errors; return user-friendly messages
- **Async operations**: Use React 19 async components for data fetching; avoid unnecessary `useEffect`

---

## 💡 Next Steps for New Contributors

1. Run `npm install && npm run dev`
2. Read [WORKSPACE_GUIDE.md](../WORKSPACE_GUIDE.md) for full architecture overview
3. Review one of the dual-type flows (recording or playback) in the codebase
4. Test Stripe locally by following [STRIPE_SETUP.md](../STRIPE_SETUP.md)
5. Check [RECORDING_CHECKLIST.md](../RECORDING_CHECKLIST.md) before merging new features

---

**Last Updated**: April 2026  
**Maintained by**: Mindwood Development Team
