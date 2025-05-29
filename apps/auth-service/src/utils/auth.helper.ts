import crypto from "crypto";
import { ValidationError } from "../../../../packages/error-handler";
import type { NextFunction } from "express";
import redis from "../../../../packages/libs/redis";
import { sendActivationEmail } from "./sendEmail";

const emailRegex =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

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

export const checkOtpRestrictions = async (
  email: string,
  next: NextFunction
): Promise<void> => {
  if (await redis.get(`otp_lock:${email}`)) {
    return next(
      new ValidationError(
        "⚠️ Account is locked due to multiple failed attempts. Try again after 30 minutes."
      )
    );
  }

  if (await redis.get(`otp_spam_lock:${email}`)) {
    return next(
      new ValidationError(
        "⚠️ Too many OTP requests. Please wait 1 hour before trying again."
      )
    );
  }

  if (await redis.get(`otp_cooldown:${email}`)) {
    return next(
      new ValidationError(
        "⚠️ Too many OTP requests. Please wait 1 minute before trying again."
      )
    );
  }
};

export const trackOTPRequests = async (
  email: string,
  next: NextFunction
): Promise<void> => {
  const otpRequestKey = `otp_request_count:${email}`;
  const otpRequests = parseInt((await redis.get(otpRequestKey)) || "0");

  if (otpRequests >= 2) {
    await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600);
    return next(
      new ValidationError(
        "⚠️ Too many OTP requests. Please wait 1 hour before trying again."
      )
    );
  }

  await redis.set(otpRequestKey, (otpRequests + 1).toString(), "EX", 3600);
};

interface SendOTPParams {
  name: string;
  email: string;
  template: "user-activation-mail" | "other-template"; // Add more as needed
}

export const sendOTP = async ({
  name,
  email,
  template,
}: SendOTPParams): Promise<void> => {
  const OTP = crypto.randomInt(1000, 9999).toString();

  switch (template) {
    case "user-activation-mail":
      await sendActivationEmail(email, name, OTP);
      break;
    // Add cases for other templates here
    default:
      throw new Error(`Unsupported email template: ${template}`);
  }

  // Store OTP in Redis with expiration
  await redis.set(email, OTP, "EX", 400); // 400 seconds expiration
  await redis.set(`otp_cooldown:${email}`, "true", "EX", 60); // 1-minute cooldown
};
