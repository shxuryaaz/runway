"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getWorkspace,
  getSprints,
  getMilestones,
  getTasksForWorkspace,
  getValidationsForWorkspace,
} from "@/lib/firestore";
import type { StartupWorkspace, Sprint, Milestone, Task, ValidationEntry } from "@/lib/types";

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

  const primaryColor = "#137fec";

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
        {tasksChartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Create and use sprints to see completion over time.</p>
          </div>
        ) : (
          <>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={{ stroke: "#d1d5db" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                    formatter={(value: number, _name: string, props: { payload: { completed?: number; total?: number } }) => {
                      const p = props.payload;
                      return [`${value}%${p.total != null ? ` (${p.completed}/${p.total} tasks)` : ""}`, "Completion"];
                    }}
                    labelFormatter={(_, payload) => payload[0]?.payload?.fullLabel ?? ""}
                  />
                  <Bar dataKey="pct" name="Completion" fill={primaryColor} radius={[4, 4, 0, 0]} maxBarSize={56} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-400 mt-2">% of tasks done per sprint (last 6 sprints)</p>
          </>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="font-bold text-lg mb-6">Validation activity per sprint</h3>
        {validationsChartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Sprint data will appear here once you have sprints.</p>
          </div>
        ) : (
          <>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={validationsChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={{ stroke: "#d1d5db" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                    formatter={(value: number) => [`${value}`, "validations"]}
                    labelFormatter={(_, payload) => payload[0]?.payload?.fullLabel ?? ""}
                  />
                  <Bar dataKey="count" name="Validations" fill={primaryColor} radius={[4, 4, 0, 0]} maxBarSize={56} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-400 mt-2">Validation entries per sprint (last 6 sprints)</p>
          </>
        )}
      </div>
    </div>
  );
}
