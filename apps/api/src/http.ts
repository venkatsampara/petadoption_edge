import type { NextFunction, Request, RequestHandler, Response } from "express";

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export function sendData<T>(response: Response, data: T, status = 200): void {
  response.status(status).json({ data, error: null });
}

export function sendError(
  response: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  const error: ApiErrorBody = details === undefined
    ? { code, message }
    : { code, message, details };
  response.status(status).json({ data: null, error });
}

export function asyncHandler(
  handler: (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => Promise<void>,
): RequestHandler {
  return (request, response, next) => {
    void handler(request, response, next).catch(next);
  };
}
