const express = require("express");
const { verifyProduct } = require("../controllers/verifyController");

const router = express.Router();
router.get("/:productId", verifyProduct);

module.exports = router;
