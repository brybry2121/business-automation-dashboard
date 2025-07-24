// inventoryActions.js
// Add direct-action buttons to each inventory row without changing existing structure or style.
// Assumes businessData, saveData(), and all renderX functions already exist globally.

function recordInventorySale(idx) {
  const item = businessData.inventory[idx];
  const qtySold = prompt(`How many units of "${item.name}" sold?`);
  const pricePerUnit = prompt(`Sale price per unit for "${item.name}"?`);
  if (!qtySold || !pricePerUnit || isNaN(qtySold) || isNaN(pricePerUnit)) return;

  // Reduce inventory
  item.availableQty -= Number(qtySold);
  if (item.availableQty < 0) item.availableQty = 0;

  // Add to revenue
  businessData.incomeStatement.revenues.push({
    name: item.name,
    amount: Number(qtySold) * Number(pricePerUnit)
  });

  // Add to COGS for this sale instance
  businessData.incomeStatement.purchases.push({
    name: item.name,
    amount: Number(qtySold) * Number(item.unitCost)
  });

  saveData();
  refreshAllDashboards();
}

function recordInventoryExpense(idx) {
  const item = businessData.inventory[idx];
  const expenseAmount = prompt(`Enter expense amount for "${item.name}" (e.g., shipping, packaging):`);
  if (!expenseAmount || isNaN(expenseAmount)) return;

  businessData.incomeStatement.operatingExpenses.push({
    name: `Expense: ${item.name}`,
    amount: Number(expenseAmount)
  });

  saveData();
  refreshAllDashboards();
}

function recordInventoryLoan(idx) {
  const item = businessData.inventory[idx];
  const loanAmount = prompt(`Enter loan amount for "${item.name}":`);
  if (!loanAmount || isNaN(loanAmount)) return;

  businessData.balanceSheet.longLiabilities.push({
    name: `Loan: ${item.name}`,
    amount: Number(loanAmount)
  });

  businessData.cashFlow.finIn.push({
    name: `Loan Received for ${item.name}`,
    amount: Number(loanAmount)
  });

  saveData();
  refreshAllDashboards();
}

function recordInventoryTax(idx) {
  const item = businessData.inventory[idx];
  if (typeof getTaxRate !== 'function') {
    alert('Tax calculation function not found.');
    return;
  }
  const taxRate = getTaxRate(item.zipCode, item.taxCode, item.taxExempt);
  const taxAmount = Number(item.unitCost) * Number(item.availableQty) * taxRate;
  if (taxAmount > 0) {
    businessData.incomeStatement.taxes.push({
      name: `Tax for ${item.name}`,
      amount: taxAmount
    });
    saveData();
    refreshAllDashboards();
    alert(`Tax of $${taxAmount.toFixed(2)} for "${item.name}" recorded.`);
  }
}

// Helper: refresh dashboards if those functions exist
function refreshAllDashboards() {
  if (typeof renderIncomeStatement === 'function') renderIncomeStatement();
  if (typeof renderBalanceSheet === 'function') renderBalanceSheet();
  if (typeof renderCashFlow === 'function') renderCashFlow();
  if (typeof renderInventoryDashboard === 'function') renderInventoryDashboard();
  if (typeof refreshAllLinkStatus === 'function') refreshAllLinkStatus();
}

// Add action buttons to inventory table, keeping all existing columns and styles
function addInventoryActionButtons() {
  // Called after inventory table render
  document.querySelectorAll('#inventory-table tbody tr').forEach((row, idx) => {
    // Only add if not already present
    if (!row.querySelector('.action-btns')) {
      const btnCell = document.createElement('td');
      btnCell.className = 'action-btns';
      btnCell.innerHTML = `
        <button class="record-sale-btn" data-idx="${idx}" title="Record Sale">Sale</button>
        <button class="record-expense-btn" data-idx="${idx}" title="Record Expense">Expense</button>
        <button class="record-loan-btn" data-idx="${idx}" title="Record Loan">Loan</button>
        <button class="record-tax-btn" data-idx="${idx}" title="Record Tax">Tax</button>
      `;
      row.appendChild(btnCell);
    }
  });

  document.querySelectorAll('.record-sale-btn').forEach(btn => {
    btn.onclick = () => recordInventorySale(Number(btn.dataset.idx));
  });
  document.querySelectorAll('.record-expense-btn').forEach(btn => {
    btn.onclick = () => recordInventoryExpense(Number(btn.dataset.idx));
  });
  document.querySelectorAll('.record-loan-btn').forEach(btn => {
    btn.onclick = () => recordInventoryLoan(Number(btn.dataset.idx));
  });
  document.querySelectorAll('.record-tax-btn').forEach(btn => {
    btn.onclick = () => recordInventoryTax(Number(btn.dataset.idx));
  });
}

// --- Integration instructions ---
// 1. Place this file in your project as inventoryActions.js
// 2. Add <script src="inventoryActions.js"></script> in your HTML after your main dashboard JS.
// 3. At the end of renderInventoryTable(), call: addInventoryActionButtons();
//    For example, after the table is rendered and before the summary line:
//    addInventoryActionButtons();
// That's it! Your structure, style, and all logic remain unchanged—now with direct links to every statement.
