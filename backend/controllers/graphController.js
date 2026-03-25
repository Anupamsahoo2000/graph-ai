const {
  Customer,
  Product,
  Order,
  Delivery,
  Invoice,
  Payment,
  OrderItem,
} = require("../models");

const buildGraph = async () => {
  const nodes = [];
  const edges = [];

  // -------------------
  // CUSTOMERS
  // -------------------
  const customers = await Customer.findAll();

  customers.forEach((c) => {
    nodes.push({
      id: `customer_${c.id}`,
      label: `Customer ${c.id}`,
      type: "customer",
    });
  });

  // -------------------
  // PRODUCTS
  // -------------------
  const products = await Product.findAll();

  products.forEach((p) => {
    nodes.push({
      id: `product_${p.id}`,
      label: `Product ${p.id}`,
      type: "product",
    });
  });

  // -------------------
  // ORDERS
  // -------------------
  const orders = await Order.findAll();

  orders.forEach((o) => {
    nodes.push({
      id: `order_${o.id}`,
      label: `Order ${o.id}`,
      type: "order",
    });

    // Customer → Order
    if (o.customer_id) {
      edges.push({
        source: `customer_${o.customer_id}`,
        target: `order_${o.id}`,
        label: "PLACED",
      });
    }
  });

  // -------------------
  // ORDER ITEMS
  // -------------------
  const items = await OrderItem.findAll();

  items.forEach((item) => {
    // Order → Product
    edges.push({
      source: `order_${item.order_id}`,
      target: `product_${item.product_id}`,
      label: "CONTAINS",
    });
  });

  // -------------------
  // DELIVERIES
  // -------------------
  const deliveries = await Delivery.findAll();

  deliveries.forEach((d) => {
    nodes.push({
      id: `delivery_${d.id}`,
      label: `Delivery ${d.id}`,
      type: "delivery",
    });

    if (d.order_id) {
      edges.push({
        source: `order_${d.order_id}`,
        target: `delivery_${d.id}`,
        label: "DELIVERED_AS",
      });
    }
  });

  // -------------------
  // INVOICES
  // -------------------
  const invoices = await Invoice.findAll();

  invoices.forEach((inv) => {
    nodes.push({
      id: `invoice_${inv.id}`,
      label: `Invoice ${inv.id}`,
      type: "invoice",
    });

    if (inv.delivery_id) {
      edges.push({
        source: `delivery_${inv.delivery_id}`,
        target: `invoice_${inv.id}`,
        label: "BILLED_AS",
      });
    }
  });

  // -------------------
  // PAYMENTS
  // -------------------
  const payments = await Payment.findAll();

  payments.forEach((p) => {
    nodes.push({
      id: `payment_${p.id}`,
      label: `Payment ${p.id}`,
      type: "payment",
    });

    if (p.invoice_id) {
      edges.push({
        source: `invoice_${p.invoice_id}`,
        target: `payment_${p.id}`,
        label: "PAID_BY",
      });
    }
  });

  return { nodes, edges };
};

module.exports = { buildGraph };
