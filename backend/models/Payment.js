// models/Payment.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Payment = sequelize.define("Payment", {
  id: { type: DataTypes.STRING, primaryKey: true },
  invoice_id: DataTypes.STRING,
  amount: DataTypes.FLOAT,
});

module.exports = Payment;
