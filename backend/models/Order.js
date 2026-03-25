// models/Order.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Order = sequelize.define("Order", {
  id: { type: DataTypes.STRING, primaryKey: true },
  customer_id: DataTypes.STRING,
});

module.exports = Order;
