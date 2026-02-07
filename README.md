# Runway

Unified operational workspace for early-stage startup founders. Built for IIT Jammu Techpreneur Hackathon.

- **Execution tracking** — Startup workspaces, milestones, tasks, weekly sprints
- **Roles** — Founder (full), Team member (limited write), Investor (read-only)
- **Validation** — Validation data can be used in insights and investor view
- **Analytics** — Tasks completed over time, sprint reliability, validation activity
- **AI layer** — Rule-based execution and validation insights; investor summary generator
- **Trust** — Security and transparency for execution data

## Tech stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind; Stitch-derived UI preserved
- **Backend:** Firebase Auth + Firestore
- **State:** React state / context
- **AI:** Rule-based insights and investor summary

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Firebase**

   - Create a project at [Firebase Console](https://console.firebase.google.com)
   - Enable **Authentication** (Email/Password; optionally Google)
   - Create a **Firestore** database
   - Copy config into `.env.local` (see `.env.example`)

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

3. **Firestore rules**

   Deploy `firestore.rules` from the project root (e.g. `firebase deploy --only firestore:rules`).

4. **Indexes (if prompted by Firestore)**

   Create composite indexes for:

   - `milestones`: `workspaceId` (Asc), `order` (Asc)
   - `tasks`: `workspaceId` (Asc), `updatedAt` (Desc)
   - `tasks`: `sprintId` (Asc), `updatedAt` (Desc)
   - `sprints`: `workspaceId` (Asc), `createdAt` (Desc)
   - `validations`: `workspaceId` (Asc), `createdAt` (Desc)

5. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign up, create a workspace, add milestones and tasks, then create/lock/close sprints.

## Demo flow

1. **Sign up** → Create a **Startup workspace** (you’re the founder).
2. **Overview** → Add **milestones**, then **tasks** under milestones.
3. **Sprints** → **New sprint** (week range, goals, assign tasks) → **Lock sprint** → During week, update task statuses → **Close sprint** (completion summary).
4. Track execution and view insights on the overview.
5. **Analytics** — View tasks over time and sprint reliability.
6. **Investor view** (founder only) — Generated summary (problem, execution, validation, roadmap).

## Hackathon notes

- **AI:** Execution/validation insights and investor summary are **rule-based** (see `lib/ai-mock.ts`). Replace with LLM/API when needed.
- **Workspace membership:** Adding team members/investors to a workspace is not implemented in the UI; extend `workspace.members` and role checks as needed.

## License

MIT.
