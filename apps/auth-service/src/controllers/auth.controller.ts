 

import { Request, Response, NextFunction } from "express";
import {
  checkOtpRestrictions,
  sendOTP,
  trackOTPRequests,
  validateRegistrationData,
  verifyOTP,
} from "../utils/auth.helper";
import { ValidationError } from "../../../../packages/error-handler";
import prisma from "../../../../packages/libs/prisma";
import bcrypt from "bcryptjs";

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
      throw new ValidationError("User already exists");
    }

    await checkOtpRestrictions(email);
    await trackOTPRequests(email);

    await sendOTP({
      name,
      email,
      template: "user-activation-mail",
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  } catch (err) {
    return next(err);
  }
};

export const verifyUserOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name } = req.body;

    if (!email || !otp || !password || !name) {
      throw new ValidationError("Please provide all required fields");
    }

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ValidationError("User already exists");
    }

    // Verify OTP
    const isOTPValid = await verifyOTP(email, otp);
    if (!isOTPValid) {
      throw new ValidationError("Invalid OTP");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: `${user.name} created a new account successfully`,
      data: user,
    });
  } catch (err) {
    return next(err);
  }
};
