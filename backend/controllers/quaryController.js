const { sequelize } = require("../config/db");
const { callLLM } = require("../services/llmService");
const { isRelevantQuery } = require("../services/guardrails");

const generateSQL = async (question) => {
  const prompt = `
You are a PostgreSQL expert.

Convert the user's question into SQL using this schema:

Tables:
"Orders"(id, customer_id)
"OrderItems"(id, order_id, product_id, quantity)
"Deliveries"(id, order_id)
"Invoices"(id, delivery_id)
"Payments"(id, invoice_id, amount)
"Customers"(id, name)
"Products"(id, name)

Rules:
- You MUST use EXACT double quotes for all table names (e.g., "Orders", "Invoices") because PostgreSQL is case-sensitive for these Sequelize tables!
- All id and foreign key columns are STRINGS (VARCHAR). You MUST wrap ID values in numeric filters with single quotes (e.g., customer_id = '310000108').
- ALWAYS use LEFT JOINs when connecting tables (Orders -> Deliveries -> Invoices -> Payments). This ensures that if a document is missing a step (e.g., an Invoice with no Delivery), it will still be found.
- Only return SQL
- No explanation

Question: ${question}
`;

  const sql = await callLLM(prompt);
  return sql.trim().replace(/\`\`\`sql|\`\`\`/g, "");
};

const formatAnswer = async (question, result) => {
  const prompt = `
User Question: ${question}

SQL Result:
${JSON.stringify(result)}

Convert this into a natural language answer.
Be concise and accurate.
CRITICAL: Do not use ANY Markdown formatting (no **bold**, no *italics*, no lists). Return plain, clean text only.
`;
  return await callLLM(prompt);
};

const runQuery = async (question) => {
  // Guardrail
  if (!isRelevantQuery(question)) {
    return {
      answer: "This system is designed to answer questions related to the dataset only.",
    };
  }

  try {
    const sql = await generateSQL(question);
    console.log("Generated SQL:", sql);

    const [result] = await sequelize.query(sql);

    const answer = await formatAnswer(question, result);

    return { answer, sql, result };
  } catch (error) {
    return {
      answer: `Failed to process query. Error: ${error.message}. Please try again.`,
      error: error.message,
    };
  }
};

module.exports = { runQuery };
