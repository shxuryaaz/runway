/**
 * AI layer: rule-based assistive insights. No external LLM.
 * TODO: Replace with real AI/LLM for production.
 */

import type { Milestone, Task, Sprint, ValidationEntry } from "./types";

export interface ExecutionInsight {
  id: string;
  type: "stalled_milestone" | "repeated_blocker" | "risk";
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  milestoneId?: string;
  taskIds?: string[];
}

export interface ValidationInsight {
  id: string;
  type: "weak_signal" | "missing_validation" | "trend";
  title: string;
  description: string;
  milestoneId?: string;
}

export interface InvestorSummary {
  problem: string;
  executionProgress: string;
  validationStatus: string;
  roadmap: string;
  generatedAt: number;
}

/** Detect stalled milestones (active but no progress or old tasks). */
export function getExecutionInsights(
  milestones: Milestone[],
  tasks: Task[],
  sprints: Sprint[]
): ExecutionInsight[] {
  const insights: ExecutionInsight[] = [];
  const now = Date.now();
  const staleMs = 14 * 24 * 60 * 60 * 1000; // 14 days

  for (const m of milestones) {
    if (m.status !== "active") continue;
    const milestoneTasks = tasks.filter((t) => t.milestoneId === m.id);
    const doneCount = milestoneTasks.filter((t) => t.status === "done").length;
    const total = milestoneTasks.length;
    const progress = total ? (doneCount / total) * 100 : 0;
    if (progress < 20 && total >= 2) {
      insights.push({
        id: `stalled-${m.id}`,
        type: "stalled_milestone",
        title: "Milestone progressing slowly",
        description: `"${m.title}" has low task completion (${Math.round(progress)}%). Consider reprioritizing or unblocking tasks.`,
        severity: "medium",
        milestoneId: m.id,
        taskIds: milestoneTasks.map((t) => t.id),
      });
    }
    const lastUpdate = Math.max(
      ...milestoneTasks.map((t) => t.updatedAt),
      0
    );
    if (lastUpdate && now - lastUpdate > staleMs && milestoneTasks.some((t) => t.status !== "done")) {
      insights.push({
        id: `stale-${m.id}`,
        type: "repeated_blocker",
        title: "No recent activity",
        description: `"${m.title}" has had no task updates in over two weeks. Tasks may be blocked.`,
        severity: "high",
        milestoneId: m.id,
      });
    }
  }

  const completedSprints = sprints.filter((s) => s.completed && s.completionStats);
  const lowCompletion = completedSprints.filter(
    (s) => s.completionStats && s.completionStats.completionPercentage < 50
  );
  if (lowCompletion.length >= 2) {
    insights.push({
      id: "sprint-reliability",
      type: "risk",
      title: "Sprint completion rate low",
      description: `${lowCompletion.length} of the last sprints completed below 50%. Consider smaller goals or addressing blockers.`,
      severity: "high",
    });
  }

  return insights;
}

/** Highlight weak or missing validation. */
export function getValidationInsights(
  milestones: Milestone[],
  validations: ValidationEntry[],
  sprints: Sprint[]
): ValidationInsight[] {
  const insights: ValidationInsight[] = [];
  const activeMilestones = milestones.filter((m) => m.status === "active" || m.status === "completed");

  for (const m of activeMilestones) {
    const count = validations.filter((v) => v.milestoneId === m.id).length;
    if (count === 0) {
      insights.push({
        id: `missing-${m.id}`,
        type: "missing_validation",
        title: "No validation recorded",
        description: `"${m.title}" has no customer interviews, surveys, or experiments logged. Add validation to de-risk the roadmap.`,
        milestoneId: m.id,
      });
    } else if (count === 1) {
      insights.push({
        id: `weak-${m.id}`,
        type: "weak_signal",
        title: "Single validation source",
        description: `"${m.title}" has only one validation entry. Multiple sources (e.g. interviews + survey) strengthen signal.`,
        milestoneId: m.id,
      });
    }
  }

  return insights;
}

/** Generate investor-ready summary (rule-based). */
export function generateInvestorSummary(
  workspaceName: string,
  stage: string,
  milestones: Milestone[],
  tasks: Task[],
  validations: ValidationEntry[],
  sprints: Sprint[]
): InvestorSummary {
  const completedMilestones = milestones.filter((m) => m.status === "completed");
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const taskPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const completedSprints = sprints.filter((s) => s.completed);
  const avgCompletion =
    completedSprints.length > 0 && completedSprints.every((s) => s.completionStats)
      ? Math.round(
          completedSprints.reduce((a, s) => a + (s.completionStats!.completionPercentage ?? 0), 0) /
            completedSprints.length
        )
      : 0;

  return {
    problem: `${workspaceName} is in ${stage} stage, focused on validating product-market fit and scaling execution discipline.`,
    executionProgress: `${completedMilestones.length} milestones completed. ${doneTasks}/${totalTasks} tasks done (${taskPct}%). Sprint reliability: ${avgCompletion}% average completion.`,
    validationStatus:
      validations.length > 0
        ? `${validations.length} validation entries (interviews, surveys, experiments) recorded across milestones.`
        : "Validation pipeline in setup; no entries yet. Recommend adding customer interviews and experiment logs.",
    roadmap: milestones
      .filter((m) => m.status !== "completed")
      .slice(0, 5)
      .map((m) => m.title)
      .join(" → ") || "No upcoming milestones defined.",
    generatedAt: Date.now(),
  };
}
