// import crypto from "crypto";
// import { ValidationError } from "../../../../packages/error-handler";
// import type { NextFunction } from "express";
// import redis from "../../../../packages/libs/redis";
// import { sendActivationEmail } from "./sendEmail";

// const emailRegex =
//   /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// interface RegistrationData {
//   name: string;
//   email: string;
//   password: string;
//   phone_number?: string;
//   country?: string;
// }

// type UserType = "user" | "seller";

// export const validateRegistrationData = (
//   data: RegistrationData,
//   userType: UserType
// ): void => {
//   const { name, email, password, phone_number, country } = data;

//   if (
//     !name ||
//     !email ||
//     !password ||
//     (userType === "seller" && (!phone_number || !country))
//   ) {
//     throw new ValidationError("Missing required fields for registration");
//   }

//   if (!emailRegex.test(email)) {
//     throw new ValidationError("Invalid email format");
//   }

//   if (phone_number && !/^\+[1-9]{1}[0-9]{3,14}$/.test(phone_number)) {
//     throw new ValidationError("Invalid phone number format");
//   }
// };

// export const checkOtpRestrictions = async (
//   email: string,
//   next: NextFunction
// ): Promise<void> => {
//   if (await redis.get(`otp_lock:${email}`)) {
//     return next(
//       new ValidationError(
//         "⚠️ Account is locked due to multiple failed attempts. Try again after 30 minutes."
//       )
//     );
//   }

//   if (await redis.get(`otp_spam_lock:${email}`)) {
//     return next(
//       new ValidationError(
//         "⚠️ Too many OTP requests. Please wait 1 hour before trying again."
//       )
//     );
//   }

//   if (await redis.get(`otp_cooldown:${email}`)) {
//     return next(
//       new ValidationError(
//         "⚠️ Too many OTP requests. Please wait 1 minute before trying again."
//       )
//     );
//   }
// };

// export const trackOTPRequests = async (
//   email: string,
//   next: NextFunction
// ): Promise<void> => {
//   const otpRequestKey = `otp_request_count:${email}`;
//   const otpRequests = parseInt((await redis.get(otpRequestKey)) || "0");

//   if (otpRequests >= 2) {
//     await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600);
//     return next(
//       new ValidationError(
//         "⚠️ Too many OTP requests. Please wait 1 hour before trying again."
//       )
//     );
//   }

//   await redis.set(otpRequestKey, (otpRequests + 1).toString(), "EX", 3600);
// };

// interface SendOTPParams {
//   name: string;
//   email: string;
//   template: "user-activation-mail" | "other-template"; // Add more as needed
// }

// export const sendOTP = async ({
//   name,
//   email,
//   template,
// }: SendOTPParams): Promise<void> => {
//   const OTP = crypto.randomInt(1000, 9999).toString();

//   switch (template) {
//     case "user-activation-mail":
//       await sendActivationEmail(email, name, OTP);
//       break;
//     // Add cases for other templates here
//     default:
//       throw new Error(`Unsupported email template: ${template}`);
//   }

//   // Store OTP in Redis with expiration
//   await redis.set(email, OTP, "EX", 400); // 400 seconds expiration
//   await redis.set(`otp_cooldown:${email}`, "true", "EX", 60); // 1-minute cooldown
// };
// export const verifyOTP = async (
//   email: string,
//   otp: string
// ): Promise<boolean> => {
//   const storedOTP = await redis.get(`otp:${email}`);
//   if (!storedOTP) {
//     return false;
//   }

//   const failedAttemptsKey = `otp_attempts:${email}`;
//   const failedAttempts = parseInt((await redis.get(failedAttemptsKey)) || "0");

//   if (storedOTP !== otp) {
//     if (failedAttempts >= 3) {
//       await redis.set(`otp_lock:${email}`, "locked", "EX", 1800);
//       await redis.del(`otp:${email}`, failedAttemptsKey);
//       throw new ValidationError(
//         "⚠️ Account is locked due to multiple failed attempts. Try again after 30 minutes."
//       );
//     }
//     await redis.set(failedAttemptsKey, failedAttempts + 1, "EX", 300);
//     throw new ValidationError(
//       `Incorrect OTP. You have ${3 - failedAttempts} attempts left.`
//     );
//   }

