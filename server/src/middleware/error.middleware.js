export function errorHandler(err, _req, res, _next) {
    console.error(err);
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ error: message });
  }
  
  export function asyncHandler(fn) {
    return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
  }
  
  export function httpError(status, message) {
    const e = new Error(message);
    e.status = status;
    return e;
  }