export async function verifyTurnstile(req, res, next) {
    const secret = process.env.TURNSTILE_SECRET_KEY;
  
    // Nếu chưa cấu hình → bỏ qua (dev mode)
    if (!secret) return next();
  
    const token = req.body?.turnstileToken;
    if (!token) {
      return res.status(400).json({ error: 'Captcha token missing' });
    }
  
    try {
      const form = new URLSearchParams();
      form.append('secret', secret);
      form.append('response', token);
      form.append('remoteip', req.ip || '');
  
      const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form,
      });
      const data = await r.json();
  
      if (!data.success) {
        return res.status(400).json({ error: 'Captcha verification failed' });
      }
      next();
    } catch (e) {
      console.error('Turnstile error:', e);
      return res.status(500).json({ error: 'Captcha service unavailable' });
    }
  }