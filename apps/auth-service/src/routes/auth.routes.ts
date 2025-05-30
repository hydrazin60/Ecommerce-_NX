import express, { Router } from "express";
import {
  userLogin,
  userRegister,
  verifyUserOTP,
} from "../controllers/auth.controller";

const authRouter: Router = express.Router();

authRouter.post("/user/register", userRegister);
authRouter.post("/user/verify", verifyUserOTP);
authRouter.post("/user/login", userLogin);
export default authRouter;
