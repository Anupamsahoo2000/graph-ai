// models/Customer.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Customer = sequelize.define("Customer", {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: DataTypes.STRING,
});

module.exports = Customer;
