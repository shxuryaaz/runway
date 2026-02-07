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
  type: "weak_signal" | "missing_validation" | "trend" | "no_external_feedback" | "low_external_confidence";
  title: string;
  description: string;
  milestoneId?: string;
}

export interface InvestorSummary {
  problem: string;
  solution: string;
  traction: string;
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

/** Highlight weak or missing validation. Rule-based only; no AI analysis. */
export function getValidationInsights(
  milestones: Milestone[],
  validations: ValidationEntry[],
  _sprints: Sprint[]
): ValidationInsight[] {
  const insights: ValidationInsight[] = [];
  const activeMilestones = milestones.filter((m) => m.status === "active" || m.status === "completed");

  for (const m of activeMilestones) {
    const forMilestone = validations.filter((v) => v.milestoneId === m.id);
    const external = forMilestone.filter((v) => v.origin === "external_link");
    const internal = forMilestone.filter((v) => v.origin !== "external_link");

    if (forMilestone.length === 0) {
      insights.push({
        id: `missing-${m.id}`,
        type: "missing_validation",
        title: "No validation recorded",
        description: `"${m.title}" has no feedback logged. Add validation or share the validation link to collect external evidence.`,
        milestoneId: m.id,
      });
    } else if (external.length === 0) {
      insights.push({
        id: `no-external-${m.id}`,
        type: "no_external_feedback",
        title: "Validation risk: No external feedback collected yet",
        description: `"${m.title}" has only internal notes. Share the validation link to collect external feedback and strengthen evidence.`,
        milestoneId: m.id,
      });
    } else {
      const withScore = external.filter((v) => v.confidenceScore != null);
      const avgConfidence =
        withScore.length > 0
          ? withScore.reduce((a, v) => a + (v.confidenceScore ?? 0), 0) / withScore.length
          : null;
      if (avgConfidence !== null && avgConfidence < 3) {
        insights.push({
          id: `low-confidence-${m.id}`,
          type: "low_external_confidence",
          title: "Weak validation signal: External confidence is low",
          description: `"${m.title}" has external feedback but average confidence is ${avgConfidence.toFixed(1)}/5. Consider iterating or gathering more evidence.`,
          milestoneId: m.id,
        });
      }
    }

    if (forMilestone.length === 1 && insights.filter((i) => i.milestoneId === m.id).length === 0) {
      insights.push({
        id: `weak-${m.id}`,
        type: "weak_signal",
        title: "Single validation source",
        description: `"${m.title}" has only one validation entry. Multiple sources strengthen signal.`,
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

  const tractionParts: string[] = [];
  tractionParts.push(`${doneTasks}/${totalTasks} tasks completed (${taskPct}%)`);
  tractionParts.push(`${completedMilestones.length}/${milestones.length} milestones completed`);
  tractionParts.push(`${completedSprints.length} sprints closed with ${avgCompletion}% avg completion`);
  if (validations.length > 0) tractionParts.push(`${validations.length} validation entries (interviews/surveys/experiments)`);

  return {
    problem: `${workspaceName} is in ${stage} stage, focused on validating product-market fit and scaling execution discipline.`,
    solution: `Unified operational workspace for ${workspaceName}: execution tracking (milestones, tasks, sprints), structured validation (interviews, surveys, experiments), and verifiable progress via sprint commitments and completion records.`,
    traction: tractionParts.join(". ") || "Early stage; tracking execution and validation from first sprint.",
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
