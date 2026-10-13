const express = require("express");
const { listScans } = require("../controllers/scanController");

const router = express.Router();
router.get("/", listScans);

module.exports = router;
