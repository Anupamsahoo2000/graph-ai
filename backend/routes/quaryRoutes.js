const express = require("express");
const router = express.Router();
const { runQuery } = require("../controllers/quaryController");

router.post("/", async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question required" });
  }

  const result = await runQuery(question);
  res.json(result);
});

module.exports = router;
