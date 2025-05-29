import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes";

const host = process.env.HOST ?? "localhost";
const port = process.env.PORT ? Number(process.env.PORT) : 5001;
const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.send("Hello from auth-service");
});

app.use("/api", authRouter);

const server = app.listen(port, () => {
  console.log(`Listening at http://${host}:${port}`);
});

server.on("error", (err) => {
  console.log("server error : ", err);
});
