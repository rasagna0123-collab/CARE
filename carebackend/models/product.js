const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  category: String,
  name: String,
  price: Number,
  tags: [String],
  details: String,
  howToUse: String
});

module.exports = mongoose.model("Product", productSchema);