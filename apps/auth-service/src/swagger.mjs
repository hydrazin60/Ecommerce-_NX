import swaggerAutogen from "swagger-autogen";
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
const endpointsFiles = ["./src/routes/auth.routes.js"];

swaggerAutogen(outputFile, endpointsFiles, doc);
