// ----- Persistent Data Structure -----
let businessData = JSON.parse(localStorage.getItem('businessData')) || {
  incomeStatement: {
    revenues: [],
    beginInventory: [],
    purchases: [],
    endInventory: [],
    operatingExpenses: [],
    otherIncome: [],
    otherExpense: [],
    taxes: []
  },
  balanceSheet: {
    currentAssets: [],
    fixedAssets: [],
    currentLiabilities: [],
    longLiabilities: [],
    contributionCapital: [],
    otherCapital: []
  },
  cashFlow: {
    operIn: [],
    operOut: [],
    investIn: [],
    investOut: [],
    finIn: [],
    finOut: []
  },
  inventory: []
};

// Helper to save to localStorage anytime data changes
function saveData() {
  localStorage.setItem('businessData', JSON.stringify(businessData));
}

// ----- Stripe/Trial Access -----
const now = Date.now();
let trialStart = localStorage.getItem('trialStart');
let paid = localStorage.getItem('paid');
if (!trialStart) localStorage.setItem('trialStart', now);
function checkAccess() {
  trialStart = Number(localStorage.getItem('trialStart'));
  paid = localStorage.getItem('paid');
  const daysElapsed = (Date.now() - trialStart) / (1000 * 60 * 60 * 24);
  const isTrialActive = daysElapsed <= 14;
  if (paid === 'yes' || isTrialActive) {
    document.getElementById('dashboard-content').style.display = 'block';
    document.getElementById('payment-box').style.display = 'none';
  } else {
    document.getElementById('dashboard-content').style.display = 'none';
    document.getElementById('payment-box').style.display = 'block';
  }
}
checkAccess();

// ----- Tab Navigation -----
document.querySelectorAll('.navbar button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.navbar button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'income') renderIncomeStatement();
    if (btn.dataset.tab === 'balance') renderBalanceSheet();
    if (btn.dataset.tab === 'cashflow') renderCashFlow();
    if (btn.dataset.tab === 'inventory') renderInventoryDashboard();
  };
});

// ----- Addable List Utility -----
function AddableList(container, { subtitle, items, setItems, totalLabel, positive = true, allowEmpty = false, inOrOut = "in" }) {
  function render() {
    container.innerHTML = '';
    if (subtitle) {
      const sub = document.createElement('div');
      sub.className = positive ? "cf-subtitle" : "cf-subtitle cf-out";
      sub.textContent = subtitle;
      container.appendChild(sub);
    }
    // List
    const ul = document.createElement('ul');
    items.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'addable-list-item';
      li.innerHTML = `<span>${item.name}</span>
        <span class="amount${!positive || inOrOut === "out" ? ' negative' : ''}">${positive || inOrOut === "in" ? '+' : '-'}$${item.amount}</span>
        <button class="delete-btn" title="Delete">×</button>`;
      li.querySelector('.delete-btn').onclick = () => {
        items.splice(idx, 1);
        setItems([...items]);
      };
      ul.appendChild(li);
    });
    container.appendChild(ul);
    // Input row
    if (container.dataset.adding === "true") {
      const inputRow = document.createElement('div');
      inputRow.className = 'input-row';
      const nameInput = document.createElement('input');
      nameInput.type = "text";
      nameInput.placeholder = "Item name";
      const amtInput = document.createElement('input');
      amtInput.type = "number";
      amtInput.placeholder = "Amount";
      const addBtn = document.createElement('button');
      addBtn.className = "add-btn";
      addBtn.textContent = "Add";
      addBtn.onclick = (e) => {
        e.preventDefault();
        if (nameInput.value && amtInput.value !== "") {
          items.push({ name: nameInput.value, amount: Number(amtInput.value) });
          container.dataset.adding = "false";
          setItems([...items]);
        }
      };
      inputRow.appendChild(nameInput);
      inputRow.appendChild(amtInput);
      inputRow.appendChild(addBtn);
      container.appendChild(inputRow);
    }
    // Add button
    if (container.dataset.adding !== "true") {
      const addBtn = document.createElement('button');
      addBtn.className = positive || inOrOut === "in" ? 'add-btn' : 'plus-btn';
      addBtn.textContent = "+ Add Item";
      addBtn.type = "button";
      addBtn.onclick = () => {
        container.dataset.adding = "true";
        render();
        container.querySelector("input")?.focus();
      };
      container.appendChild(addBtn);
    }
    // Subtotal
    const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
    if (items.length > 0 || allowEmpty) {
      const subTotalDiv = document.createElement('div');
      subTotalDiv.className = positive || inOrOut === "in" ? 'cf-subtotal' : 'cf-subtotal cf-out';
      subTotalDiv.textContent = `${totalLabel || "Subtotal"}: $${subtotal}`;
      container.appendChild(subTotalDiv);
    }
    saveData(); // Save on every change
  }
  render();
  return render;
}

