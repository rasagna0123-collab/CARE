const express = require("express");
const Product = require("../models/product");

const router = express.Router();

router.get("/products", async (req, res) => {
  try {
    const filter = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.name) {
      filter.name = {
        $regex: req.query.name,
        $options: "i"
      };
    }

    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};

      if (req.query.minPrice) {
        filter.price.$gte = Number(req.query.minPrice);
      }

      if (req.query.maxPrice) {
        filter.price.$lte = Number(req.query.maxPrice);
      }
    }

    const products = await Product.find(filter);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/add-product", async (req, res) => {
  try {
    const existingProduct = await Product.findOne({
      name: req.body.name
    });

    if (existingProduct) {
      return res.status(400).json({
        message: "Product already exists"
      });
    }

    const product = await Product.create(req.body);

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});
module.exports = router;