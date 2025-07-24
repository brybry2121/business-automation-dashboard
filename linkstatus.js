function checkLinkStatus() {
  // Income Statement links
  // Adjusted for flat number storage
  const allCOGSLinked = businessData.incomeStatement.cogs > 0;
  const operExpensesLinked = businessData.incomeStatement.operatingExpenses && businessData.incomeStatement.operatingExpenses.length > 0;
  const taxesLinked = businessData.incomeStatement.taxes && businessData.incomeStatement.taxes.length > 0;
  // Revenue: is there any sale?
  const salesLinked = businessData.sales && businessData.sales.length > 0;

  // Balance Sheet links (unchanged, unless you also use flat numbers there)
  const bsCurrentAssetsLinked = businessData.balanceSheet.currentAssets && businessData.balanceSheet.currentAssets.length === businessData.inventory.length;
  const bsEquityLinked = (businessData.balanceSheet.contributionCapital && businessData.balanceSheet.contributionCapital.length > 0)
    || (businessData.balanceSheet.otherCapital && businessData.balanceSheet.otherCapital.length > 0);
  const bsDebtLinked = (businessData.balanceSheet.currentLiabilities && businessData.balanceSheet.currentLiabilities.length > 0)
    || (businessData.balanceSheet.longLiabilities && businessData.balanceSheet.longLiabilities.length > 0);

  // Cash Flow links (has inflows/outflows, and some outflows match purchases or inventory)
  const cfLinked = (businessData.cashFlow.operIn && businessData.cashFlow.operIn.length > 0)
    || (businessData.cashFlow.operOut && businessData.cashFlow.operOut.some(out => out.name && out.name.toLowerCase().includes("purchase")));

  // Final status
  const allLinked = allCOGSLinked && operExpensesLinked && taxesLinked && salesLinked && bsCurrentAssetsLinked && bsEquityLinked && bsDebtLinked && cfLinked;

  // Text summary (unchanged)
  let status = `<div style="margin:10px 0 0 0; font-size:13px; padding:5px 8px; border-radius:5px; background:#f3f6fa; border:1px solid #e0e4ea;">
    <b>Link Status:</b> ${allLinked ? '<span style="color:#187a27;">All major statements are linked ✔</span>' : '<span style="color:#c00;">Some links missing ✖</span>'}
    <ul style="margin:6px 0 0 18px; padding:0;">
      <li>COGS linked to Inventory: ${allCOGSLinked ? '✔' : '✖'}</li>
      <li>Operating Expense present: ${operExpensesLinked ? '✔' : '✖'}</li>
      <li>Tax info present: ${taxesLinked ? '✔' : '✖'}</li>
      <li>Revenue linked to Inventory sales: ${salesLinked ? '✔' : '✖'}</li>
      <li>Balance Sheet current assets linked to Inventory: ${bsCurrentAssetsLinked ? '✔' : '✖'}</li>
      <li>Equity info present: ${bsEquityLinked ? '✔' : '✖'}</li>
      <li>Debt info present: ${bsDebtLinked ? '✔' : '✖'}</li>
      <li>Cash Flow inflows/outflows present: ${cfLinked ? '✔' : '✖'}</li>
    </ul>
  </div>`;
  return status;
}