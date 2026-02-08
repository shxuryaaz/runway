/**
 * Seed dummy data for demo: one workspace with milestones, tasks, sprints, and validation.
 * Runs in the browser with the current user (uses existing Firestore client).
 */

import {
  createWorkspace,
  createMilestone,
  createTask,
  createSprint,
  createValidationEntry,
  updateTask,
} from "./firestore";

function getWeekRange(weeksAgo: number): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() - 7 * weeksAgo);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export interface SeedOptions {
  userId: string;
  userEmail: string;
  displayName?: string;
}

/**
 * Creates a demo workspace with milestones, tasks, 2 sprints, and a validation entry.
 * Returns the new workspace id.
 */
export async function seedDummyWorkspace(options: SeedOptions): Promise<string> {
  const { userId, userEmail, displayName = "Founder" } = options;

  const workspaceId = await createWorkspace(
    "Demo Startup",
    "MVP",
    userId,
    userEmail,
    displayName
  );

  const m1 = await createMilestone(
    workspaceId,
    "Alpha launch prep",
    "Ship MVP to first 10 users",
    0
  );
  const m2 = await createMilestone(
    workspaceId,
    "Customer discovery",
    "Complete 10 user interviews",
    1
  );
  const m3 = await createMilestone(
    workspaceId,
    "Sprint analytics",
    "Execution metrics dashboard",
    2
  );

  const t1 = await createTask(workspaceId, m1, null, "Set up landing page", null);
  const t2 = await createTask(workspaceId, m1, null, "Implement auth flow", null);
  const t3 = await createTask(workspaceId, m1, null, "Deploy to staging", null);
  const t4 = await createTask(workspaceId, m2, null, "Prepare interview script", null);
  const t5 = await createTask(workspaceId, m2, null, "Conduct 5 interviews", null);
  const t6 = await createTask(workspaceId, m3, null, "Build completion chart", null);

  const thisWeek = getWeekRange(0);
  const lastWeek = getWeekRange(1);

  const sprint1Id = await createSprint(
    workspaceId,
    lastWeek.start,
    lastWeek.end,
    [],
    [t1, t2, t4],
    userId
  );

  const sprint2Id = await createSprint(
    workspaceId,
    thisWeek.start,
    thisWeek.end,
    [],
    [t3, t5, t6],
    userId
  );

  // Mark some tasks as done so demo shows progress
  await updateTask(t1, { status: "done" });
  await updateTask(t2, { status: "done" });
  await updateTask(t4, { status: "done" });

  await createValidationEntry(
    workspaceId,
    sprint1Id,
    m2,
    "interview",
    "Users want simpler onboarding",
    "5 interviews done; common theme: reduce signup steps.",
    userId
  );

  await createValidationEntry(
    workspaceId,
    sprint1Id,
    m1,
    "experiment",
    "Landing page A/B test",
    "Variant B had 12% higher signup.",
    userId
  );

  return workspaceId;
}
