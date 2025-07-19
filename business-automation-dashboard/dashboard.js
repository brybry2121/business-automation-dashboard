// Tab navigation: ensures initial and tab switching logic
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

// --- Addable List (used by financial tabs) ---
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
  }
  render();
  return render;
}

// ----------- Income Statement -----------
function renderIncomeStatement() {
  const box = document.querySelector('.income-box');
  box.innerHTML = `
    <h2>Income Statement Breakdown</h2>
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

  // State for income statement
  const state = {
    revenues: [],
    beginInventory: [],
    purchases: [],
    endInventory: [],
    operatingExpenses: [],
    otherIncome: [],
    otherExpense: [],
    taxes: []
  };

  function updateAll() {
    // Revenue
    AddableList(document.getElementById("revenue-list"), {
      items: state.revenues,
      setItems: arr => { state.revenues = arr; updateAll(); },
      positive: true
    });
    const totalRevenue = state.revenues.reduce((sum, i) => sum + i.amount, 0);
    document.getElementById("total-revenue").textContent = `Total Revenue = $${totalRevenue}`;

    // COGS
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

    // Gross Profit
    const grossProfit = totalRevenue - totalCOGS;
    document.getElementById("gross-profit").innerHTML =
      `3️⃣ Gross Profit = Revenue − COGS = $${totalRevenue} − ($${totalCOGS}) = <span style="font-size:18px;">$${grossProfit}</span>`;

    // Operating Expenses
    AddableList(document.getElementById("operating-expenses-list"), {
      items: state.operatingExpenses,
      setItems: arr => { state.operatingExpenses = arr; updateAll(); },
      positive: false
    });
    const totalOperatingExpenses = state.operatingExpenses.reduce((sum, i) => sum + i.amount, 0);
    document.getElementById("total-operating-expenses").textContent =
      `Total Operating Expenses = $${totalOperatingExpenses}`;

    // Operating Income
    const operatingIncome = grossProfit - totalOperatingExpenses;
    document.getElementById("operating-income").innerHTML =
      `5️⃣ Operating Income = Gross Profit − Operating Expenses = $${grossProfit} − $${totalOperatingExpenses} = <span style="font-size:18px;">$${operatingIncome}</span>`;

    // Other Income/Expense
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

    // Net Income Before Tax
    const netIncomeBeforeTax = operatingIncome + netOther;
    document.getElementById("net-income-before-tax").innerHTML =
      `7️⃣ Net Income Before Tax = Operating Income + Net Other = $${operatingIncome} + $${netOther} = <span style="font-size:18px;">$${netIncomeBeforeTax}</span>`;

    // Taxes
    AddableList(document.getElementById("taxes-list"), {
      items: state.taxes,
      setItems: arr => { state.taxes = arr; updateAll(); },
      positive: false
    });
    const totalTaxes = state.taxes.reduce((sum, i) => sum + i.amount, 0);
    document.getElementById("total-taxes").textContent = `Total Taxes = $${totalTaxes}`;

    // Final Net Income
    const netIncome = netIncomeBeforeTax - totalTaxes;
    document.getElementById("final-net-income").innerHTML =
      `9️⃣ Net Income = Net Income Before Tax − Taxes = $${netIncomeBeforeTax} − $${totalTaxes} = <span style="font-size:22px;">$${netIncome}</span>`;
  }
  updateAll();
}

// ----------- Balance Sheet -----------
function renderBalanceSheet() {
  const box = document.querySelector('.balance-box');
  box.innerHTML = `
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

  const state = {
    currentAssets: [],
    fixedAssets: [],
    currentLiabilities: [],
    longLiabilities: [],
    contributionCapital: [],
    otherCapital: []
  };

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

    // Totals
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

// ----------- Cash Flow -----------
function renderCashFlow() {
  const box = document.querySelector('.cashflow-card');
  box.innerHTML = `
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
  const state = {
    operIn: [],
    operOut: [],
    investIn: [],
    investOut: [],
    finIn: [],
    finOut: []
  };
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

// ----------- Inventory Management (Responsive + Dropdown + Auto Tax Code) -----------
function renderInventoryDashboard() {
  const container = document.querySelector('.dashboard-container');
  container.innerHTML = `
    <details class="info-panel" open>
      <summary>ℹ️ Dashboard Field Reference</summary>
      <table class="terms-table">
        <thead>
          <tr>
            <th>Dashboard Field</th>
            <th>Quote Detail Explanation</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>SKU</td><td>Unique identifier used in the quote to reference the exact item.</td></tr>
          <tr><td>Name</td><td>Item name as it will appear on the quote and invoice.</td></tr>
          <tr><td>Category</td><td>Group label (e.g. Electronics, Stationery)—helps in filtering quotes.</td></tr>
          <tr><td>Unit Cost</td><td>Price per unit, used to calculate total price in the quote.</td></tr>
          <tr><td>Available Qty</td><td>Number of units available for sale.</td></tr>
          <tr><td>Product Description</td><td>Short detail—highlight features, model, usage, or relevant specs.</td></tr>
          <tr><td>Tax Code</td><td>Assigns correct tax rules per item type.</td></tr>
          <tr><td>Tax Exempt</td><td>Flag for items exempt from tax (e.g. groceries, medical supplies).</td></tr>
          <tr><td>ZIP Code</td><td>Used for location-aware tax calculations.</td></tr>
          <tr><td>Expiry Date</td><td>Relevant for perishable goods—can be shown as “Best before: [Date]”.</td></tr>
        </tbody>
      </table>
    </details>
    <div class="category-filters" id="category-filters"></div>
    <input id="category-search" type="text" placeholder="Type category to filter (e.g. Stationery, Electronics, Grocery...)" style="margin:10px 0; width:100%;">

    <form id="add-form" autocomplete="off">
      <div class="form-row">
        <input required id="sku" placeholder="SKU" maxlength="12">
        <input required id="name" placeholder="Name">
        <div style="position:relative;flex:1;">
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
        </div>
        <div style="display:flex;flex-direction:row;align-items:center;gap:4px;">
          <input required id="unit-cost" type="number" min="0" step="0.01" placeholder="Unit Cost" style="width:100px;">
          <select id="cost-unit">
            <option value="item">per item</option>
            <option value="kg">per kg</option>
            <option value="liter">per liter</option>
            <option value="pack">per pack</option>
            <option value="box">per box</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:row;align-items:center;gap:4px;">
          <input required id="available-qty" type="number" min="0" step="1" placeholder="Available Qty" style="width:90px;">
          <select id="qty-unit">
            <option value="pcs">pcs</option>
            <option value="box">box</option>
            <option value="kg">kg</option>
            <option value="liter">liter</option>
            <option value="pack">pack</option>
          </select>
        </div>
        <select id="tax-code">
          <option value="TX-GROCERY">TX-GROCERY</option>
          <option value="TX-ELECTRONICS">TX-ELECTRONICS</option>
          <option value="TX-MEDICAL">TX-MEDICAL</option>
          <option value="TX-GENERAL">TX-GENERAL</option>
        </select>
        <label style="margin-left:8px;"><input type="checkbox" id="tax-exempt"> Tax Exempt</label>
        <input id="zip-code" placeholder="ZIP Code" maxlength="10" style="width:80px;">
      </div>
      <div class="form-row">
        <input id="description" placeholder="Product Description (optional)">
        <select id="status">
          <option value="in_stock">In Stock</option>
          <option value="backordered">Backordered</option>
          <option value="discontinued">Discontinued</option>
        </select>
        <input id="expiration" type="date" placeholder="Expiration">
      </div>
      <div class="form-row">
        <button type="submit" class="add-btn">Add Item</button>
      </div>
    </form>
    <div class="valuation-box">
      <button type="button" id="calculate-btn">Show Post-Tax Summary</button>
      <span id="valuation-result" class="valuation-result"></span>
    </div>
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
              <th>Available Qty</th>
              <th>Tax Code</th>
              <th>Tax Exempt</th>
              <th>ZIP Code</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Description</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      <div class="category-summary" id="category-summary"></div>
    </div>
  `;

  // --- Inventory logic ---
  let inventory = [];
  let currentCategoryFilter = "All";
  let uniqueCategories = () => [...new Set(inventory.map(item => item.category.trim()))].filter(Boolean);

  // --- Tax calculation logic ---
  function getTaxRate(zip, taxCode, taxExempt) {
    if (taxExempt) return 0;
    if (taxCode === "TX-GROCERY" || taxCode === "TX-MEDICAL") return 0;
    if (zip === "10001") return 0.08; // New York
    if (zip === "94105") return 0.09; // San Francisco
    return 0.07; // Default
  }

  function renderCategoryFilters() {
    const container = document.getElementById('category-filters');
    container.innerHTML = '';
    const cats = ["All", ...uniqueCategories()];
    cats.forEach(cat => {
      const btn = document.createElement("button");
      btn.textContent = cat;
      btn.className = "category-btn" + (currentCategoryFilter === cat ? " active" : "");
      btn.onclick = () => {
        currentCategoryFilter = cat;
        document.getElementById('category-search').value = "";
        renderEverything();
      };
      container.appendChild(btn);
    });
  }

  function getFilteredInventory() {
    const searchValue = document.getElementById('category-search')?.value.trim().toLowerCase();
    if (searchValue) {
      return inventory.filter(item => item.category.toLowerCase().includes(searchValue));
    }
    if (currentCategoryFilter === "All") return inventory;
    return inventory.filter(item => item.category === currentCategoryFilter);
  }

  function renderInventory() {
    const filtered = getFilteredInventory();
    const tbody = document.querySelector('#inventory-table tbody');
    tbody.innerHTML = '';
    filtered.forEach((item, idx) => {
      const realIdx = inventory.findIndex(inv => inv === item);
      tbody.innerHTML += `
        <tr>
          <td>${item.sku}</td>
          <td>${item.name}</td>
          <td>${item.category}</td>
          <td>$${item.unitCost.toFixed(2)} / ${item.costUnit}</td>
          <td>${item.availableQty} ${item.qtyUnit}</td>
          <td>${item.taxCode}</td>
          <td>${item.taxExempt ? "Yes" : "No"}</td>
          <td>${item.zipCode || ""}</td>
          <td>${item.status}</td>
          <td>${item.expiration ? formatDate(item.expiration) : ""}</td>
          <td>${item.description || ""}</td>
          <td><button class="remove-btn" data-idx="${realIdx}">Remove</button></td>
        </tr>
      `;
    });
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.onclick = () => { removeItem(Number(btn.dataset.idx)); };
    });
    renderCategorySummary(filtered);
  }
  function formatDate(str) { if (!str) return ""; const d = new Date(str); return d.toLocaleDateString(); }
  function renderCategorySummary(filtered) {
    document.getElementById('category-summary').innerHTML =
      `Showing <b>${filtered.length}</b> items.`;
  }
  function addItem(e) {
    e.preventDefault();
    const sku = document.getElementById('sku').value.trim();
    const name = document.getElementById('name').value.trim();
    const category = document.getElementById('category').value.trim();
    const unitCost = parseFloat(document.getElementById('unit-cost').value);
    const availableQty = parseInt(document.getElementById('available-qty').value);
    const costUnit = document.getElementById('cost-unit').value;
    const qtyUnit = document.getElementById('qty-unit').value;
    const taxCode = document.getElementById('tax-code').value;
    const taxExempt = document.getElementById('tax-exempt').checked;
    const zipCode = document.getElementById('zip-code').value.trim();
    const description = document.getElementById('description').value.trim();
    const status = document.getElementById('status').value;
    const expiration = document.getElementById('expiration').value;
    if (!sku || !name || !category || isNaN(unitCost) || isNaN(availableQty) || unitCost < 0 || availableQty < 0) {
      alert("Fill all required fields correctly.");
      return;
    }
    inventory.push({
      sku, name, category, unitCost, costUnit, availableQty, qtyUnit,
      taxCode, taxExempt, zipCode, description, status, expiration
    });
    renderEverything();
    document.getElementById('add-form').reset();
  }
  function removeItem(idx) {
    inventory.splice(idx, 1);
    renderEverything();
  }
  function showPostTaxPopup() {
    const filtered = getFilteredInventory();
    let subtotal = filtered.reduce((sum, item) => sum + item.unitCost * item.availableQty, 0);
    let tax = filtered.reduce((sum, item) => {
      const rate = getTaxRate(item.zipCode, item.taxCode, item.taxExempt);
      return sum + (item.unitCost * item.availableQty * rate);
    }, 0);
    let total = subtotal + tax;
    alert(`Subtotal: $${subtotal.toFixed(2)}\nTax: $${tax.toFixed(2)}\nTotal: $${total.toFixed(2)}`);
    document.getElementById('valuation-result').textContent =
      `Subtotal: $${subtotal.toFixed(2)}, Tax: $${tax.toFixed(2)}, Total: $${total.toFixed(2)}`;
  }
  function renderEverything() {
    renderCategoryFilters();
    renderInventory();

    // Responsive tax exemption logic & auto tax code switching
    const categorySelect = document.getElementById('category');
    const taxExemptCheckbox = document.getElementById('tax-exempt');
    const taxCodeSelect = document.getElementById('tax-code');
    categorySelect.onchange = function () {
      const val = categorySelect.value.toLowerCase();
      // Auto-switch tax exempt
      if (val === "grocery" || val === "medical") {
        taxExemptCheckbox.checked = true;
      } else {
        taxExemptCheckbox.checked = false;
      }
      // Auto-switch tax code
      if (val === "grocery")       taxCodeSelect.value = "TX-GROCERY";
      else if (val === "medical")  taxCodeSelect.value = "TX-MEDICAL";
      else if (val === "electronics") taxCodeSelect.value = "TX-ELECTRONICS";
      else                          taxCodeSelect.value = "TX-GENERAL";
    };
  }
  document.getElementById('add-form').onsubmit = addItem;
  document.getElementById('calculate-btn').onclick = showPostTaxPopup;
  document.getElementById('category-search').oninput = function () {
    currentCategoryFilter = "All";
    renderEverything();
  };
  renderEverything();
}

// --- Initial tab render ---
window.addEventListener('DOMContentLoaded', () => {
  renderIncomeStatement();
});