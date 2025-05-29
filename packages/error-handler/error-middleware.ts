// import { AppError } from "./index.js";
// import { Request, Response } from "express";
// export const errorMiddleware = (
//   err: Error,
//   req: Request,
//   res: Response,
//   next: Function
// ) => {
//   if (err instanceof AppError) {
//     console.error(`Error: ${req.method} ${req.url} - ${err.message}`);
//     return res.status(err.statusCode).json({
//       status: "error",
//       message: err.message,
//       ...(err.details && { details: err.details }),
//       ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
//     });
//   }

//   console.error("Unhandled error", err);
//   return res.status(500).json({
//     status: "error",
//     message: "Something went wrong, please try again later",
//     ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
//   });
// };
import { AppError, EmailError } from "./index.js";
import { Request, Response } from "express";

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: Function
) => {
  // Log the error with more context
  console.error(
    `[${new Date().toISOString()}] Error: ${req.method} ${req.url}`,
    {
      error: err.message,
      stack: err.stack,
      ...(err instanceof AppError && {
        statusCode: err.statusCode,
        details: err.details,
        originalError: err.originalError?.message,
      }),
    }
  );

  // Handle specific error types
  if (err instanceof AppError) {
    const response: any = {
      status: "error",
      error: err.message,
      ...(err.details && { details: err.details }),
    };

    // Include stack trace in development for all errors
    if (process.env.NODE_ENV === "development") {
      response.stack = err.stack;
      if (err.originalError) {
        response.originalError = {
          message: err.originalError.message,
          stack: err.originalError.stack,
        };
      }
    }

    // Special handling for email errors
    if (err instanceof EmailError) {
      response.suggestion =
        "Please check your email address or try again later";
    }

    return res.status(err.statusCode).json(response);
  }

  // Fallback for unhandled errors
  const response: any = {
    status: "error",
    error: "Something went wrong, please try again later",
  };

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  return res.status(500).json(response);
};
