import { Request, Response, NextFunction } from "express";
import {
  checkOtpRestrictions,
  sendOTP,
  trackOTPRequests,
  validateRegistrationData,
  verifyOTP,
} from "../utils/auth.helper";
import { AuthError, ValidationError } from "../../../../packages/error-handler";
import prisma from "../../../../packages/libs/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { setCookies } from "../utils/cookies/setCookies";

//  user register API
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
//  user verify API
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

// user Login API
export const userLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError("Please provide all required fields");
    }
    const user = await prisma.users.findUnique({
      where: { email },
    });
    if (!user) {
      return next(new AuthError("User not found"));
    }

    // Add null check for user.password
    if (!user.password) {
      return next(new AuthError("Invalid credentials"));
    }

    // Now we know password exists
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return next(new AuthError("Invalid credentials"));
    }

    // Rest of your code...
    const accessToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: "7d" }
    );

    setCookies(res, "accessToken", accessToken);
    setCookies(res, "refreshToken", refreshToken);

    // Omit password from response
    const { password: _, ...userData } = user;

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: userData,
    });
  } catch (err) {
    return next(err);
  }
};
