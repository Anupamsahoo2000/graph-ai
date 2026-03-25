const Customer = require("./Customer");
const Product = require("./Product");
const Order = require("./Order");
const Delivery = require("./Delivery");
const Invoice = require("./Invoice");
const Payment = require("./Payment");
const OrderItem = require("./OrderItem");

// Customer → Order
Customer.hasMany(Order, { foreignKey: "customer_id" });
Order.belongsTo(Customer, { foreignKey: "customer_id" });

// Order → Delivery
Order.hasMany(Delivery, { foreignKey: "order_id" });
Delivery.belongsTo(Order, { foreignKey: "order_id" });

// Delivery → Invoice
Delivery.hasMany(Invoice, { foreignKey: "delivery_id" });
Invoice.belongsTo(Delivery, { foreignKey: "delivery_id" });

// Invoice → Payment
Invoice.hasMany(Payment, { foreignKey: "invoice_id" });
Payment.belongsTo(Invoice, { foreignKey: "invoice_id" });

// Order ↔ Product (via OrderItem)
Order.hasMany(OrderItem, { foreignKey: "order_id" });
OrderItem.belongsTo(Order, { foreignKey: "order_id" });

Product.hasMany(OrderItem, { foreignKey: "product_id" });
OrderItem.belongsTo(Product, { foreignKey: "product_id" });

module.exports = {
  Customer,
  Product,
  Order,
  Delivery,
  Invoice,
  Payment,
  OrderItem,
};
