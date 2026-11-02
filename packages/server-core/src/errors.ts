import type { ErrorRequestHandler } from 'express'
import { z } from 'zod'

/** The only errors services should throw; errorHandler turns them into HTTP responses. */
export class CustomError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode = 500) {
    super(message)
    this.name = 'CustomError'
    this.statusCode = statusCode
  }
}

export class NotFoundError extends CustomError {
  constructor(message = 'Not found') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends CustomError {
  readonly details: Record<string, string[] | undefined>

  constructor(details: Record<string, string[] | undefined>, message = 'Validation failed') {
    super(message, 422)
    this.name = 'ValidationError'
    this.details = details
  }
}

/** Error body: { error, details? }. Mount last. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof z.ZodError) {
    res.status(422).json({ error: 'Validation failed', details: z.flattenError(err).fieldErrors })
    return
  }
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({ error: err.message, details: err.details })
    return
  }
  if (err instanceof CustomError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}