// ----- Income Statement -----
function renderIncomeStatement() {
  const box = document.querySelector('.income-box');
  box.innerHTML = `
    <h2>Income Statement Breakdown</h2>
    <button onclick="window.print()" class="print-btn">🖨️ Print/Export</button>
    <div class="inc-section">
      <div class="inc-subhead">1️⃣ Revenue</div>
      <div class="inc-desc">Money earned from core operations.</div>
      <div id="revenue-list"></div>
      <div class="inc-subtotal" id="total-revenue"></div>
    </div>
    <div class="inc-section">
      <div class="inc-subhead">2️⃣ Cost of Goods Sold (COGS)</div>
      <div class="inc-desc">Direct costs of production.</div>
      <div id="begin-inventory-list"></div>
      <div id="purchases-list"></div>
      <div id="end-inventory-list"></div>
      <div class="inc-subtotal" id="total-cogs"></div>
    </div>
    <div class="inc-row-highlight" id="gross-profit"></div>
    <div class="inc-section">
      <div class="inc-subhead">4️⃣ Operating Expenses</div>
      <div class="inc-desc">Costs not directly tied to production.</div>
      <div id="operating-expenses-list"></div>
      <div class="inc-subtotal red" id="total-operating-expenses"></div>
    </div>
    <div class="inc-row-highlight blue" id="operating-income"></div>
    <div class="inc-section">
      <div class="inc-subhead">6️⃣ Other Income / Expense</div>
      <div class="inc-desc">Interest, dividends, etc.</div>
      <div id="other-income-list"></div>
      <div id="other-expense-list"></div>
      <div class="inc-subtotal" id="net-other"></div>
    </div>
    <div class="inc-row-highlight green" id="net-income-before-tax"></div>
    <div class="inc-section">
      <div class="inc-subhead">8️⃣ Taxes</div>
      <div class="inc-desc">Can be manually added or entered as %.</div>
      <div id="taxes-list"></div>
      <div class="inc-subtotal red" id="total-taxes"></div>
    </div>
    <div class="inc-row-final" id="final-net-income"></div>
  `;

  const state = businessData.incomeStatement;
  // Auto-sync inventory COGS
  state.beginInventory = businessData.inventory.map(item => ({
    name: item.name,
    amount: item.unitCost * item.availableQty
  }));

  function updateAll() {
    AddableList(document.getElementById("revenue-list"), {
      items: state.revenues,
      setItems: arr => { state.revenues = arr; updateAll(); }
    });
    const totalRevenue = state.revenues.reduce((sum, i) => sum + i.amount, 0);
    document.getElementById("total-revenue").textContent = `Total Revenue = $${totalRevenue}`;

    AddableList(document.getElementById("begin-inventory-list"), {
      items: state.beginInventory,
      setItems: arr => { state.beginInventory = arr; updateAll(); },
      positive: false
    });
    AddableList(document.getElementById("purchases-list"), {
      items: state.purchases,
      setItems: arr => { state.purchases = arr; updateAll(); },
      positive: false
    });
    AddableList(document.getElementById("end-inventory-list"), {
      items: state.endInventory,
      setItems: arr => { state.endInventory = arr; updateAll(); },
      positive: true
    });
    const totalBeginInventory = state.beginInventory.reduce((sum, i) => sum + i.amount, 0);
    const totalPurchases = state.purchases.reduce((sum, i) => sum + i.amount, 0);
    const totalEndInventory = state.endInventory.reduce((sum, i) => sum + i.amount, 0);
    const totalCOGS = totalBeginInventory + totalPurchases - totalEndInventory;
    document.getElementById("total-cogs").textContent =
      `COGS = Beginning Inventory + Purchases − Ending Inventory
COGS = $${totalBeginInventory} + $${totalPurchases} − $${totalEndInventory} = $${totalCOGS}`;

    const grossProfit = totalRevenue - totalCOGS;
    document.getElementById("gross-profit").innerHTML =
      `3️⃣ Gross Profit = Revenue − COGS = $${totalRevenue} − ($${totalCOGS}) = <span style="font-size:18px;">$${grossProfit}</span>`;

    AddableList(document.getElementById("operating-expenses-list"), {
      items: state.operatingExpenses,
      setItems: arr => { state.operatingExpenses = arr; updateAll(); },
      positive: false
    });
    const totalOperatingExpenses = state.operatingExpenses.reduce((sum, i) => sum + i.amount, 0);
    document.getElementById("total-operating-expenses").textContent =
      `Total Operating Expenses = $${totalOperatingExpenses}`;

    const operatingIncome = grossProfit - totalOperatingExpenses;
    document.getElementById("operating-income").innerHTML =
      `5️⃣ Operating Income = Gross Profit − Operating Expenses = $${grossProfit} − $${totalOperatingExpenses} = <span style="font-size:18px;">$${operatingIncome}</span>`;

    AddableList(document.getElementById("other-income-list"), {
      items: state.otherIncome,
      setItems: arr => { state.otherIncome = arr; updateAll(); },
      positive: true
    });
    AddableList(document.getElementById("other-expense-list"), {
      items: state.otherExpense,
      setItems: arr => { state.otherExpense = arr; updateAll(); },
      positive: false
    });
    const totalOtherIncome = state.otherIncome.reduce((sum, i) => sum + i.amount, 0);
    const totalOtherExpense = state.otherExpense.reduce((sum, i) => sum + i.amount, 0);
    const netOther = totalOtherIncome - totalOtherExpense;
    document.getElementById("net-other").innerHTML =
      `Net Other = $${totalOtherIncome} − $${totalOtherExpense} = <span style="color:#187a27;">$${netOther}</span>`;

    const netIncomeBeforeTax = operatingIncome + netOther;
    document.getElementById("net-income-before-tax").innerHTML =
      `7️⃣ Net Income Before Tax = Operating Income + Net Other = $${operatingIncome} + $${netOther} = <span style="font-size:18px;">$${netIncomeBeforeTax}</span>`;

    AddableList(document.getElementById("taxes-list"), {
      items: state.taxes,
      setItems: arr => { state.taxes = arr; updateAll(); },
      positive: false
    });
    const totalTaxes = state.taxes.reduce((sum, i) => sum + i.amount, 0);
    document.getElementById("total-taxes").textContent = `Total Taxes = $${totalTaxes}`;

    const netIncome = netIncomeBeforeTax - totalTaxes;
    document.getElementById("final-net-income").innerHTML =
      `9️⃣ Net Income = Net Income Before Tax − Taxes = $${netIncomeBeforeTax} − $${totalTaxes} = <span style="font-size:22px;">$${netIncome}</span>`;
  }
  updateAll();
}

