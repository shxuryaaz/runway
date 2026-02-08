"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  getWorkspace,
  getSprints,
  getMilestones,
  getTasksForWorkspace,
  getValidationsForWorkspace,
} from "@/lib/firestore";
import type { StartupWorkspace, Sprint, Milestone, Task, ValidationEntry } from "@/lib/types";

const TasksChart = dynamic(
  () => import("./AnalyticsCharts").then((m) => m.TasksChart),
  { ssr: false }
);
const ValidationsChart = dynamic(
  () => import("./AnalyticsCharts").then((m) => m.ValidationsChart),
  { ssr: false }
);

export default function AnalyticsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [workspace, setWorkspace] = useState<StartupWorkspace | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [validations, setValidations] = useState<ValidationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    Promise.all([
      getWorkspace(workspaceId),
      getSprints(workspaceId),
      getMilestones(workspaceId),
      getTasksForWorkspace(workspaceId),
      getValidationsForWorkspace(workspaceId),
    ])
      .then(([ws, sp, ms, t, v]) => {
        setWorkspace(ws ?? null);
        setSprints(sp);
        setMilestones(ms);
        setTasks(t);
        setValidations(v);
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (loading || !workspace) {
    return (
      <div className="py-12">
        {loading ? <p className="text-gray-500">Loading…</p> : <p className="text-gray-500">Workspace not found.</p>}
      </div>
    );
  }

  const completedSprints = sprints.filter((s) => s.completed && s.completionStats);
  const sprintReliability =
    completedSprints.length > 0
      ? Math.round(
          completedSprints.reduce((a, s) => a + (s.completionStats!.completionPercentage ?? 0), 0) /
            completedSprints.length
        )
      : 0;

  // Last 6 sprints by date (so charts work even before any sprint is "closed")
  const lastSprints = [...sprints]
    .sort((a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime())
    .slice(0, 6)
    .reverse();

  const tasksChartData = lastSprints.map((s) => {
    const sprintTasks = tasks.filter((t) => t.sprintId === s.id);
    const total = sprintTasks.length;
    const completed = sprintTasks.filter((t) => t.status === "done").length;
    const pct = total ? Math.round((completed / total) * 100) : (s.completionStats?.completionPercentage ?? 0);
    const label = s.weekStartDate.slice(5); // "MM-DD"
    return { name: label, pct, completed, total, fullLabel: s.weekStartDate };
  });

  const validationsChartData = lastSprints.map((s) => {
    const count = validations.filter((v) => v.sprintId === s.id).length;
    const label = s.weekStartDate.slice(5);
    return { name: label, count, fullLabel: s.weekStartDate };
  });

  const milestonesCompleted = milestones.filter((m) => m.status === "completed").length;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const taskCompletionPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-[#111418] dark:text-white">Analytics</h1>
        <p className="text-gray-500 text-sm">
          Derived from workspace execution and validation data.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-500 mb-1">Tasks completed</p>
          <p className="text-4xl font-extrabold text-primary">{doneTasks}</p>
          <p className="text-xs text-gray-400">{totalTasks} total ({taskCompletionPct}%)</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-500 mb-1">Milestones completed</p>
          <p className="text-4xl font-extrabold text-[#111418] dark:text-white">
            {milestonesCompleted}/{milestones.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-500 mb-1">Sprint reliability</p>
          <p className="text-4xl font-extrabold">{sprintReliability}%</p>
          <p className="text-xs text-gray-400">avg completion</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-500 mb-1">Validation activity</p>
          <p className="text-4xl font-extrabold text-[#111418] dark:text-white">{validations.length}</p>
          <p className="text-xs text-gray-400">entries</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="font-bold text-lg mb-6">Tasks completed over time</h3>
        <TasksChart data={tasksChartData} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="font-bold text-lg mb-6">Validation activity per sprint</h3>
        <ValidationsChart data={validationsChartData} />
      </div>
    </div>
  );
}
