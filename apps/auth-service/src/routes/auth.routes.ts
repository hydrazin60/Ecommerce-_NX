import express, { Router } from "express";
import { userRegister, verifyUserOTP } from "../controllers/auth.controller";

const authRouter: Router = express.Router();

authRouter.post("/user/register", userRegister);
authRouter.post("/user/verify", verifyUserOTP);

export default authRouter;
