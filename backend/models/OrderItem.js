// models/OrderItem.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const OrderItem = sequelize.define("OrderItem", {
  id: { type: DataTypes.STRING, primaryKey: true },
  order_id: DataTypes.STRING,
  product_id: DataTypes.STRING,
  quantity: DataTypes.INTEGER,
});

module.exports = OrderItem;
