"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleInWorkspace } from "@/contexts/AuthContext";
import {
  getWorkspace,
  getSprints,
  getMilestones,
  getTasksForWorkspace,
  getTasksForSprint,
  createSprint,
  lockSprint,
  closeSprint,
  updateTask,
} from "@/lib/firestore";
import { addLedgerEntry } from "@/lib/firestore";
import { hashSprintCommitment, hashSprintCompletion } from "@/lib/ledger-mock";
import type { StartupWorkspace, Sprint, Milestone, Task } from "@/lib/types";

export default function SprintsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<StartupWorkspace | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [sprintTasks, setSprintTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Create sprint form
  const [showCreate, setShowCreate] = useState(false);
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [goals, setGoals] = useState([{ id: "1", text: "" }]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [locking, setLocking] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    Promise.all([
      getWorkspace(workspaceId),
      getSprints(workspaceId),
      getMilestones(workspaceId),
      getTasksForWorkspace(workspaceId),
    ]).then(([ws, sp, ms, t]) => {
      setWorkspace(ws ?? null);
      setSprints(sp);
      setMilestones(ms);
      setTasks(t);
    }).finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    if (!selectedSprint) {
      setSprintTasks([]);
      return;
    }
    getTasksForSprint(selectedSprint.id).then(setSprintTasks);
  }, [selectedSprint?.id]);

  const role = workspace ? getRoleInWorkspace(user?.uid ?? undefined, workspace.members) : null;
  const isFounder = role === "founder";
  const canWrite = role === "founder" || role === "team_member";

  const addGoal = () => setGoals((g) => [...g, { id: String(Date.now()), text: "" }]);
  const updateGoal = (id: string, text: string) => {
    setGoals((g) => g.map((x) => (x.id === id ? { ...x, text } : x)));
  };

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !workspaceId || !weekStart || !weekEnd) return;
    const goalList = goals.filter((g) => g.text.trim());
    if (goalList.length === 0) {
      alert("Add at least one sprint goal.");
      return;
    }
    setCreating(true);
    try {
      const id = await createSprint(
        workspaceId,
        weekStart,
        weekEnd,
        goalList,
        selectedTaskIds,
        user.uid
      );
      const newSprint: Sprint = {
        id,
        workspaceId,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        goals: goalList,
        taskIds: selectedTaskIds,
        locked: false,
        completed: false,
        completionStats: null,
        createdAt: Date.now(),
        createdBy: user.uid,
      };
      setSprints((s) => [newSprint, ...s]);
      setShowCreate(false);
      setWeekStart("");
      setWeekEnd("");
      setGoals([{ id: "1", text: "" }]);
      setSelectedTaskIds([]);
    } finally {
      setCreating(false);
    }
  };

  const handleLockSprint = async (sprint: Sprint) => {
    if (!user || !isFounder) return;
    setLocking(true);
    try {
      await lockSprint(sprint.id);
      const hash = hashSprintCommitment(sprint.id, sprint.goals, sprint.taskIds);
      await addLedgerEntry(workspaceId, sprint.id, "commitment", hash, `Sprint ${sprint.weekStartDate} goals committed`);
      setSprints((s) => s.map((x) => (x.id === sprint.id ? { ...x, locked: true } : x)));
      setSelectedSprint((prev) => (prev?.id === sprint.id ? { ...prev!, locked: true } : prev));
    } finally {
      setLocking(false);
    }
  };

  const handleCloseSprint = async (sprint: Sprint) => {
    if (!user || !isFounder) return;
    const st = await getTasksForSprint(sprint.id);
    const total = st.length;
    const completed = st.filter((t) => t.status === "done").length;
    const blocked = st.filter((t) => t.status !== "done").map((t) => t.id);
    const completionPercentage = total ? Math.round((completed / total) * 100) : 0;
    const missedGoalIds: string[] = []; // TODO: derive from goals vs outcomes if we had goal-level tracking
    const completionStats = {
      tasksCompleted: completed,
      tasksTotal: total,
      completionPercentage,
      blockedTaskIds: blocked,
      missedGoalIds,
      closedAt: Date.now(),
    };
    setClosing(true);
    try {
      await closeSprint(sprint.id, completionStats);
      const hash = hashSprintCompletion(
        sprint.id,
        completionPercentage,
        completed,
        total,
        blocked,
        missedGoalIds
      );
      await addLedgerEntry(workspaceId, sprint.id, "completion", hash, `Sprint ${sprint.weekStartDate} closed: ${completionPercentage}%`);
      setSprints((s) =>
        s.map((x) => (x.id === sprint.id ? { ...x, completed: true, completionStats } : x))
      );
      setSelectedSprint(null);
    } finally {
      setClosing(false);
    }
  };

  const toggleTaskInSprint = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const updateTaskStatus = async (taskId: string, status: Task["status"]) => {
    if (!canWrite) return;
    await updateTask(taskId, { status });
    setSprintTasks((t) => t.map((x) => (x.id === taskId ? { ...x, status } : x)));
    setTasks((t) => t.map((x) => (x.id === taskId ? { ...x, status } : x)));
  };

  if (loading || !workspace) {
    return (
      <div className="py-12">
        {loading ? <p className="text-gray-500">Loading…</p> : <p className="text-gray-500">Workspace not found.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#111418] dark:text-white">Sprints</h1>
        {isFounder && (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90"
          >
            New sprint
          </button>
        )}
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreateSprint}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4"
        >
          <h3 className="font-bold text-lg">Create sprint</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Week start (YYYY-MM-DD)</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Week end (YYYY-MM-DD)</label>
              <input
                type="date"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Goals</label>
            {goals.map((g) => (
              <input
                key={g.id}
                type="text"
                value={g.text}
                onChange={(e) => updateGoal(g.id, e.target.value)}
                placeholder="Sprint goal"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 mb-2"
              />
            ))}
            <button type="button" onClick={addGoal} className="text-sm text-primary font-semibold hover:underline">
              + Add goal
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Assign tasks</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {tasks.filter((t) => !t.sprintId || t.sprintId === "").map((t) => (
                <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.includes(t.id)}
                    onChange={() => toggleTaskInSprint(t.id)}
                  />
                  <span className="text-sm">{t.title}</span>
                </label>
              ))}
              {tasks.every((t) => t.sprintId) && tasks.length > 0 && (
                <p className="text-xs text-gray-500">All tasks are already in a sprint.</p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create sprint"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg h-10 px-4 bg-gray-200 dark:bg-gray-700 text-sm font-bold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="font-bold">Sprint list</h3>
          {sprints.length === 0 ? (
            <p className="text-gray-500 text-sm">No sprints yet. Create one to start the weekly loop.</p>
          ) : (
            <ul className="space-y-2">
              {sprints.map((s) => (
                <li
                  key={s.id}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    selectedSprint?.id === s.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary/30"
                  }`}
                  onClick={() => setSelectedSprint(s)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{s.weekStartDate} → {s.weekEndDate}</p>
                      <p className="text-xs text-gray-500">
                        {s.goals.length} goals · {s.taskIds.length} tasks
                        {s.locked && " · Locked"}
                        {s.completed && " · Closed"}
                      </p>
                    </div>
                    {s.completed && s.completionStats && (
                      <span className="text-sm font-bold text-primary">
                        {s.completionStats.completionPercentage}%
                      </span>
                    )}
                  </div>
                  {isFounder && !s.locked && !s.completed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLockSprint(s);
                      }}
                      disabled={locking}
                      className="mt-2 text-xs font-bold text-primary hover:underline disabled:opacity-50"
                    >
                      Lock sprint
                    </button>
                  )}
                  {isFounder && s.locked && !s.completed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseSprint(s);
                      }}
                      disabled={closing}
                      className="mt-2 text-xs font-bold text-amber-600 hover:underline disabled:opacity-50"
                    >
                      Close sprint
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-bold">Sprint tasks</h3>
          {!selectedSprint ? (
            <p className="text-gray-500 text-sm">Select a sprint to see and update tasks.</p>
          ) : (
            <ul className="space-y-2">
              {sprintTasks.length === 0 ? (
                <p className="text-gray-500 text-sm">No tasks in this sprint.</p>
              ) : (
                sprintTasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <span className="font-medium text-sm">{t.title}</span>
                    {canWrite && !selectedSprint.completed ? (
                      <select
                        value={t.status}
                        onChange={(e) => updateTaskStatus(t.id, e.target.value as Task["status"])}
                        className="text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1"
                      >
                        <option value="todo">To do</option>
                        <option value="in_progress">In progress</option>
                        <option value="done">Done</option>
                      </select>
                    ) : (
                      <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 uppercase">
                        {t.status}
                      </span>
                    )}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
