const isRelevantQuery = (question) => {
  const keywords = [
    "order",
    "invoice",
    "delivery",
    "payment",
    "customer",
    "product",
  ];

  const lower = question.toLowerCase();

  return keywords.some((k) => lower.includes(k));
};

module.exports = { isRelevantQuery };
