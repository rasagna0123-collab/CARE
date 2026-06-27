const express = require("express");
require("./db");

const app = express();

// Middleware
app.use(express.json());

// Routes
const productRoutes = require("./routes.js/productroutes");
app.use(productRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Backend Running");
});

// Start Server
app.listen(5000, () => {
  console.log("Server Running on Port 5000");
});

