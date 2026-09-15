
import crypto from 'crypto';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

const IS_PROD = process.env.NODE_ENV === 'production';

export function issueCsrfToken(req, res, next) {
  let token = req.cookies?.[CSRF_COOKIE];
  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: IS_PROD,
      sameSite: IS_PROD ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30,
      path: '/',
    });
  }
  req.csrfToken = token;
  next();
}

export function verifyCsrf(req, res, next) {
  if (SAFE_METHODS.includes(req.method)) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) {
    return res.status(403).json({ error: 'CSRF token missing' });
  }
  if (cookieToken.length !== headerToken.length) {
    return res.status(403).json({ error: 'CSRF token mismatch' });
  }
  const ok = crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
  if (!ok) return res.status(403).json({ error: 'CSRF token invalid' });

  next();
}