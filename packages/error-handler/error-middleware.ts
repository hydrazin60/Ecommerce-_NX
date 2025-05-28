import { AppError } from "./index.js";
import { Request, Response } from "express";
export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: Function
) => {
  if (err instanceof AppError) {
    console.error(`Error: ${req.method} ${req.url} - ${err.message}`);
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(err.details && { details: err.details }),
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  console.error("Unhandled error", err);
  return res.status(500).json({
    status: "error",
    message: "Something went wrong, please try again later",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
