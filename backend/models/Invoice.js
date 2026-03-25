// models/Invoice.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Invoice = sequelize.define("Invoice", {
  id: { type: DataTypes.STRING, primaryKey: true },
  delivery_id: DataTypes.STRING,
});

module.exports = Invoice;
