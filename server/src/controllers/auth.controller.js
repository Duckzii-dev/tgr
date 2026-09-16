import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../utils/prisma.js';
import { httpError } from '../middleware/error.middleware.js';

const IS_PROD = process.env.NODE_ENV === 'production';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'lax',
  maxAge: 1000 * 60 * 60 * 24 * 30,
  path: '/',
};

function signToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name, avatarUrl: u.avatarUrl };
}

export async function register(req, res) {
  const { email, password, name } = req.body;
  if (!email || !password || password.length < 8)
    throw httpError(400, 'Invalid email or password (min 8 chars)');
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw httpError(409, 'Email already registered');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: name || email.split('@')[0] },
  });
  const token = signToken(user);
  res.cookie('token', token, COOKIE_OPTS);
  res.json({ user: publicUser(user), token });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) throw httpError(401, 'Invalid credentials');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw httpError(401, 'Invalid credentials');
  const token = signToken(user);
  res.cookie('token', token, COOKIE_OPTS);
  res.json({ user: publicUser(user), token });
}

export async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

export async function logout(_req, res) {
  res.clearCookie('token', { path: '/' });
  res.json({ ok: true });
}

export function googleStart(req, res) {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 10,
    path: '/',
  });
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

export async function googleCallback(req, res) {
  const { code, state } = req.query;
  const stored = req.cookies?.oauth_state;
  if (!code) throw httpError(400, 'Missing code');
  if (!state || state !== stored) throw httpError(400, 'Invalid OAuth state');
  res.clearCookie('oauth_state', { path: '/' });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) throw httpError(400, 'Google token exchange failed');
  const tokens = await tokenRes.json();

  const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!infoRes.ok) throw httpError(400, 'Google userinfo failed');
  const info = await infoRes.json();
  const { sub: googleId, email, name, picture, email_verified } = info;
  if (!email) throw httpError(400, 'Google account has no email');

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        googleId,
        emailVerified: !!email_verified,
        avatarUrl: picture,
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId, avatarUrl: user.avatarUrl || picture, emailVerified: true },
    });
  }

  const token = signToken(user);
  res.cookie('token', token, COOKIE_OPTS);
  const base = process.env.CLIENT_URL || 'http://localhost:5173';
  res.redirect(`${base}/auth/callback`);
}

export async function unlinkGoogle(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw httpError(404, 'Not found');
  if (!user.passwordHash) throw httpError(400, 'Set a password before unlinking Google');
  await prisma.user.update({ where: { id: user.id }, data: { googleId: null } });
  res.json({ ok: true });
}