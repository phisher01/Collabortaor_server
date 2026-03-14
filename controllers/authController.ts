/**
 * Auth API logic only. Bearer token verification is done by middleware (verifyBearer), not here.
 */
import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as string;

function signToken(id: string, email: string): string {
  return jwt.sign(
    { id, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  );
}

function sanitizeUser(user: { _id: unknown; email: string; name: string }) {
  return {
    id: (user._id as { toString: () => string }).toString(),
    email: user.email,
    name: user.name,
  };
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required.' });
      return;
    }
    if (typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }
    const existing = await User.findOne({ email: (email as string).trim().toLowerCase() });
    if (existing) {
      res.status(400).json({ error: 'User with this email already exists.' });
      return;
    }
    const user = await User.create({
      email: (email as string).trim().toLowerCase(),
      password,
      name: (name as string).trim(),
    });
    const payload = sanitizeUser(user);
    const token = signToken(payload.id, payload.email);
    res.status(201).json({ token, user: payload });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const user = await User.findOne({ email: (email as string).trim().toLowerCase() }).select('+password');
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const match = await user.comparePassword(password);
    if (!match) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const payload = sanitizeUser(user);
    const token = signToken(payload.id, payload.email);
    res.json({ token, user: payload });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
}
