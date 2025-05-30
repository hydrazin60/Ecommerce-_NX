import express, { Router } from "express";
import {
  resetUserPassword,
  userForgetPassword,
  userLogin,
  userRegister,
  verifyUserForgetPasswordOTP,
  verifyUserOTP,
} from "../controllers/auth.controller";

const authRouter: Router = express.Router();

authRouter.post("/user/register", userRegister);
authRouter.post("/user/verify", verifyUserOTP);
authRouter.post("/user/login", userLogin);
authRouter.post("/user/forget-password", userForgetPassword);
authRouter.post("/user/reset-password", resetUserPassword);
authRouter.post(
  "/user/verify-forget-password-otp",
  verifyUserForgetPasswordOTP
);
export default authRouter;