// ----- Balance Sheet -----
function renderBalanceSheet() {
  const box = document.querySelector('.balance-box');
  box.innerHTML = `
    <button onclick="window.print()" class="print-btn">🖨️ Print/Export</button>
    <div class="section-heading">Assets</div>
    <div class="addable-list-section">
      <div class="sub-heading">Current Assets</div>
      <div id="current-assets-list" class="addable-list"></div>
      <div class="subtotal" id="total-current-assets"></div>
    </div>
    <div class="addable-list-section">
      <div class="sub-heading">Fixed Assets</div>
      <div id="fixed-assets-list" class="addable-list"></div>
      <div class="subtotal" id="total-fixed-assets"></div>
    </div>
    <div class="total-row" id="total-assets"></div>
    <div class="section-heading">Liabilities</div>
    <div class="addable-list-section">
      <div class="sub-heading">Current Liabilities</div>
      <div id="current-liabilities-list" class="addable-list"></div>
      <div class="subtotal" id="total-current-liabilities"></div>
    </div>
    <div class="addable-list-section">
      <div class="sub-heading">Long-term Liabilities</div>
      <div id="long-liabilities-list" class="addable-list"></div>
      <div class="subtotal" id="total-long-liabilities"></div>
    </div>
    <div class="total-row" id="total-liabilities"></div>
    <div class="section-heading">Owner's Equity</div>
    <div class="addable-list-section">
      <div class="sub-heading">Contribution Capital</div>
      <div id="contribution-capital-list" class="addable-list"></div>
      <div class="subtotal" id="total-contribution-capital"></div>
    </div>
    <div class="addable-list-section">
      <div class="sub-heading">Other Capital</div>
      <div id="other-capital-list" class="addable-list"></div>
      <div class="subtotal" id="total-other-capital"></div>
    </div>
    <div class="total-row" id="total-equity"></div>
    <div class="total-row" id="total-liabilities-equity"></div>
    <div class="balance-status" id="balance-status"></div>
    <div class="final-assets" id="final-total-assets"></div>
  `;
  const state = businessData.balanceSheet;
  function updateAll() {
    [
      { key: "currentAssets", label: "total-current-assets", list: "current-assets-list" },
      { key: "fixedAssets", label: "total-fixed-assets", list: "fixed-assets-list" },
      { key: "currentLiabilities", label: "total-current-liabilities", list: "current-liabilities-list" },
      { key: "longLiabilities", label: "total-long-liabilities", list: "long-liabilities-list" },
      { key: "contributionCapital", label: "total-contribution-capital", list: "contribution-capital-list" },
      { key: "otherCapital", label: "total-other-capital", list: "other-capital-list" }
    ].forEach(sec => {
      AddableList(
        document.getElementById(sec.list),
        {
          items: state[sec.key],
          setItems: arr => {
            state[sec.key] = arr;
            updateAll();
          }
        }
      );
      document.getElementById(sec.label).textContent =
        `${document.querySelector(`#${sec.list}`).previousElementSibling.textContent}: $${state[sec.key].reduce((sum, i) => sum + i.amount, 0)}`;
    });

    const totalCurrentAssets = state.currentAssets.reduce((sum, i) => sum + i.amount, 0);
    const totalFixedAssets = state.fixedAssets.reduce((sum, i) => sum + i.amount, 0);
    const totalAssets = totalCurrentAssets + totalFixedAssets;
    document.getElementById("total-assets").innerHTML =
      `Total Assets = $${totalCurrentAssets} + $${totalFixedAssets} = <span>$${totalAssets}</span>`;

    const totalCurrentLiabilities = state.currentLiabilities.reduce((sum, i) => sum + i.amount, 0);
    const totalLongLiabilities = state.longLiabilities.reduce((sum, i) => sum + i.amount, 0);
    const totalLiabilities = totalCurrentLiabilities + totalLongLiabilities;
    document.getElementById("total-liabilities").innerHTML =
      `Total Liabilities = $${totalCurrentLiabilities} + $${totalLongLiabilities} = <span>$${totalLiabilities}</span>`;

    const totalContributionCapital = state.contributionCapital.reduce((sum, i) => sum + i.amount, 0);
    const totalOtherCapital = state.otherCapital.reduce((sum, i) => sum + i.amount, 0);
    const totalEquity = totalContributionCapital + totalOtherCapital;
    document.getElementById("total-equity").innerHTML =
      `Total Owner's Equity = $${totalContributionCapital} + $${totalOtherCapital} = <span>$${totalEquity}</span>`;

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    document.getElementById("total-liabilities-equity").innerHTML =
      `Total Liabilities + Owner's Equity = $${totalLiabilities} + $${totalEquity} = <span>$${totalLiabilitiesAndEquity}</span>`;

    const balanced = totalLiabilitiesAndEquity === totalAssets;
    const balStatus = document.getElementById("balance-status");
    balStatus.textContent = balanced ? "Balanced ✔" : "Not Balanced ✖";
    balStatus.className = "balance-status " + (balanced ? "balanced" : "not-balanced");

    document.getElementById("final-total-assets").textContent = `Total Assets = $${totalAssets}`;
  }
  updateAll();
}

