/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import User from '../models/User';

/** GET /api/users — list users for assign dropdown (id, name, email) */
export async function list(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const users = await User.find().select('name email').lean().exec();
    const list = users.map((u) => ({
      id: (u._id as { toString: () => string }).toString(),
      name: u.name,
      email: u.email,
    }));
    res.json(list);
  } catch (err) {
    console.error('Users list error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
}
