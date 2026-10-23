import { Router } from 'express';
import { db } from '../db';
import { investigativeTasks } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { ApiResponse, InvestigativeTask, TaskStatus, TaskPriority, TaskType } from '@kestrel/shared';

export const tasksRouter = Router();

// Fallback seed tasks for in-memory / zero-network resilience
const DEFAULT_FALLBACK_TASKS: InvestigativeTask[] = [
  {
    id: 'TASK-001',
    caseId: 'CASE-2024-INDR-0102',
    assignedOfficerId: 'OFF-01',
    title: 'Obtain 12th Main Indiranagar CCTV footage from Axis Bank ATM',
    taskType: 'CCTV',
    priority: 'Critical',
    status: 'Completed',
    dueDate: '2024-03-16T12:00:00Z',
    completedAt: '2024-03-16T10:45:00Z',
    notes: 'Footage collected on USB drive and tagged as evidence EV-001.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TASK-002',
    caseId: 'CASE-2024-INDR-0102',
    assignedOfficerId: 'OFF-01',
    title: 'Dispatch seized 7.65mm shell casings to Madiwala FSL Ballistics Division',
    taskType: 'Forensic',
    priority: 'Critical',
    status: 'In Progress',
    dueDate: '2024-03-18T18:00:00Z',
    notes: 'Awaiting preliminary ballistic comparison with country pistol seized in Whitefield case.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TASK-003',
    caseId: 'CASE-2024-INDR-0102',
    assignedOfficerId: 'OFF-01',
    title: 'Record Section 180 BNSS statement of eyewitness Smt. Jayalakshmi',
    taskType: 'Documentation',
    priority: 'High',
    status: 'Pending',
    dueDate: '2024-03-19T14:00:00Z',
    notes: 'Witness scheduled to appear at Indiranagar PS at 11:00 AM.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TASK-004',
    caseId: 'CASE-2024-INDR-0102',
    assignedOfficerId: 'OFF-01',
    title: 'Execute formal seizure memo for black Bajaj Pulsar (KA-04-E-1234)',
    taskType: 'Seizure',
    priority: 'High',
    status: 'Completed',
    dueDate: '2024-03-16T16:00:00Z',
    completedAt: '2024-03-16T15:30:00Z',
    notes: 'Vehicle impounded under PF 44/2024 and parked at PS yard.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TASK-005',
    caseId: 'CASE-2024-INDR-0102',
    assignedOfficerId: 'OFF-01',
    title: 'Interrogate co-accused Deepak Kumar @ Bullet Deepu regarding firearm source',
    taskType: 'Interrogation',
    priority: 'High',
    status: 'Pending',
    dueDate: '2024-03-20T17:00:00Z',
    notes: 'Focus on supply trail linking country-made pistol to Kalasipalya workshop.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TASK-006',
    caseId: 'CASE-2024-KRP-0215',
    assignedOfficerId: 'OFF-02',
    title: 'Request tower CDR dump for Old Madras Road junction during midnight heist',
    taskType: 'Forensic',
    priority: 'Critical',
    status: 'In Progress',
    dueDate: '2024-03-21T18:00:00Z',
    notes: 'Awaiting nodal officer response for Airtel and Jio cell IDs.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TASK-007',
    caseId: 'CASE-2024-KRP-0215',
    assignedOfficerId: 'OFF-02',
    title: 'Raid suspected chop shop in B.Channasandra (Syed Imran residence)',
    taskType: 'Seizure',
    priority: 'High',
    status: 'Pending',
    dueDate: '2024-03-22T06:00:00Z',
    notes: 'Search warrant approved by ACMM court.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TASK-008',
    caseId: 'CASE-2024-KORM-0088',
    assignedOfficerId: 'OFF-01',
    title: 'Inspect Ejipura Main Road jewellery store safe for tool-mark forensics',
    taskType: 'Forensic',
    priority: 'High',
    status: 'Completed',
    dueDate: '2024-03-14T15:00:00Z',
    completedAt: '2024-03-14T14:10:00Z',
    notes: 'Gas cutter marks matched industrial acetylene torches.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TASK-009',
    caseId: 'CASE-2024-KORM-0088',
    assignedOfficerId: 'OFF-01',
    title: 'File proclamation warrant under Sec 84 BNSS against Manjunath @ Blade Manja',
    taskType: 'Documentation',
    priority: 'Medium',
    status: 'In Progress',
    dueDate: '2024-03-23T11:00:00Z',
    notes: 'Accused absconding from known Ejipura address.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TASK-010',
    caseId: 'CASE-2024-WF-0301',
    assignedOfficerId: 'OFF-03',
    title: 'Trace cryptocurrency wallet transactions to mule bank accounts',
    taskType: 'Forensic',
    priority: 'Critical',
    status: 'In Progress',
    dueDate: '2024-03-22T19:00:00Z',
    notes: 'Tether USDT outbound transfers traced to overseas exchanges.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TASK-011',
    caseId: 'CASE-2024-WF-0301',
    assignedOfficerId: 'OFF-03',
    title: 'Summon bank branch manager under 94 BNSS for KYC documents',
    taskType: 'Documentation',
    priority: 'High',
    status: 'Completed',
    dueDate: '2024-03-17T16:00:00Z',
    completedAt: '2024-03-17T15:00:00Z',
    notes: 'KYC verified fraudulent identities with forged Aadhaar cards.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TASK-012',
    caseId: 'CASE-2024-WF-0301',
    assignedOfficerId: 'OFF-03',
    title: 'Execute freeze order under Sec 106 BNSS on 4 mule ICICI accounts',
    taskType: 'Seizure',
    priority: 'Critical',
    status: 'Completed',
    dueDate: '2024-03-18T10:00:00Z',
    completedAt: '2024-03-18T09:30:00Z',
    notes: 'INR 18,50,000 successfully lien-marked.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TASK-013',
    caseId: 'CASE-2024-CUB-0044',
    assignedOfficerId: 'OFF-04',
    title: 'Retrieve Lavelle Road traffic junction PTZ camera recordings',
    taskType: 'CCTV',
    priority: 'High',
    status: 'Completed',
    dueDate: '2024-03-15T18:00:00Z',
    completedAt: '2024-03-15T17:20:00Z',
    notes: 'Getaway vehicle Honda City (KA-03-Z-8899) identified.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TASK-014',
    caseId: 'CASE-2024-CUB-0044',
    assignedOfficerId: 'OFF-04',
    title: 'Conduct interrogation of Kiran Gowda @ Shadow at Central Prison Parappana Agrahara',
    taskType: 'Interrogation',
    priority: 'Critical',
    status: 'In Progress',
    dueDate: '2024-03-21T15:00:00Z',
    notes: 'Body warrant obtained from 1st ACMM Court.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TASK-015',
    caseId: 'CASE-2024-CUB-0044',
    assignedOfficerId: 'OFF-04',
    title: 'Draft statutory charge-sheet for Section 305 / 331(4) BNS violations',
    taskType: 'Documentation',
    priority: 'Medium',
    status: 'Pending',
    dueDate: '2024-03-25T17:00:00Z',
    notes: 'Review draft with Assistant Public Prosecutor.',
    createdAt: new Date().toISOString()
  }
];

