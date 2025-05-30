import { Request, Response, NextFunction } from "express";
import {
  checkOtpRestrictions,
  handleForgetPassword,
  handleVerifyForgetPasswordOTP,
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

// user forget password API
export const userForgetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  handleForgetPassword(req, res, next, "user");
};

// user verify forget password API
export const verifyUserForgetPasswordOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
 handleVerifyForgetPasswordOTP(req, res, next, "user");
};

// user reset password
export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, Newpassword } = req.body;
    if (!email || !Newpassword) {
      throw new ValidationError("Please provide all required fields");
    }
    const user = await prisma.users.findUnique({
      where: { email },
    });
    if (!user) {
      throw new ValidationError("User not found");
    }
    if (!user.password) {
      throw new ValidationError("Password not found");
    }
    const isSamePassword = await bcrypt.compare(Newpassword, user.password);
    if (isSamePassword) {
      throw new ValidationError("New password cannot be same as old password");
    }

    const hashedPassword = await bcrypt.hash(Newpassword, 10);
    await prisma.users.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};
