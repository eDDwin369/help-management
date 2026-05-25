/**
 * Zod validation middleware.
 *
 * Accepts a schema describing any combination of `body`, `params`,
 * and `query`. On success it mutates the request with the parsed
 * (coerced + stripped) data so handlers only see validated input.
 * On failure it throws a `ValidationError` which the error middleware
 * formats into a 400 with field-level details.
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export interface RequestSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validate(schemas: RequestSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) {
        // req.query is read-only on Express 5; assign defensively.
        Object.assign(req.query, schemas.query.parse(req.query));
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(
          new ValidationError('Request validation failed', err.flatten()),
        );
        return;
      }
      next(err);
    }
  };
}
