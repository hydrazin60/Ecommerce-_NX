import { Request, Response, NextFunction } from "express";
import {
  checkOtpRestrictions,
  sendOTP,
  trackOTPRequests,
  validateRegistrationData,
} from "../utils/auth.helper";
import { ValidationError } from "../../../../packages/error-handler";
import prisma from "../../../../packages/libs/prisma";

export const userRegister = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegistrationData(req.body, "user");
    const { name, email } = req.body;

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(new ValidationError("User already exists"));
    }

    await checkOtpRestrictions(email, next);
    await trackOTPRequests(email, next);

    await sendOTP({
      name,
      email,
      template: "user-activation-mail", // Now properly typed
    });

    return res
      .status(200)
      .json({ message: "OTP sent successfully to your email" });
  } catch (err) {
    return next(err);
  }
};
