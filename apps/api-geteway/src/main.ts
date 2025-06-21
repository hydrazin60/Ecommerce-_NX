import express, { Request, Response, Application } from "express";
import cors from "cors";
import proxy from "express-http-proxy";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import * as path from "path";
import { errorMiddleware } from "../../../packages/error-handler/error-middleware.js";

const app: Application = express();

app.set("trust proxy", 1);
app.use(
  cors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
const cookieMiddleware = cookieParser();
app.use(cookieMiddleware as any);
app.use(errorMiddleware as any);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req: any) => (req.user ? 1000 : 100),
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.ip,
});
app.use(limiter as any);

app.get("/api-getway", (req: Request, res: Response) => {
  res.send({ message: "Welcome to api-gateway! jiban" });
});

// Proxy to microservices
app.use(
  "/",
  proxy("http://localhost:5001") as unknown as express.RequestHandler
);

app.use("/assets", express.static(path.join(__dirname, "assets")));

const port = process.env.PORT || 7000;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});

server.on("error", console.error);
