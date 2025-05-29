import express, { Router } from "express";
import { userRegister } from "../controllers/auth.controller";

const authRouter: Router = express.Router();

authRouter.post("/user/register", userRegister);

export default authRouter;