// Helper to filter in-memory tasks
function filterFallbackTasks(params: {
  caseId?: string;
  officerId?: string;
  status?: string;
  priority?: string;
}): InvestigativeTask[] {
  return DEFAULT_FALLBACK_TASKS.filter((t) => {
    if (params.caseId && t.caseId !== params.caseId) return false;
    if (params.officerId && t.assignedOfficerId !== params.officerId) return false;
    if (params.status && t.status !== params.status) return false;
    if (params.priority && t.priority !== params.priority) return false;
    return true;
  });
}

// GET /api/tasks?caseId=...&officerId=...&status=...&priority=...
tasksRouter.get('/', async (req, res) => {
  const { caseId, officerId, status, priority } = req.query;

  try {
    const conditions = [];

    if (caseId) {
      conditions.push(eq(investigativeTasks.caseId, String(caseId)));
    }
    if (officerId) {
      conditions.push(eq(investigativeTasks.assignedOfficerId, String(officerId)));
    }
    if (status) {
      conditions.push(eq(investigativeTasks.status, String(status)));
    }
    if (priority) {
      conditions.push(eq(investigativeTasks.priority, String(priority)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(investigativeTasks)
      .where(whereClause)
      .orderBy(desc(investigativeTasks.createdAt));

    if (!rows || rows.length === 0) {
      const fallbackList = filterFallbackTasks({
        caseId: caseId ? String(caseId) : undefined,
        officerId: officerId ? String(officerId) : undefined,
        status: status ? String(status) : undefined,
        priority: priority ? String(priority) : undefined
      });

      const response: ApiResponse<InvestigativeTask[]> = {
        success: true,
        data: fallbackList,
        meta: {
          total: fallbackList.length,
          timestamp: new Date().toISOString()
        }
      };
      res.json(response);
      return;
    }

    const tasks: InvestigativeTask[] = rows.map((r) => ({
      id: r.id,
      caseId: r.caseId,
      assignedOfficerId: r.assignedOfficerId,
      title: r.title,
      taskType: r.taskType as TaskType,
      priority: (r.priority || 'Medium') as TaskPriority,
      status: (r.status || 'Pending') as TaskStatus,
      dueDate: r.dueDate ? r.dueDate.toISOString() : null,
      completedAt: r.completedAt ? r.completedAt.toISOString() : null,
      notes: r.notes,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString()
    }));

    const response: ApiResponse<InvestigativeTask[]> = {
      success: true,
      data: tasks,
      meta: {
        total: tasks.length,
        timestamp: new Date().toISOString()
      }
    };
    res.json(response);
  } catch (error: any) {
    console.warn('[Tasks Route] DB query failed, returning fallback in-memory tasks:', error.message);
    const fallbackList = filterFallbackTasks({
      caseId: caseId ? String(caseId) : undefined,
      officerId: officerId ? String(officerId) : undefined,
      status: status ? String(status) : undefined,
      priority: priority ? String(priority) : undefined
    });

    const response: ApiResponse<InvestigativeTask[]> = {
      success: true,
      data: fallbackList,
      meta: {
        total: fallbackList.length,
        timestamp: new Date().toISOString()
      }
    };
    res.json(response);
  }
});

// POST /api/tasks - Create new investigative task
tasksRouter.post('/', async (req, res) => {
  const { caseId, assignedOfficerId, title, taskType, priority, status, dueDate, notes } = req.body;

  if (!title || !taskType) {
    res.status(400).json({ success: false, error: 'Title and taskType are required' });
    return;
  }

  const taskId = `TASK-${Date.now().toString().slice(-6)}`;
  const now = new Date();

  try {
    const inserted = await db
      .insert(investigativeTasks)
      .values({
        id: taskId,
        caseId: caseId || 'CASE-2024-INDR-0102',
        assignedOfficerId: assignedOfficerId || null,
        title,
        taskType,
        priority: priority || 'Medium',
        status: status || 'Pending',
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        createdAt: now
      })
      .returning();

    if (inserted.length > 0) {
      const r = inserted[0];
      const task: InvestigativeTask = {
        id: r.id,
        caseId: r.caseId,
        assignedOfficerId: r.assignedOfficerId,
        title: r.title,
        taskType: r.taskType as TaskType,
        priority: (r.priority || 'Medium') as TaskPriority,
        status: (r.status || 'Pending') as TaskStatus,
        dueDate: r.dueDate ? r.dueDate.toISOString() : null,
        completedAt: r.completedAt ? r.completedAt.toISOString() : null,
        notes: r.notes,
        createdAt: r.createdAt ? r.createdAt.toISOString() : now.toISOString()
      };
      res.status(201).json({ success: true, data: task });
      return;
    }
  } catch (error: any) {
    console.warn('[Tasks Route] DB insert failed, saving to fallback tasks:', error.message);
  }

  // Fallback in-memory insertion
  const fallbackTask: InvestigativeTask = {
    id: taskId,
    caseId: caseId || 'CASE-2024-INDR-0102',
    assignedOfficerId: assignedOfficerId || null,
    title,
    taskType,
    priority: priority || 'Medium',
    status: status || 'Pending',
    dueDate: dueDate || null,
    completedAt: null,
    notes: notes || null,
    createdAt: now.toISOString()
  };
  DEFAULT_FALLBACK_TASKS.unshift(fallbackTask);
  res.status(201).json({ success: true, data: fallbackTask });
});

// PATCH /api/tasks/:id - Update task status or notes
tasksRouter.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, notes, completedAt } = req.body;

  try {
    const updateValues: Record<string, any> = {};

    if (status !== undefined) {
      updateValues.status = status;
      if (status === 'Completed' && !completedAt) {
        updateValues.completedAt = new Date();
      } else if (status !== 'Completed') {
        updateValues.completedAt = null;
      }
    }

    if (notes !== undefined) {
      updateValues.notes = notes;
    }

    if (completedAt !== undefined) {
      updateValues.completedAt = completedAt ? new Date(completedAt) : null;
    }

    const updated = await db
      .update(investigativeTasks)
      .set(updateValues)
      .where(eq(investigativeTasks.id, id))
      .returning();

    if (updated.length > 0) {
      const r = updated[0];
      const task: InvestigativeTask = {
        id: r.id,
        caseId: r.caseId,
        assignedOfficerId: r.assignedOfficerId,
        title: r.title,
        taskType: r.taskType as TaskType,
        priority: (r.priority || 'Medium') as TaskPriority,
        status: (r.status || 'Pending') as TaskStatus,
        dueDate: r.dueDate ? r.dueDate.toISOString() : null,
        completedAt: r.completedAt ? r.completedAt.toISOString() : null,
        notes: r.notes,
        createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString()
      };

      const response: ApiResponse<InvestigativeTask> = {
        success: true,
        data: task,
        meta: { timestamp: new Date().toISOString() }
      };
      res.json(response);
      return;
    }

    // Fallback: search in-memory array and update in place
    const fallbackItem = DEFAULT_FALLBACK_TASKS.find((t) => t.id === id);
    if (!fallbackItem) {
      res.status(404).json({ success: false, error: `Task with id '${id}' not found` });
      return;
    }

    if (status !== undefined) fallbackItem.status = status;
    if (notes !== undefined) fallbackItem.notes = notes;
    if (status === 'Completed') fallbackItem.completedAt = new Date().toISOString();

    const response: ApiResponse<InvestigativeTask> = {
      success: true,
      data: fallbackItem,
      meta: { timestamp: new Date().toISOString() }
    };
    res.json(response);
  } catch (error: any) {
    console.warn('[Tasks Route] DB update failed, updating in-memory item:', error.message);
    const fallbackItem = DEFAULT_FALLBACK_TASKS.find((t) => t.id === id);
    if (!fallbackItem) {
      res.status(404).json({ success: false, error: `Task with id '${id}' not found` });
      return;
    }

    if (status !== undefined) fallbackItem.status = status;
    if (notes !== undefined) fallbackItem.notes = notes;
    if (status === 'Completed') fallbackItem.completedAt = new Date().toISOString();

    const response: ApiResponse<InvestigativeTask> = {
      success: true,
      data: fallbackItem,
      meta: { timestamp: new Date().toISOString() }
    };
    res.json(response);
  }
});
