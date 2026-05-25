/**
 * Wraps an async Express handler so rejected promises are forwarded
 * to the error middleware via `next(err)`.
 *
 * Express 4 does not catch errors from async functions automatically;
 * without this wrapper an unhandled rejection becomes a hung request
 * AND an unhandled promise rejection at the process level.
 *
 * The input type is intentionally permissive (`any` for `req`) so
 * controllers can declare typed `Request<Params, Body>` signatures
 * without fighting Express's overload resolution. The cast is local
 * to this utility — handlers retain their full type safety.
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncFn = (req: any, res: Response, next?: NextFunction) => Promise<unknown>;

export const asyncHandler = (fn: AsyncFn): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
