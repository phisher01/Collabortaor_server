/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Task, { TaskStatus } from '../models/Task';

const VALID_STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done'];

function isValidStatus(s: unknown): s is TaskStatus {
  return typeof s === 'string' && VALID_STATUSES.includes(s as TaskStatus);
}

interface PopulatedUser {
  _id: mongoose.Types.ObjectId;
  name: string;
}

interface TaskResponse {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdBy: { id: string; name: string } | null;
  assignedTo: { id: string; name: string } | null;
}

function toTaskResponse(t: {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  createdBy?: PopulatedUser | mongoose.Types.ObjectId | null;
  assignedTo?: PopulatedUser | mongoose.Types.ObjectId | null;
}): TaskResponse {
  const createdBy = t.createdBy && typeof t.createdBy === 'object' && 'name' in t.createdBy
    ? { id: (t.createdBy as PopulatedUser)._id.toString(), name: (t.createdBy as PopulatedUser).name }
    : null;
  const assignedTo = t.assignedTo && typeof t.assignedTo === 'object' && 'name' in t.assignedTo
    ? { id: (t.assignedTo as PopulatedUser)._id.toString(), name: (t.assignedTo as PopulatedUser).name }
    : null;
  return {
    id: t._id.toString(),
    title: t.title,
    description: t.description ?? '',
    status: t.status,
    createdBy,
    assignedTo,
  };
}

/** GET /api/tasks — tasks created by or assigned to the current user. Query: ?status=todo|in-progress|done & ?title=substring */
export async function list(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const filter: Record<string, unknown> = {
      $or: [{ createdBy: userId }, { assignedTo: userId }],
    };
    const { status, title } = req.query;
    if (status && isValidStatus(status)) {
      filter.status = status;
    }
    if (title && typeof title === 'string' && title.trim()) {
      filter.title = { $regex: title.trim(), $options: 'i' };
    }
    const tasks = await Task.find(filter)
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name')
      .lean()
      .exec();
    const mapped = tasks.map((t) => toTaskResponse(t as Parameters<typeof toTaskResponse>[0]));
    res.json(mapped);
  } catch (err) {
    console.error('Tasks list error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
}

/** POST /api/tasks — create task; createdBy = req.user.id */
export async function create(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { title, description, status, assignedTo } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'Title is required.' });
      return;
    }
    const taskStatus: TaskStatus = isValidStatus(status) ? status : 'todo';
    const doc: Record<string, unknown> = {
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      status: taskStatus,
      createdBy: new mongoose.Types.ObjectId(req.user.id),
    };
    if (assignedTo != null && mongoose.isValidObjectId(assignedTo)) {
      doc.assignedTo = new mongoose.Types.ObjectId(assignedTo);
    }
    const task = await Task.create(doc);
    const created = await Task.findById(task._id)
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name')
      .lean()
      .exec();
    if (!created) {
      res.status(201).json(toTaskResponse({ _id: task._id, title: task.title, description: task.description, status: task.status, createdBy: null, assignedTo: null }));
      return;
    }
    res.status(201).json(toTaskResponse(created as Parameters<typeof toTaskResponse>[0]));
  } catch (err) {
    console.error('Task create error:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
}

/** PATCH /api/tasks/:id — update only if task.createdBy === req.user.id */
export async function update(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      res.status(400).json({ error: 'Invalid task id.' });
      return;
    }
    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }
    if (task.createdBy.toString() !== req.user.id) {
      res.status(403).json({ error: 'Only the creator can edit this task.' });
      return;
    }
    const { title, description, status, assignedTo } = req.body;
    if (typeof title === 'string' && title.trim()) task.title = title.trim();
    if (description !== undefined) task.description = typeof description === 'string' ? description.trim() : '';
    if (isValidStatus(status)) task.status = status;
    if (assignedTo !== undefined) {
      task.assignedTo = assignedTo == null || assignedTo === '' ? undefined : new mongoose.Types.ObjectId(assignedTo);
    }
    await task.save();
    const updated = await Task.findById(task._id)
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name')
      .lean()
      .exec();
    if (!updated) {
      res.json(toTaskResponse({ _id: task._id, title: task.title, description: task.description, status: task.status, createdBy: null, assignedTo: null }));
      return;
    }
    res.json(toTaskResponse(updated as Parameters<typeof toTaskResponse>[0]));
  } catch (err) {
    console.error('Task update error:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
}

/** DELETE /api/tasks/:id — only if task.createdBy === req.user.id */
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      res.status(400).json({ error: 'Invalid task id.' });
      return;
    }
    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }
    if (task.createdBy.toString() !== req.user.id) {
      res.status(403).json({ error: 'Only the creator can delete this task.' });
      return;
    }
    await Task.findByIdAndDelete(id);
    res.status(204).send();
  } catch (err) {
    console.error('Task delete error:', err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
}