//   await redis.del(`otp:${email}`, failedAttemptsKey);
//   return true;
// };

import crypto from "crypto";
import { ValidationError } from "../../../../packages/error-handler";
// import type { NextFunction } from "express";
import redis from "../../../../packages/libs/redis";
import { sendActivationEmail } from "./sendEmail";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegistrationData {
  name: string;
  email: string;
  password: string;
  phone_number?: string;
  country?: string;
}

type UserType = "user" | "seller";

export const validateRegistrationData = (
  data: RegistrationData,
  userType: UserType
): void => {
  const { name, email, password, phone_number, country } = data;

  if (
    !name ||
    !email ||
    !password ||
    (userType === "seller" && (!phone_number || !country))
  ) {
    throw new ValidationError("Missing required fields for registration");
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format");
  }

  if (phone_number && !/^\+[1-9]{1}[0-9]{3,14}$/.test(phone_number)) {
    throw new ValidationError("Invalid phone number format");
  }
};

export const checkOtpRestrictions = async (email: string): Promise<void> => {
  if (await redis.get(`otp_lock:${email}`)) {
    throw new ValidationError(
      "⚠️ Account is locked due to multiple failed attempts. Try again after 30 minutes."
    );
  }

  if (await redis.get(`otp_spam_lock:${email}`)) {
    throw new ValidationError(
      "⚠️ Too many OTP requests. Please wait 1 hour before trying again."
    );
  }

  if (await redis.get(`otp_cooldown:${email}`)) {
    throw new ValidationError(
      "⚠️ Too many OTP requests. Please wait 1 minute before trying again."
    );
  }
};

export const trackOTPRequests = async (email: string): Promise<void> => {
  const otpRequestKey = `otp_request_count:${email}`;
  const otpRequests = parseInt((await redis.get(otpRequestKey)) || "0");

  if (otpRequests >= 2) {
    await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600);
    throw new ValidationError(
      "⚠️ Too many OTP requests. Please wait 1 hour before trying again."
    );
  }

  await redis.set(otpRequestKey, (otpRequests + 1).toString(), "EX", 3600);
};

interface SendOTPParams {
  name: string;
  email: string;
  template: "user-activation-mail";
}

export const sendOTP = async ({
  name,
  email,
  template,
}: SendOTPParams): Promise<string> => {
  const OTP = crypto.randomInt(1000, 9999).toString();

  switch (template) {
    case "user-activation-mail":
      await sendActivationEmail(email, name, OTP);
      break;
    default:
      throw new Error(`Unsupported email template: ${template}`);
  }

  // Store OTP in Redis with consistent key and expiration (5 minutes)
  await redis.set(`otp:${email}`, OTP, "EX", 300);
  await redis.set(`otp_cooldown:${email}`, "true", "EX", 60);

  return OTP;
};

export const verifyOTP = async (
  email: string,
  otp: string
): Promise<boolean> => {
  const storedOTP = await redis.get(`otp:${email}`);

  if (!storedOTP) {
    throw new ValidationError("OTP expired or not found");
  }

  const failedAttemptsKey = `otp_attempts:${email}`;
  const attempts = parseInt((await redis.get(failedAttemptsKey)) || "0") + 1;

  if (storedOTP !== otp) {
    if (attempts >= 3) {
      await redis.set(`otp_lock:${email}`, "locked", "EX", 1800);
      await redis.del(`otp:${email}`, failedAttemptsKey);
      throw new ValidationError(
        "Too many attempts. Try again after 30 minutes."
      );
    }

    await redis.set(failedAttemptsKey, attempts.toString(), "EX", 300);
    throw new ValidationError(
      `Invalid OTP. ${3 - attempts} attempts remaining`
    );
  }

  // Cleanup on successful verification
  await redis.del(`otp:${email}`, failedAttemptsKey);
  return true;
};
