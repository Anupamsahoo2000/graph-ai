// models/Product.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Product = sequelize.define("Product", {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: DataTypes.STRING,
});

module.exports = Product;
