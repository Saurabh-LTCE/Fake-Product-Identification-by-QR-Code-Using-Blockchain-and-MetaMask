const express = require("express");
const { createProduct, getProduct, listProducts } = require("../controllers/productController");

const router = express.Router();
router.get("/", listProducts);
router.post("/", createProduct);
router.get("/:productId", getProduct);

module.exports = router;
