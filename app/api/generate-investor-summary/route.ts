/**
 * Generate investor pitch outline from workspace data.
 * When OPENAI_API_KEY is set, uses GPT to generate narrative summary.
 * Otherwise returns useFallback so the client can use rule-based generation.
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { InvestorSummary } from "@/lib/ai-mock";

export interface GenerateInvestorSummaryBody {
  workspace: { name: string; stage: string };
  milestones: Array<{ title: string; description: string; status: string; progressPercentage: number; taskIds: string[] }>;
  tasks: Array<{ title: string; status: string; milestoneId: string }>;
  validations: Array<{ type: string; summary: string; qualitativeNotes: string; milestoneId: string }>;
  sprints: Array<{
    weekStartDate: string;
    weekEndDate: string;
    goals: Array<{ text: string }>;
    taskIds: string[];
    locked: boolean;
    completed: boolean;
    completionStats: { tasksCompleted: number; tasksTotal: number; completionPercentage: number } | null;
  }>;
}

const SYSTEM_PROMPT = `You are an expert at turning startup execution data into a concise investor-ready pitch outline.
You will receive structured data: workspace name and stage, milestones, tasks, validations, and sprints.
Write 2-4 sentences per section. Be specific and use the actual milestone/task names and numbers where relevant.
Do not invent data that is not present; if something is missing, say so briefly.
Output valid JSON only, no markdown or explanation.

Output format (exact keys):
{
  "problem": "string - what problem does this startup address (infer from name/stage/milestones if needed)",
  "solution": "string - what they build / how they solve it",
  "traction": "string - overall traction narrative using task/milestone/sprint completion and validation counts",
  "executionProgress": "string - short bullet on execution: milestones completed, tasks done, sprint reliability",
  "validationStatus": "string - short bullet on validation: interviews/surveys/experiments or 'no entries yet'",
  "roadmap": "string - upcoming milestones and next steps, use actual milestone titles when available"
}`;

async function generateWithOpenAI(body: GenerateInvestorSummaryBody): Promise<InvestorSummary> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const { workspace, milestones, tasks, validations, sprints } = body;

  const completedMilestones = milestones.filter((m) => m.status === "completed");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const completedSprints = sprints.filter((s) => s.completed);
  const avgCompletion =
    completedSprints.length > 0 && completedSprints.every((s) => s.completionStats)
      ? Math.round(
          completedSprints.reduce((a, s) => a + (s.completionStats!.completionPercentage ?? 0), 0) /
            completedSprints.length
        )
      : 0;

  const dataBlob = [
    `Workspace: ${workspace.name} (stage: ${workspace.stage})`,
    "",
    "Milestones:",
    ...milestones.map(
      (m) => `- ${m.title} (${m.status}, ${m.progressPercentage}%)${m.description ? `: ${m.description.slice(0, 150)}` : ""}`
    ),
    "",
    "Tasks (sample):",
    ...tasks.slice(0, 30).map((t) => `- ${t.title} [${t.status}]`),
    ...(tasks.length > 30 ? [`... and ${tasks.length - 30} more tasks`] : []),
    "",
    "Validations:",
    ...(validations.length
      ? validations.map((v) => `- ${v.type}: ${v.summary.slice(0, 120)}${v.qualitativeNotes ? ` | ${v.qualitativeNotes.slice(0, 80)}` : ""}`)
      : ["None recorded."]),
    "",
    "Sprints:",
    ...sprints.slice(0, 10).map((s) => {
      const stats = s.completionStats
        ? `${s.completionStats.tasksCompleted}/${s.completionStats.tasksTotal} tasks (${s.completionStats.completionPercentage}%)`
        : "no stats";
      return `- ${s.weekStartDate}–${s.weekEndDate} | locked: ${s.locked} | completed: ${s.completed} | ${stats}`;
    }),
  ].join("\n");

  const openai = new OpenAI({ apiKey });
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Generate an investor pitch outline from this startup data:\n\n${dataBlob.slice(0, 14000)}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const raw = res.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("Empty OpenAI response");

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    problem: str(parsed.problem) || "Problem statement not provided.",
    solution: str(parsed.solution) || "Solution not provided.",
    traction: str(parsed.traction) || "Early stage; execution in progress.",
    executionProgress: str(parsed.executionProgress) || `${completedMilestones.length} milestones completed; ${doneTasks.length}/${tasks.length} tasks done; sprint avg ${avgCompletion}%.`,
    validationStatus: str(parsed.validationStatus) || (validations.length ? `${validations.length} validation entries.` : "No validation entries yet."),
    roadmap: str(parsed.roadmap) || (milestones.filter((m) => m.status !== "completed").map((m) => m.title).join(" → ") || "No upcoming milestones."),
    generatedAt: Date.now(),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateInvestorSummaryBody;
    const { workspace, milestones, tasks, validations, sprints } = body;
    if (!workspace?.name || !Array.isArray(milestones) || !Array.isArray(tasks)) {
      return NextResponse.json(
        { error: "Missing workspace, milestones, or tasks." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ useFallback: true, generatedBy: "rule-based" }, { status: 200 });
    }

    const summary = await generateWithOpenAI({
      workspace: { name: workspace.name, stage: workspace.stage ?? "Idea" },
      milestones: milestones.map((m) => ({
        title: m.title,
        description: typeof m.description === "string" ? m.description : "",
        status: m.status,
        progressPercentage: typeof m.progressPercentage === "number" ? m.progressPercentage : 0,
        taskIds: Array.isArray(m.taskIds) ? m.taskIds : [],
      })),
      tasks: tasks.map((t) => ({ title: t.title, status: t.status, milestoneId: t.milestoneId })),
      validations: Array.isArray(validations)
        ? validations.map((v) => ({
            type: v.type,
            summary: typeof v.summary === "string" ? v.summary : "",
            qualitativeNotes: typeof v.qualitativeNotes === "string" ? v.qualitativeNotes : "",
            milestoneId: v.milestoneId ?? "",
          }))
        : [],
      sprints: Array.isArray(sprints)
        ? sprints.map((s) => ({
            weekStartDate: s.weekStartDate,
            weekEndDate: s.weekEndDate,
            goals: Array.isArray(s.goals) ? s.goals : [],
            taskIds: Array.isArray(s.taskIds) ? s.taskIds : [],
            locked: Boolean(s.locked),
            completed: Boolean(s.completed),
            completionStats: s.completionStats ?? null,
          }))
        : [],
    });

    return NextResponse.json({ summary, generatedBy: "openai" });
  } catch (err) {
    console.error("generate-investor-summary:", err);
    return NextResponse.json(
      { error: "Generation failed.", useFallback: true, generatedBy: "rule-based" },
      { status: 200 }
    );
  }
}
