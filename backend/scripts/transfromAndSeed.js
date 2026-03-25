const fs = require("fs");
const path = require("path");
const readline = require("readline");

const { sequelize } = require("../config/db");

const {
  Customer,
  Product,
  Order,
  Delivery,
  Invoice,
  Payment,
  OrderItem,
} = require("../models");

// Helper to read JSONL (supports one or multiple files)
const readJSONL = async (...filePaths) => {
  const data = [];

  for (const filePath of filePaths.flat()) {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (line.trim()) {
        data.push(JSON.parse(line));
      }
    }
  }

  return data;
};

const run = async () => {
  try {
    // Avoid `alter: true` because it can try to drop/recreate constraints
    // inconsistently and fail when the constraint name differs from what
    // Sequelize expects.
    await sequelize.sync();

    console.log("🚀 Starting transformation...");

    // -----------------------------
    // 1. CUSTOMERS
    // -----------------------------
    const customersRaw = await readJSONL(
      path.join(__dirname, "../data/business_partner.jsonl"),
    );

    for (const c of customersRaw) {
      const id = c.business_partner ?? c.businessPartner ?? c.customer;
      if (id == null || id === "") continue;

      await Customer.findOrCreate({
        where: { id },
        defaults: {
          name:
            c.business_partner_name ??
            c.businessPartnerName ??
            c.businessPartnerFullName ??
            "Unknown",
        },
      });
    }

    console.log("✅ Customers inserted");

    // -----------------------------
    // 2. PRODUCTS
    // -----------------------------
    const productsRaw = await readJSONL(
      path.join(__dirname, "../data/products1.jsonl"),
      path.join(__dirname, "../data/products2.jsonl"),
    );

    for (const p of productsRaw) {
      await Product.findOrCreate({
        where: { id: p.product },
        defaults: {
          name: p.product_description || "Unknown",
        },
      });
    }

    console.log("✅ Products inserted");

    // -----------------------------
    // 3. ORDERS
    // -----------------------------
    const ordersRaw = await readJSONL(
      path.join(__dirname, "../data/sales_order_headers.jsonl"),
    );

    for (const o of ordersRaw) {
      const id = o.sales_order ?? o.salesOrder;
      if (id == null || id === "") continue;

      await Order.findOrCreate({
        where: { id },
        defaults: {
          customer_id: o.sold_to_party ?? o.soldToParty ?? null,
        },
      });
    }

    console.log("✅ Orders inserted");

    // -----------------------------
    // 4. ORDER ITEMS
    // -----------------------------
    const itemsRaw = await readJSONL(
      path.join(__dirname, "../data/sales_order_items1.jsonl"),
      path.join(__dirname, "../data/sales_order_items2.jsonl"),
    );

    for (const item of itemsRaw) {
      const orderId = item.sales_order ?? item.salesOrder;
      const itemId = item.item ?? item.salesOrderItem;
      if (orderId == null || orderId === "" || itemId == null || itemId === "")
        continue;

      const id = `${orderId}_${itemId}`;
      const productId = item.material ?? item.product ?? null;
      const quantity = item.requested_quantity ?? item.requestedQuantity ?? 1;

      const [row, created] = await OrderItem.findOrCreate({
        where: { id },
        defaults: {
          order_id: orderId,
          product_id: productId,
          quantity,
        },
      });

      // If the row exists already, make it deterministic for reruns.
      if (!created) {
        await row.update({
          order_id: orderId,
          product_id: productId,
          quantity,
        });
      }
    }

    console.log("✅ Order items inserted");

    // -----------------------------
    // 5. DELIVERIES
    // -----------------------------
    const deliveriesRaw = await readJSONL(
      path.join(__dirname, "../data/outbound_delivery_headers.jsonl"),
    );

    for (const d of deliveriesRaw) {
      const id = d.outbound_delivery ?? d.outboundDelivery ?? d.deliveryDocument;
      if (id == null || id === "") continue;

      await Delivery.findOrCreate({
        where: { id },
        defaults: {
          order_id:
            d.reference_sales_order ??
            d.referenceSalesOrder ??
            d.salesOrder ??
            null,
        },
      });
    }

    console.log("✅ Deliveries inserted");

    // -----------------------------
    // 6. INVOICES
    // -----------------------------
    const invoicesRaw = await readJSONL(
      path.join(__dirname, "../data/billing_document_headers1.jsonl"),
      path.join(__dirname, "../data/billing_document_headers2.jsonl"),
    );

    for (const inv of invoicesRaw) {
      const id = inv.billing_document ?? inv.billingDocument;
      if (id == null || id === "") continue;

      await Invoice.findOrCreate({
        where: { id },
        defaults: {
          delivery_id:
            inv.reference_document ??
            inv.referenceDocument ??
            inv.deliveryDocument ??
            null,
        },
      });
    }

    console.log("✅ Invoices inserted");

    // -----------------------------
    // 7. PAYMENTS
    // -----------------------------
    const paymentsRaw = await readJSONL(
      path.join(__dirname, "../data/payments_accounts_receivable.jsonl"),
    );

    for (const p of paymentsRaw) {
      const id = p.accounting_document ?? p.accountingDocument;
      if (id == null || id === "") continue;

      const invoice_id =
        p.billing_document ??
        p.billingDocument ??
        p.invoiceReference ??
        null;
      const amount = p.amount ?? p.amountInTransactionCurrency ?? 0;

      const [row, created] = await Payment.findOrCreate({
        where: { id },
        defaults: { invoice_id, amount },
      });

      if (!created) {
        await row.update({ invoice_id, amount });
      }
    }

    console.log("✅ Payments inserted");

    console.log("🎉 DATA TRANSFORMATION COMPLETE");
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

run();
