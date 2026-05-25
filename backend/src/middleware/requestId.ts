/**
 * Request ID middleware.
 *
 * Generates a UUID for every request (or reuses an inbound
 * `x-request-id` header from an upstream proxy / load balancer)
 * and attaches it to:
 *   - `req.id`         — used by other middleware and handlers
 *   - response header  — so the client can quote it in bug reports
 *
 * The logging middleware reads `req.id` to correlate log lines for a
 * single request.
 */

import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare module 'express-serve-static-core' {
  interface Request {
    id: string;
  }
}

const HEADER = 'x-request-id';

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.header(HEADER);
  const id = incoming && incoming.length <= 128 ? incoming : uuidv4();
  req.id = id;
  res.setHeader(HEADER, id);
  next();
}
