import express, { json } from "express";
import cors from "cors";
const app = express();
require("dotenv").config();
import { sequelize } from "./config/db";
import "./models";
app.use(cors());
app.use(json());

const PORT = process.env.PORT || 5000;

import seed from "./scripts/transformAndSeed";

await seed();

import graphRoutes from "./routes/graphRoutes";
import queryRoutes from "./routes/quaryRoutes";

// Routes
app.use("/graph", graphRoutes);
app.use("/query", queryRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Graph AI System Running");
});

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
