export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;
  public readonly originalError?: Error; // Added to track original errors

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational = true,
    details?: any,
    originalError?: Error // New parameter
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.originalError = originalError;

    // Better stack trace handling
    if (originalError && originalError.stack) {
      this.stack = `${this.stack}\nOriginal Error: ${originalError.stack}`;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}
export class EmailError extends AppError {
  constructor(
    message = "Email sending failed",
    details?: any,
    originalError?: Error
  ) {
    super(message, 500, true, details, originalError);
  }
}

// Not Found
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

// Validation Error
export class ValidationError extends AppError {
  constructor(message = "Invalid request", details?: any) {
    super(message, 400, true, details);
  }
}

// Auth Error
export class AuthError extends AppError {
  constructor(message = "Unauthorized access", details?: any) {
    super(message, 401, true, details);
  }
}

// Forbidden Error
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden access", details?: any) {
    super(message, 403, true, details);
  }
}

// Server Error
export class ServerError extends AppError {
  constructor(message = "Server error", details?: any) {
    super(message, 500, true, details);
  }
}

// Database Error
export class DatabaseError extends AppError {
  constructor(message = "Database error", details?: any) {
    super(message, 500, true, details);
  }
}

// Rate Limit Error
export class RateLimitError extends AppError {
  constructor(
    message = "Too many requests, please try again after an hour",
    details?: any
  ) {
    super(message, 429, true, details);
  }
}
//export class AppError extends Error {
//   public readonly statusCode: number;
//   public readonly isOperational: boolean;
//   public readonly details?: any;

//   constructor(
//     message: string,
//     statusCode: number = 500,
//     isOperational = true,
//     details?: any
//   ) {
//     super(message);
//     this.statusCode = statusCode;
//     this.isOperational = isOperational;
//     this.details = details;
//     Error.captureStackTrace(this, this.constructor);
//   }
// }
// // Not Found
// export class NotFoundError extends AppError {
//   constructor(message = "Resource not found") {
//     super(message, 404);
//   }
// }

// // Validation Error
// export class ValidationError extends AppError {
//   constructor(message = "Invalid request", details?: any) {
//     super(message, 400, true, details);
//   }
// }

// // Auth Error
// export class AuthError extends AppError {
//   constructor(message = "Unauthorized access", details?: any) {
//     super(message, 401, true, details);
//   }
// }

// // Forbidden Error
// export class ForbiddenError extends AppError {
//   constructor(message = "Forbidden access", details?: any) {
//     super(message, 403, true, details);
//   }
// }

// // Server Error
// export class ServerError extends AppError {
//   constructor(message = "Server error", details?: any) {
//     super(message, 500, true, details);
//   }
// }

// // Database Error
// export class DatabaseError extends AppError {
//   constructor(message = "Database error", details?: any) {
//     super(message, 500, true, details);
//   }
// }

// // Rate Limit Error
// export class RateLimitError extends AppError {
//   constructor(
//     message = "Too many requests, please try again after an hour",
//     details?: any
//   ) {
//     super(message, 429, true, details);
//   }
// }
