const express = require("express");
const router = express.Router();
const { buildGraph } = require("../controllers/graphController");

router.get("/", async (req, res) => {
  try {
    const graph = await buildGraph();
    res.json(graph);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
