import crypto from "crypto";
import { ValidationError } from "../../../../packages/error-handler";
// import type { NextFunction } from "express";
import redis from "../../../../packages/libs/redis";
import { sendActivationEmail } from "./sendEmail";
import { NextFunction, Request, Response } from "express";
import prisma from "../../../../packages/libs/prisma";

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

// forget password

export const handleForgetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
  userType: "user" | "seller"
) => {
  try {
    const { email } = req.body;
    if (!emailRegex.test(email)) {
      throw new ValidationError("Invalid email format");
    }
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ValidationError("User not found");
    }
    await checkOtpRestrictions(email);
    await trackOTPRequests(email);

    await sendOTP({
      name: user.name,
      email,
      template: "user-activation-mail",
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  } catch (error) {
    next(error);
  }
};

// verify forget password otp

export const handleVerifyForgetPasswordOTP = async (
  req: Request,
  res: Response,
  next: NextFunction,
  userType: "user" | "seller"
) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      throw new ValidationError("Please provide all required fields");
    }

    // Handle verification result
    const isVerified = await verifyOTP(email, otp);
    if (!isVerified) {
      throw new ValidationError("OTP verification failed");
    }

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (err) {
    return next(err);
  }
};
