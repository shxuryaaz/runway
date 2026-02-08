<p align="center">
  <strong>Runway</strong>
</p>
<p align="center">
  <em>Give your startup a real Runway</em>
</p>
<p align="center">
  Unified execution workspace for early-stage founders · Built for <strong>IIT Jammu Techpreneur Hackathon</strong>
</p>

---

## What it does

| Area | Description |
|------|-------------|
| **Execution** | Workspaces, milestones, tasks, weekly sprints. Plan and ship in one place. |
| **Roles** | Founder (full access), Team member (limited write), Investor (read-only). |
| **Validation** | Shareable links per milestone for external feedback—no login for respondents. |
| **Analytics** | Tasks completed over time, sprint reliability, validation activity (Recharts). |
| **Insights** | Rule-based execution and validation insights; investor one-pager generator. |
| **Integrations** | Slack (optional): notify channels on sprint lock/close and milestone complete. |

---

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | Firebase Auth, Firestore |
| Charts | Recharts |
| AI | Rule-based (extensible to LLM) |

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in your Firebase config
npm run dev
```

Open **http://localhost:3000** → Sign up → Use **Create demo workspace** on the dashboard for a one-click hackathon demo (pre-filled milestones, tasks, sprints, validations).

---

## Setup (full)

### 1. Firebase project

1. Create a project at [Firebase Console](https://console.firebase.google.com).
2. Enable **Authentication** (Email/Password and/or Google).
3. Create a **Firestore** database.
4. Add config to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

5. **Validation links (optional):** In Firebase → Project settings → Service accounts → Generate new key. Set in `.env`:
   - `FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'` (single line), or
   - `FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json`  
   Do not commit the key.

6. **Slack (optional):** Create an app at [api.slack.com/apps](https://api.slack.com/apps) with `chat:write`, `channels:read`, `groups:read`. Add `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` to `.env`. Redirect URL: `https://your-domain.com/api/slack/callback`. Set `NEXT_PUBLIC_APP_URL` in production.

### 2. Firestore

- Deploy rules: `firebase deploy --only firestore:rules`
- Create indexes when Firestore prompts (e.g. `milestones`: workspaceId + order; `tasks`: workspaceId + updatedAt; `sprints`: workspaceId + createdAt; etc.)

---

## Demo flow (hackathon)

1. **Sign up** (email or Google) → **Create demo workspace** (one click, pre-filled data).
2. **Overview** — See metrics, execution chart, current sprint, milestones. Tick tasks done from the list.
3. **Sprints** — Create/lock/close sprints; move tasks between To do / In progress / Done.
4. **Analytics** — Bar charts for tasks completed over time and validation activity.
5. **Funding** — Rounds, allocations, spend logs (if you use that tab).
6. **Investor readiness** — Generate a one-pager (problem, execution, validation, roadmap).

---

## Hackathon notes

- **AI:** Insights and investor summary live in `lib/ai-mock.ts` (rule-based). Swap in an LLM when you’re ready.
- **Team/Investor UI:** Workspace membership is in the data model; invite UI can be extended.

---

## License

MIT
