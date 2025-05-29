import swaggerAutogen from "swagger-autogen";
// import authRouter from "./routes/auth.routes";
const doc = {
  info: {
    title: "Auth Service API",
    description: "Automatically generated Swagger docs",
    version: "1.0.0",
  },
  host: "localhost:6001",
  schemes: ["http"],
};

const outputFile = "./swagger-auth.json";
const endpointsFiles = ["./routes/auth.routes.js"];

swaggerAutogen(outputFile, endpointsFiles, doc);
