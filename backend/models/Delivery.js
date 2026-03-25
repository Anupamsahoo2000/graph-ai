// models/Delivery.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Delivery = sequelize.define("Delivery", {
  id: { type: DataTypes.STRING, primaryKey: true },
  order_id: DataTypes.STRING,
});

module.exports = Delivery;
