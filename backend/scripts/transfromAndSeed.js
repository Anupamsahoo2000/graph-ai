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
        try {
          data.push(JSON.parse(line));
        } catch (e) {
          // Ignore parse errors on bad lines
        }
      }
    }
  }

  return data;
};

const getJsonlFiles = (dirName) => {
  const fullDir = path.join(__dirname, "../data", dirName);
  if (!fs.existsSync(fullDir)) return [];
  return fs.readdirSync(fullDir)
    .filter(f => f.endsWith(".jsonl"))
    .map(f => path.join(fullDir, f));
};

const run = async () => {
  try {
    // Use force: true to ensure any corrupted constraints are wiped out
    await sequelize.sync({ alter: true });

    console.log("🚀 Starting transformation...");

    // -----------------------------
    // 1. CUSTOMERS
    // -----------------------------
    const customersRaw = await readJSONL(...getJsonlFiles("business_partners"));

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
    const productsRaw = await readJSONL(...getJsonlFiles("products"));

    const pdRaw = await readJSONL(...getJsonlFiles("product_descriptions"));
    const productNameMap = {};
    for (const item of pdRaw) {
      if (item.product && item.productDescription) {
        productNameMap[item.product] = item.productDescription;
      }
    }

    for (const p of productsRaw) {
      await Product.findOrCreate({
        where: { id: p.product },
        defaults: {
          name: productNameMap[p.product] || p.product_description || "Unknown",
        },
      });
    }

    console.log("✅ Products inserted");

    // -----------------------------
    // 3. ORDERS
    // -----------------------------
    const ordersRaw = await readJSONL(...getJsonlFiles("sales_order_headers"));

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
    const itemsRaw = await readJSONL(...getJsonlFiles("sales_order_items"));

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
    const deliveriesRaw = await readJSONL(...getJsonlFiles("outbound_delivery_headers"));

    const odiRaw = await readJSONL(...getJsonlFiles("outbound_delivery_items"));
    const deliveryOrderMap = {};
    for (const item of odiRaw) {
      if (item.deliveryDocument && item.referenceSdDocument) {
        deliveryOrderMap[item.deliveryDocument] = item.referenceSdDocument;
      }
    }

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
            deliveryOrderMap[id] ??
            null,
        },
      });
    }

    console.log("✅ Deliveries inserted");

    // -----------------------------
    // 6. INVOICES
    // -----------------------------
    const invoicesRaw = await readJSONL(...getJsonlFiles("billing_document_headers"));

    // Get all valid delivery IDs from DB to prevent FK constraint failures
    const validDeliveries = new Set((await Delivery.findAll({ attributes: ['id'] })).map(d => d.id));

    // Read items to find delivery map
    const billingItemsRaw = await readJSONL(...getJsonlFiles("billing_document_items"));
    
    // Map: Invoice ID -> Delivery ID (referenceSdDocument)
    const deliveryMap = {};
    for (const item of billingItemsRaw) {
      if (item.billingDocument && item.referenceSdDocument) {
        deliveryMap[item.billingDocument] = item.referenceSdDocument;
      }
    }

    for (const inv of invoicesRaw) {
      const id = inv.billing_document ?? inv.billingDocument;
      if (id == null || id === "") continue;

      let delivery_id =
        inv.reference_document ??
        inv.referenceDocument ??
        inv.deliveryDocument ??
        deliveryMap[id] ??
        null;
        
      if (delivery_id && !validDeliveries.has(delivery_id)) {
        delivery_id = null; // Prevent FK failure (e.g. order-related billing instead of delivery-related)
      }

      const [row, created] = await Invoice.findOrCreate({
        where: { id },
        defaults: {
          delivery_id,
        },
      });

      if (!created) {
        await row.update({ delivery_id });
      }
    }

    console.log("✅ Invoices inserted");

    // -----------------------------
    // 7. PAYMENTS
    // -----------------------------
    const paymentsRaw = await readJSONL(...getJsonlFiles("payments_accounts_receivable"));

    const jeRaw = await readJSONL(...getJsonlFiles("journal_entry_items_accounts_receivable"));
    const paymentInvoiceMap = {};
    for (const item of jeRaw) {
      // payments_accounts_receivable usually references accountingDocument
      if (item.accountingDocument && item.referenceDocument) {
        paymentInvoiceMap[item.accountingDocument] = item.referenceDocument;
      }
    }

    for (const p of paymentsRaw) {
      const id = p.accounting_document ?? p.accountingDocument;
      if (id == null || id === "") continue;

      const invoice_id =
        p.billing_document ??
        p.billingDocument ??
        p.invoiceReference ??
        paymentInvoiceMap[id] ??
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