// ----- Cash Flow -----
function renderCashFlow() {
  const box = document.querySelector('.cashflow-card');
  box.innerHTML = `
    <button onclick="window.print()" class="print-btn">🖨️ Print/Export</button>
    <div class="section-title">Cash Flows from Operating Activities (Core business)</div>
    <div id="oper-in-list"></div>
    <div id="oper-out-list"></div>
    <div class="cf-total-row" id="oper-total"></div>
    <div class="section-title">Cash Flows from Investing Activities (Long-term assets)</div>
    <div id="invest-in-list"></div>
    <div id="invest-out-list"></div>
    <div class="cf-total-row" id="invest-total"></div>
    <div class="section-title">Cash Flows from Financing Activities (Cash from owners or banks)</div>
    <div id="fin-in-list"></div>
    <div id="fin-out-list"></div>
    <div class="cf-total-row" id="fin-total"></div>
    <div class="cf-final-total" id="net-cash-change"></div>
  `;
  const state = businessData.cashFlow;
  function updateAll() {
    AddableList(document.getElementById("oper-in-list"), {
      subtitle: "➕ Adjusted for inflows",
      items: state.operIn,
      setItems: arr => { state.operIn = arr; updateAll(); },
      totalLabel: "Total Inflow",
      inOrOut: "in"
    });
    AddableList(document.getElementById("oper-out-list"), {
      subtitle: "➖ Adjusted for outflows",
      items: state.operOut,
      setItems: arr => { state.operOut = arr; updateAll(); },
      totalLabel: "Total Outflow",
      inOrOut: "out"
    });
    const totalOperIn = state.operIn.reduce((sum, i) => sum + i.amount, 0);
    const totalOperOut = state.operOut.reduce((sum, i) => sum + i.amount, 0);
    const totalOper = totalOperIn - totalOperOut;
    document.getElementById("oper-total").innerHTML =
      `Total Operating Cash Flow = $${totalOperIn} - $${totalOperOut} = <span style="color:#187a27;">$${totalOper}</span>`;

    AddableList(document.getElementById("invest-in-list"), {
      subtitle: "➕ Inflows",
      items: state.investIn,
      setItems: arr => { state.investIn = arr; updateAll(); },
      totalLabel: "Total Inflow",
      inOrOut: "in"
    });
    AddableList(document.getElementById("invest-out-list"), {
      subtitle: "➖ Outflows",
      items: state.investOut,
      setItems: arr => { state.investOut = arr; updateAll(); },
      totalLabel: "Total Outflow",
      inOrOut: "out"
    });
    const totalInvestIn = state.investIn.reduce((sum, i) => sum + i.amount, 0);
    const totalInvestOut = state.investOut.reduce((sum, i) => sum + i.amount, 0);
    const totalInvest = totalInvestIn - totalInvestOut;
    document.getElementById("invest-total").innerHTML =
      `Total Investing Cash Flow = $${totalInvestIn} - $${totalInvestOut} = <span style="color:#187a27;">$${totalInvest}</span>`;

    AddableList(document.getElementById("fin-in-list"), {
      subtitle: "➕ Inflows",
      items: state.finIn,
      setItems: arr => { state.finIn = arr; updateAll(); },
      totalLabel: "Total Inflow",
      inOrOut: "in"
    });
    AddableList(document.getElementById("fin-out-list"), {
      subtitle: "➖ Outflows",
      items: state.finOut,
      setItems: arr => { state.finOut = arr; updateAll(); },
      totalLabel: "Total Outflow",
      inOrOut: "out"
    });
    const totalFinIn = state.finIn.reduce((sum, i) => sum + i.amount, 0);
    const totalFinOut = state.finOut.reduce((sum, i) => sum + i.amount, 0);
    const totalFin = totalFinIn - totalFinOut;
    document.getElementById("fin-total").innerHTML =
      `Total Financing Cash Flow = $${totalFinIn} - $${totalFinOut} = <span style="color:#187a27;">$${totalFin}</span>`;

    // Net Change
    const netChange = totalOper + totalInvest + totalFin;
    const netDiv = document.getElementById("net-cash-change");
    netDiv.className = "cf-final-total" + (netChange < 0 ? " negative" : "");
    netDiv.innerHTML =
      `<b>Net Change in Cash = ${totalOper} (Operating) + ${totalInvest} (Investing) + ${totalFin} (Financing) = <span>$${netChange}</span></b>`;
  }
  updateAll();
}

