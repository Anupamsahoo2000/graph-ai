const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const { sequelize } = require("./config/db");
require("./models");
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const graphRoutes = require("./routes/graphRoutes");
app.use("/graph", graphRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Graph AI System Running");
});

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
