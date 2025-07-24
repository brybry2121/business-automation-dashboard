function updateLinkedStatements() {
  businessData.sales = businessData.sales || [];
  businessData.incomeStatement = businessData.incomeStatement || {};

  businessData.incomeStatement.revenue = businessData.sales.reduce(
    (sum, sale) => sum + (Number(sale.sellingPrice) || 0) * (Number(sale.qty) || 0), 0
  );
  businessData.incomeStatement.cogs = businessData.sales.reduce(
    (sum, sale) => sum + (Number(sale.unitCost) || 0) * (Number(sale.qty) || 0), 0
  );

  // ...any other logic you already have
}