// ----- TAX RATE HELPER -----
function taxRateForCategory(cat) {
  // Example rates; adjust as needed
  if (cat === "Sales Tax") return 0.07;
  if (cat === "VAT") return 0.10;
  if (cat === "Excise") return 0.05;
  return 0;
}

// ----- Inventory Management -----
function renderInventoryDashboard() {
  const container = document.querySelector('.dashboard-container');
  container.innerHTML = `
    <details class="info-panel" open>
      <summary>ℹ️ Dashboard Field Reference</summary>
      <table class="terms-table">
        <thead>
          <tr>
            <th>Dashboard Field</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>SKU</td><td>Unique identifier</td></tr>
          <tr><td>Name</td><td>Item name</td></tr>
          <tr><td>Category</td><td>Group label</td></tr>
          <tr><td>Unit Cost</td><td>Price per unit</td></tr>
          <tr><td>Selling Price</td><td>Sales price per unit</td></tr>
          <tr><td>Available Qty</td><td>Number available for sale</td></tr>
          <tr><td>Tax Category</td><td>Tax rules for this item</td></tr>
        </tbody>
      </table>
    </details>
    <div class="category-filters" id="category-filters"></div>
    <input id="category-search" type="text" placeholder="Type category to filter..." style="margin:10px 0; width:100%;">
    <form id="add-form" autocomplete="off">
      <div class="form-row">
        <input required id="sku" placeholder="SKU" maxlength="12">
        <input required id="name" placeholder="Name">
        <select id="category" required>
          <option value="">Select Category...</option>
          <option value="Grocery">Grocery</option>
          <option value="Medical">Medical</option>
          <option value="Electronics">Electronics</option>
          <option value="Stationery">Stationery</option>
          <option value="Office Supplies">Office Supplies</option>
          <option value="Personal Care">Personal Care</option>
          <option value="Toys">Toys</option>
          <option value="Beverages">Beverages</option>
          <option value="Clothing">Clothing</option>
          <option value="Cleaning Supplies">Cleaning Supplies</option>
        </select>
        <input required id="unit-cost" type="number" min="0" step="0.01" placeholder="Unit Cost">
        <input required id="selling-price" type="number" min="0" step="0.01" placeholder="Selling Price">
        <input required id="available-qty" type="number" min="0" step="1" placeholder="Available Qty">
        <select id="tax-category" required>
          <option value="">Select Tax Category...</option>
          <option value="Sales Tax">Sales Tax</option>
          <option value="VAT">VAT</option>
          <option value="No Tax">No Tax</option>
          <option value="Excise">Excise</option>
        </select>
      </div>
      <div class="form-row">
        <button type="submit" class="add-btn">Add Item</button>
      </div>
    </form>
    <div class="inventory-list-section">
      <h2>Inventory List</h2>
      <div class="table-scroll">
        <table id="inventory-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Unit Cost</th>
              <th>Selling Price</th>
              <th>Available Qty</th>
              <th>Tax Category</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      <div class="category-summary" id="category-summary"></div>
    </div>
  `;

  function uniqueCategories() {
    return [...new Set(businessData.inventory.map(item => item.category && item.category.trim()))].filter(Boolean);
  }

  function renderCategoryFilters() {
    const container = document.getElementById('category-filters');
    container.innerHTML = '';
    const cats = ["All", ...uniqueCategories()];
    cats.forEach(cat => {
      const btn = document.createElement("button");
      btn.textContent = cat;
      btn.className = "category-btn";
      btn.onclick = () => {
        document.getElementById('category-search').value = "";
        renderInventoryTable(cat);
      };
      container.appendChild(btn);
    });
  }

  function renderInventoryTable(filterCategory = "All") {
    const searchValue = document.getElementById('category-search').value.trim().toLowerCase();
    let filtered = businessData.inventory;
    if (filterCategory !== "All") filtered = filtered.filter(item => item.category === filterCategory);
    if (searchValue) filtered = filtered.filter(item => item.category && item.category.toLowerCase().includes(searchValue));
    const tbody = document.querySelector('#inventory-table tbody');
    tbody.innerHTML = '';
    filtered.forEach((item, idx) => {
      tbody.innerHTML += `
        <tr>
          <td>${item.sku || ""}</td>
          <td>${item.name || ""}</td>
          <td>${item.category || ""}</td>
          <td>$${item.unitCost !== undefined && !isNaN(item.unitCost) ? Number(item.unitCost).toFixed(2) : ""}</td>
          <td>$${item.sellingPrice !== undefined && !isNaN(item.sellingPrice) ? Number(item.sellingPrice).toFixed(2) : ""}</td>
          <td>${item.availableQty !== undefined && !isNaN(item.availableQty) ? item.availableQty : ""}</td>
          <td>${item.taxCategory || ""}</td>
          <td><button class="remove-btn" data-idx="${idx}">Remove</button></td>
        </tr>
      `;
    });
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.onclick = () => {
        businessData.inventory.splice(Number(btn.dataset.idx), 1);
        autoSyncInventoryToStatements();
        saveData();
        renderCategoryFilters();
        renderInventoryTable(filterCategory);
        renderIncomeStatement();
        renderBalanceSheet();
        renderCashFlow();
      };
    });
    document.getElementById('category-summary').innerHTML = `Showing <b>${filtered.length}</b> items.`;
  }

  // Tax auto-pop logic and popup
  const categorySelect = document.getElementById('category');
  const taxSelect = document.getElementById('tax-category');
  categorySelect.addEventListener('change', () => {
    let autoTax = "Sales Tax";
    let popMsg = "";
    if (categorySelect.value === "Grocery" || categorySelect.value === "Medical") {
      autoTax = "No Tax";
      popMsg = "This item is typically tax exempt.";
    }
    taxSelect.value = autoTax;
    if (popMsg) alert(popMsg);
  });

  function addItem(e) {
    e.preventDefault();
    const sku = document.getElementById('sku').value.trim();
    const name = document.getElementById('name').value.trim();
    const category = document.getElementById('category').value.trim();
    const unitCost = parseFloat(document.getElementById('unit-cost').value);
    const sellingPrice = parseFloat(document.getElementById('selling-price').value);
    const availableQty = parseInt(document.getElementById('available-qty').value);
    const taxCategory = document.getElementById('tax-category').value;
    if (!sku || !name || !category || isNaN(unitCost) || isNaN(sellingPrice) || isNaN(availableQty) || !taxCategory || unitCost < 0 || sellingPrice < 0 || availableQty < 0) {
      alert("Fill all required fields correctly.");
      return;
    }
    const item = { sku, name, category, unitCost, sellingPrice, availableQty, taxCategory };
    businessData.inventory.push(item);

   
    // Save tax info (auto)
    if (taxCategory !== "No Tax") {
      businessData.incomeStatement.taxes.push({
        name: name + " (" + taxCategory + ")",
        amount: Math.round(unitCost * availableQty * taxRateForCategory(taxCategory) * 100) / 100
      });
    }

    autoSyncInventoryToStatements();
    saveData();
    renderCategoryFilters();
    renderInventoryTable();
    renderIncomeStatement();
    renderBalanceSheet();
    renderCashFlow();
    document.getElementById('add-form').reset();
  }

  document.getElementById('add-form').onsubmit = addItem;
  document.getElementById('category-search').oninput = function () {
    renderInventoryTable();
  };

  renderCategoryFilters();
  renderInventoryTable();
}

