import type { Request, Response, NextFunction } from "express";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  });
};
