import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Circle,
  Plus,
  Video,
  FileSearch,
  Users2,
  Package,
  FileText,
  Clock,
  AlertTriangle,
  X,
  ChevronDown,
} from 'lucide-react';
import { useCommandDeckStore } from '@/store/useCommandDeckStore';
import { useIntelClient } from '@/services/api/intelClient';
import type { InvestigativeTask, TaskType, TaskPriority, TaskStatus, FIRCase } from '@kestrel/shared';

interface ShiftTaskListProps {
  cases: FIRCase[];
}

export function ShiftTaskList({ cases }: ShiftTaskListProps) {
  const activeOfficerId = useCommandDeckStore((s) => s.activeOfficerId);
  const isOfflineMode = useCommandDeckStore((s) => s.isOfflineMode);
  const openCaseNexus = useCommandDeckStore((s) => s.openCaseNexus);
  const client = useIntelClient();
  const queryClient = useQueryClient();

  // Filter state: 'all' | 'pending' | 'completed'
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isAdding, setIsAdding] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<TaskType>('Forensic');
  const [newPriority, setNewPriority] = useState<TaskPriority>('High');
  const [newCaseId, setNewCaseId] = useState<string>(cases[0]?.id || 'CASE-2024-INDR-0102');
  const [newNotes, setNewNotes] = useState('');

  // Load shift tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', activeOfficerId, isOfflineMode],
    queryFn: () => {
      if (activeOfficerId) {
        return client.getTasks({ officerId: activeOfficerId });
      }
      return client.getTasks();
    },
  });

  // Mutate task completion
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      client.updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Mutate new task creation
  const createMutation = useMutation({
    mutationFn: (taskData: Omit<InvestigativeTask, 'id' | 'createdAt'>) =>
      client.createTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsAdding(false);
      setNewTitle('');
      setNewNotes('');
    },
  });

  const handleToggleTask = (task: InvestigativeTask) => {
    const nextStatus: TaskStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    updateMutation.mutate({ id: task.id, status: nextStatus });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    createMutation.mutate({
      title: newTitle.trim(),
      caseId: newCaseId,
      assignedOfficerId: activeOfficerId || 'OFF-01',
      taskType: newTaskType,
      priority: newPriority,
      status: 'Pending',
      notes: newNotes.trim() || undefined,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return t.status !== 'Completed';
    if (filter === 'completed') return t.status === 'Completed';
    return true;
  });

  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getTaskIcon = (type: TaskType) => {
    switch (type) {
      case 'CCTV':
        return <Video className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Forensic':
        return <FileSearch className="w-3.5 h-3.5 text-amber-400" />;
      case 'Interrogation':
        return <Users2 className="w-3.5 h-3.5 text-red-400" />;
      case 'Seizure':
        return <Package className="w-3.5 h-3.5 text-purple-400" />;
      case 'Documentation':
      default:
        return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="bg-[#080f1a]/80 backdrop-blur-md rounded-xl border border-white/10 p-4 mb-6 shadow-xl">
      {/* Header & Shift Progress Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <h3 className="font-mono text-xs font-bold text-white tracking-wider uppercase">
              Shift Investigative Checklist
            </h3>
            <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800/80 border border-white/5">
              {completedCount} / {totalCount} Completed ({progressPercent}%)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Filter Tabs & Quick Add Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#050b14] p-0.5 rounded-lg border border-white/10">
            {(['all', 'pending', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider rounded-md transition-colors ${
                  filter === tab
                    ? 'bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 transition-all"
          >
            {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isAdding ? 'Cancel' : 'Quick Add'}</span>
          </button>
        </div>
      </div>

      {/* Quick Add Task Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateTask}
          className="mt-3 p-3.5 rounded-lg bg-[#050b14]/90 border border-cyan-500/30 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold text-cyan-400 uppercase tracking-wide">
              New Shift Task
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Instant Dispatch</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <input
              type="text"
              placeholder="Task title (e.g. Inspect CCTV footage from ATM...)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="md:col-span-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              autoFocus
              required
            />

            <select
              value={newCaseId}
              onChange={(e) => setNewCaseId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firNumber} - {c.crimeCategory}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2">
              {/* Type Select */}
              <select
                value={newTaskType}
                onChange={(e) => setNewTaskType(e.target.value as TaskType)}
                className="px-2.5 py-1 rounded bg-slate-900 border border-white/10 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-cyan-400"
              >
                <option value="Forensic">Forensic / FSL</option>
                <option value="CCTV">CCTV Surveillance</option>
                <option value="Interrogation">Interrogation</option>
                <option value="Seizure">Seizure Memo</option>
                <option value="Documentation">180 BNSS / Docs</option>
              </select>

              {/* Priority Select */}
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="px-2.5 py-1 rounded bg-slate-900 border border-white/10 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-cyan-400"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending || !newTitle.trim()}
              className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs font-mono transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? 'Adding...' : 'Add to Checklist'}
            </button>
          </div>
        </form>
      )}

      {/* Task List Items */}
      <div className="mt-3 divide-y divide-white/5">
        {isLoading ? (
          <div className="py-6 text-center text-xs font-mono text-slate-500">
            Loading shift tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-slate-500">
            No shift tasks match this filter.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'Completed';
            const matchedCase = cases.find((c) => c.id === task.caseId);

            return (
              <div
                key={task.id}
                className={`py-2.5 px-2 rounded-lg flex items-start gap-3 transition-colors ${
                  isCompleted ? 'opacity-50 hover:opacity-75' : 'hover:bg-white/[0.02]'
                }`}
              >
                {/* 1-Click Interactive Checkbox */}
                <button
                  type="button"
                  onClick={() => handleToggleTask(task)}
                  className="mt-0.5 text-slate-400 hover:text-cyan-400 transition-colors flex-shrink-0"
                  title={isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 hover:text-cyan-400" />
                  )}
                </button>

                {/* Task Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-xs font-medium leading-tight ${
                        isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Task Type Badge */}
                    <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 text-slate-300">
                      {getTaskIcon(task.taskType)}
                      {task.taskType}
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                        task.priority === 'Critical'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : task.priority === 'High'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  {/* Notes / Due Date / Case Link */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                    {matchedCase && (
                      <button
                        type="button"
                        onClick={() => openCaseNexus(matchedCase.id)}
                        className="text-cyan-400 hover:text-cyan-300 font-mono text-[10px] underline underline-offset-2"
                      >
                        {matchedCase.firNumber}
                      </button>
                    )}

                    {task.notes && <span className="text-slate-400 truncate">· {task.notes}</span>}

                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono ml-auto">
                        <Clock className="w-3 h-3" />
                        Due: {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