// --- 2. Auto-Link Inventory to Financial Statements ---
function autoSyncInventoryToStatements() {
  // Revenue/COGS for Income Statement
  businessData.incomeStatement.revenues = businessData.inventory.map(item => ({
    name: item.name,
    amount: (item.sellingPrice || 0) * (item.availableQty || 0)
  }));

  businessData.incomeStatement.beginInventory = businessData.inventory.map(item => ({
    name: item.name,
    amount: (item.unitCost || 0) * (item.availableQty || 0)
  }));

  // Balance Sheet
  businessData.balanceSheet.currentAssets = businessData.inventory.filter(item =>
    !["Electronics", "Medical"].includes(item.category)
  ).map(item => ({
    name: item.name,
    amount: (item.unitCost || 0) * (item.availableQty || 0)
  }));

  businessData.balanceSheet.fixedAssets = businessData.inventory.filter(item =>
    ["Electronics", "Medical"].includes(item.category)
  ).map(item => ({
    name: item.name,
    amount: (item.unitCost || 0) * (item.availableQty || 0)
  }));

  // Cash Flow (outflow for purchases)
  businessData.cashFlow.operOut = businessData.inventory.map(item => ({
    name: `Purchase: ${item.name}`,
    amount: (item.unitCost || 0) * (item.availableQty || 0)
  }));
}

// --- Initial tab render ---
window.addEventListener('DOMContentLoaded', () => {
  renderIncomeStatement();
});