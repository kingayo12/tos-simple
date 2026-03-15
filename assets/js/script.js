// ═══════════════════════════════════════
// DATA STORE
// ═══════════════════════════════════════
const DB = {
  gatein: { import: [], empty: [] },
  gateout: { import: [], empty: [], export: [], emptyReturn: [], sales: [] },
};

// ═══════════════════════════════════════
// DATATABLE REGISTRY — tracks all active DT instances
// ═══════════════════════════════════════
const DTRegistry = {};

// ═══════════════════════════════════════
// LOAD SEED DATA
// ═══════════════════════════════════════
async function initData() {
  try {
    const res = await fetch("assets/js/data.json");
    const json = await res.json();
    DB.gatein.import = json.gatein?.import || [];
    DB.gatein.empty = json.gatein?.empty || [];
    DB.gateout.import = json.gateout?.import || [];
    DB.gateout.empty = json.gateout?.empty || [];
    DB.gateout.export = json.gateout?.export || [];
    DB.gateout.emptyReturn = json.gateout?.emptyReturn || [];
    DB.gateout.sales = json.gateout?.sales || [];
  } catch (e) {
    console.warn("Could not load data.json — using empty store.");
  }
  updateDashboard();
}

// ═══════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════
const navLinks = document.querySelectorAll(".side_nav ul li a");
const pages = document.querySelectorAll(".page");

navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    navLinks.forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
    const pageId = link.dataset.page;
    pages.forEach((p) => p.classList.remove("active"));
    document.getElementById(pageId)?.classList.add("active");
  });
});

// ═══════════════════════════════════════
// TABS — generic
// ═══════════════════════════════════════
document.querySelectorAll(".tabs").forEach((tabGroup) => {
  const tabs = tabGroup.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const container = tabGroup.parentElement;
      container
        .querySelectorAll(":scope > .tab-content, .tab-content")
        .forEach((c) => c.classList.remove("active"));
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const contentId = tab.dataset.tab;
      const content =
        document.getElementById(contentId) || container.querySelector(`[id="${contentId}"]`);
      if (content) content.classList.add("active");

      // Adjust any DataTable inside the newly visible tab
      setTimeout(() => {
        Object.values(DTRegistry).forEach((dt) => {
          try {
            dt.columns.adjust().draw(false);
          } catch (_) {}
        });
      }, 50);
    });
  });
});

// ═══════════════════════════════════════
// TOAST
// ═══════════════════════════════════════
function showToast(msg, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      ${
        type === "success"
          ? '<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>'
          : '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>'
      }
    </svg>
    ${msg}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    toast.style.transition = "all 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ═══════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════
function updateDashboard() {
  const allIn = DB.gatein.import.length + DB.gatein.empty.length;
  const allOut =
    DB.gateout.import.length +
    DB.gateout.empty.length +
    DB.gateout.export.length +
    DB.gateout.emptyReturn.length +
    DB.gateout.sales.length;
  const total = allIn + allOut;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-in").textContent = allIn;
  document.getElementById("stat-out").textContent = allOut;

  renderRecentActivities();
}

function renderRecentActivities() {
  const feed = document.getElementById("activity-feed");
  const all = [
    ...DB.gatein.import.map((r) => ({
      dir: "in",
      type: "import",
      title: `Container IN – ${r.containerNumber}`,
      meta: `Truck ${r.truckNo} • ${r.driverName}`,
      time: r.time,
    })),
    ...DB.gatein.empty.map((r) => ({
      dir: "in",
      type: "empty",
      title: `Empty IN – ${r.containerNumber}`,
      meta: `From ${r.portIncoming} • ${r.driverName}`,
      time: r.time,
    })),
    ...DB.gateout.import.map((r) => ({
      dir: "out",
      type: "import",
      title: `Container OUT – ${r.containerNumber}`,
      meta: `Truck ${r.truckNo} • ${r.agentName}`,
      time: r.time,
    })),
    ...DB.gateout.empty.map((r) => ({
      dir: "out",
      type: "empty",
      title: `Empty OUT – ${r.containerNumber}`,
      meta: `To ${r.portDestination} • ${r.driverName}`,
      time: r.time,
    })),
    ...DB.gateout.export.map((r) => ({
      dir: "out",
      type: "export",
      title: `Export OUT – ${r.containerNumber}`,
      meta: `${r.exporter} • ${r.agent}`,
      time: r.time,
    })),
    ...DB.gateout.emptyReturn.map((r) => ({
      dir: "out",
      type: "return",
      title: `Empty Return – ${r.containerNumber}`,
      meta: `${r.truckingCompany} • ${r.driverName}`,
      time: r.time,
    })),
    ...DB.gateout.sales.map((r) => ({
      dir: "out",
      type: "sales",
      title: `Container Sold – ${r.containerNumber}`,
      meta: `${r.company} • ${r.agent}`,
      time: r.time,
    })),
  ]
    .slice(-8)
    .reverse();

  if (!all.length) {
    feed.innerHTML = `<div class="empty-state"><p>No activity yet</p></div>`;
    return;
  }

  feed.innerHTML = all
    .map(
      (a) => `
    <div class="activity-item">
      <div class="activity-dot ${a.dir}"></div>
      <div class="activity-content">
        <div class="activity-title">${a.title}</div>
        <div class="activity-meta">${a.meta}</div>
      </div>
      <div class="activity-badges">
        <span class="badge ${a.dir}">${a.dir === "in" ? "Gate-in" : "Gate-out"}</span>
        <span class="badge ${a.type}">${a.type}</span>
      </div>
      <div class="activity-time">${a.time}</div>
    </div>`,
    )
    .join("");
}

// ═══════════════════════════════════════
// GATE-IN FORMS
// ═══════════════════════════════════════
document.getElementById("form-gi-import").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const now = new Date();
  const entry = {
    agentName: form.querySelector('[name="agentName"]').value,
    driverName: form.querySelector('[name="driverName"]').value,
    truckNo: form.querySelector('[name="truckNo"]').value,
    driverPhone: form.querySelector('[name="driverPhone"]').value,
    containerNumber: form.querySelector('[name="containerNumber"]').value.toUpperCase(),
    containerSize: form.querySelector('[name="containerSize"]').value,
    shippingCompany: form.querySelector('[name="shippingCompany"]').value,
    receiver: form.querySelector('[name="receiver"]').value,
    time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    date: now.toISOString().split("T")[0],
  };
  if (!entry.containerNumber || !entry.truckNo) {
    showToast("Container No. and Truck No. are required", "error");
    return;
  }
  DB.gatein.import.push(entry);
  form.reset();
  updateDashboard();
  refreshRecentEntries();
  renderReport(activeReportType);
  showToast(`Import Gate-In recorded: ${entry.containerNumber}`);
});

document.getElementById("form-gi-empty").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const now = new Date();
  const entry = {
    portIncoming: form.querySelector('[name="portIncoming"]').value,
    containerNumber: form.querySelector('[name="containerNumber"]').value.toUpperCase(),
    containerSize: form.querySelector('[name="containerSize"]').value,
    driverName: form.querySelector('[name="driverName"]').value,
    truckNumber: form.querySelector('[name="truckNumber"]').value,
    driverPhone: form.querySelector('[name="driverPhone"]').value,
    shippingLine: form.querySelector('[name="shippingLine"]').value,
    time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    date: now.toISOString().split("T")[0],
  };
  if (!entry.containerNumber) {
    showToast("Container number required", "error");
    return;
  }
  DB.gatein.empty.push(entry);
  form.reset();
  updateDashboard();
  refreshRecentEntries();
  renderReport(activeReportType);
  showToast(`Empty Gate-In recorded: ${entry.containerNumber}`);
});

// ═══════════════════════════════════════
// GATE-OUT FORMS
// ═══════════════════════════════════════
function bindGateOutForm(formId, storeKey, fields, successMsg) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const now = new Date();
    const entry = {
      time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      date: now.toISOString().split("T")[0],
    };
    fields.forEach((f) => {
      const el = form.querySelector(`[name="${f}"]`);
      if (el) entry[f] = el.value;
    });
    if (!entry.containerNumber) {
      showToast("Container number required", "error");
      return;
    }
    entry.containerNumber = entry.containerNumber.toUpperCase();
    DB.gateout[storeKey].push(entry);
    form.reset();
    updateDashboard();
    renderReport(activeReportType);
    showToast(`${successMsg}: ${entry.containerNumber}`);
  });
}

bindGateOutForm(
  "form-go-import",
  "import",
  [
    "agentName",
    "driverName",
    "truckNo",
    "driverPhone",
    "containerNumber",
    "containerSize",
    "shippingLine",
    "releaseOfficer",
  ],
  "Import Gate-Out recorded",
);
bindGateOutForm(
  "form-go-empty",
  "empty",
  [
    "portDestination",
    "containerNumber",
    "containerSize",
    "driverName",
    "truckNumber",
    "driverPhone",
    "shippingLine",
  ],
  "Empty Gate-Out recorded",
);
bindGateOutForm(
  "form-go-export",
  "export",
  [
    "containerNumber",
    "containerSize",
    "agent",
    "driverName",
    "truckNumber",
    "shippingLine",
    "exporter",
    "bookingNumber",
  ],
  "Export Release recorded",
);
bindGateOutForm(
  "form-go-empty-return",
  "emptyReturn",
  [
    "containerNumber",
    "containerSize",
    "agent",
    "driverName",
    "truckNumber",
    "shippingLine",
    "truckingCompany",
  ],
  "Empty Return recorded",
);
bindGateOutForm(
  "form-go-sales",
  "sales",
  [
    "agent",
    "company",
    "containerSize",
    "shippingLine",
    "driverName",
    "driverPhone",
    "driverId",
    "containerNumber",
  ],
  "Container Sale recorded",
);

// ═══════════════════════════════════════
// RECENT GATE-IN ENTRIES
// ═══════════════════════════════════════
function refreshRecentEntries() {
  const list = document.getElementById("recent-entries-list");
  const all = [
    ...DB.gatein.import.map((r) => ({
      type: "Gate-in (Import)",
      time: r.time,
      detail: `Container ${r.containerNumber} • Driver: ${r.driverName} • Truck: ${r.truckNo} • Shipping: ${r.shippingCompany}`,
    })),
    ...DB.gatein.empty.map((r) => ({
      type: "Gate-in (Empty)",
      time: r.time,
      detail: `Container ${r.containerNumber} • Driver: ${r.driverName} • Truck: ${r.truckNumber} • Port: ${r.portIncoming}`,
    })),
  ]
    .slice(-6)
    .reverse();

  if (!all.length) {
    list.innerHTML = `<div class="empty-state"><p>No recent entries</p></div>`;
    return;
  }
  list.innerHTML = all
    .map(
      (r) => `
    <div class="recent-item">
      <div class="recent-item-top">
        <span class="recent-item-type">${r.type}</span>
        <span class="recent-item-time">${r.time}</span>
      </div>
      <small>${r.detail}</small>
    </div>`,
    )
    .join("");
}

// ═══════════════════════════════════════
// REPORT CONFIGS
// ═══════════════════════════════════════
const reportConfigs = {
  "report-gi-import": {
    getData: () => DB.gatein.import,
    columns: [
      "agentName",
      "driverName",
      "truckNo",
      "containerNumber",
      "containerSize",
      "shippingCompany",
      "receiver",
      "date",
      "time",
    ],
    headers: [
      "Agent",
      "Driver",
      "Truck",
      "Container",
      "Size",
      "Shipping",
      "Receiver",
      "Date",
      "Time",
    ],
  },
  "report-gi-empty": {
    getData: () => DB.gatein.empty,
    columns: [
      "portIncoming",
      "containerNumber",
      "containerSize",
      "driverName",
      "truckNumber",
      "shippingLine",
      "date",
      "time",
    ],
    headers: ["Port", "Container", "Size", "Driver", "Truck", "Shipping", "Date", "Time"],
  },
  "report-go-import": {
    getData: () => DB.gateout.import,
    columns: [
      "agentName",
      "driverName",
      "truckNo",
      "containerNumber",
      "containerSize",
      "shippingLine",
      "releaseOfficer",
      "date",
      "time",
    ],
    headers: [
      "Agent",
      "Driver",
      "Truck",
      "Container",
      "Size",
      "Shipping",
      "Release Officer",
      "Date",
      "Time",
    ],
  },
  "report-go-empty": {
    getData: () => DB.gateout.empty,
    columns: [
      "portDestination",
      "containerNumber",
      "containerSize",
      "driverName",
      "truckNumber",
      "shippingLine",
      "date",
      "time",
    ],
    headers: ["Port Dest.", "Container", "Size", "Driver", "Truck", "Shipping", "Date", "Time"],
  },
  "report-go-export": {
    getData: () => DB.gateout.export,
    columns: [
      "containerNumber",
      "containerSize",
      "agent",
      "driverName",
      "truckNumber",
      "shippingLine",
      "exporter",
      "bookingNumber",
      "date",
      "time",
    ],
    headers: [
      "Container",
      "Size",
      "Agent",
      "Driver",
      "Truck",
      "Shipping",
      "Exporter",
      "Booking",
      "Date",
      "Time",
    ],
  },
  "report-go-return": {
    getData: () => DB.gateout.emptyReturn,
    columns: [
      "containerNumber",
      "containerSize",
      "agent",
      "driverName",
      "truckNumber",
      "shippingLine",
      "truckingCompany",
      "date",
      "time",
    ],
    headers: [
      "Container",
      "Size",
      "Agent",
      "Driver",
      "Truck",
      "Shipping",
      "Trucking Co.",
      "Date",
      "Time",
    ],
  },
  "report-go-sales": {
    getData: () => DB.gateout.sales,
    columns: [
      "agent",
      "company",
      "containerNumber",
      "containerSize",
      "driverName",
      "driverPhone",
      "driverId",
      "shippingLine",
      "date",
      "time",
    ],
    headers: [
      "Agent",
      "Company",
      "Container",
      "Size",
      "Driver",
      "Phone",
      "Driver ID",
      "Shipping",
      "Date",
      "Time",
    ],
  },
};

let activeReportType = "report-gi-import";

// ═══════════════════════════════════════
// DATATABLES INTEGRATION
// ═══════════════════════════════════════

/**
 * Build or rebuild a DataTable for the given report type.
 * Supports:
 *  - Sorting on all columns
 *  - Search/filter (built-in DT search)
 *  - Export buttons: Copy, CSV, Excel, PDF, Print
 *  - Column visibility toggle
 *  - Responsive layout
 *  - Custom per-column filters passed via `filters` param
 *
 * @param {string} type       - key from reportConfigs
 * @param {object} filters    - optional { from, to, container, truck, shipping }
 * @param {string} [tableId]  - optional custom table id (for dynamically created tables)
 * @param {Array}  [customData] - optional custom row data (for dynamically created tables)
 * @param {object} [customCfg]  - optional { columns, headers } (for dynamically created tables)
 */
function renderReport(type, filters = {}, tableId = null, customData = null, customCfg = null) {
  activeReportType = type;

  const config = customCfg || reportConfigs[type];
  if (!config) return;

  // Resolve data
  let data = customData !== null ? customData : config.getData();

  // Apply filters
  if (filters.from) data = data.filter((r) => r.date >= filters.from);
  if (filters.to) data = data.filter((r) => r.date <= filters.to);
  if (filters.container)
    data = data.filter((r) =>
      r.containerNumber?.toLowerCase().includes(filters.container.toLowerCase()),
    );
  if (filters.truck)
    data = data.filter((r) =>
      (r.truckNo || r.truckNumber)?.toLowerCase().includes(filters.truck.toLowerCase()),
    );
  if (filters.shipping)
    data = data.filter((r) =>
      (r.shippingCompany || r.shippingLine)?.toLowerCase().includes(filters.shipping.toLowerCase()),
    );

  // Determine containing element
  let containerId;
  if (tableId) {
    containerId = tableId + "_wrap";
  } else if (type.startsWith("report-gi-")) {
    containerId = "active-report-table";
  } else {
    containerId = "active-go-report-table";
  }

  const container = document.getElementById(containerId);
  if (!container) return;

  const dtId = tableId || "dt_" + type.replace(/-/g, "_");

  // Destroy old DataTable instance if it exists
  if (DTRegistry[dtId]) {
    try {
      DTRegistry[dtId].destroy();
    } catch (_) {}
    delete DTRegistry[dtId];
  }

  // Build table HTML
  const headerHtml = config.headers.map((h) => `<th>${h}</th>`).join("");
  const rowsHtml = data
    .map(
      (row) =>
        `<tr>${config.columns
          .map((col) => {
            const val = row[col] || "";
            const cls =
              col === "containerNumber"
                ? "container-no"
                : col === "time"
                  ? "time-col"
                  : col === "date"
                    ? "date-col"
                    : "";
            return `<td class="${cls}">${val || "—"}</td>`;
          })
          .join("")}</tr>`,
    )
    .join("");

  container.innerHTML = `
    <div class="dt-outer-wrap">
      <table id="${dtId}" class="data-table dt-enabled display nowrap" style="width:100%">
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
        <tfoot><tr>${config.headers.map((h) => `<th>${h}</th>`).join("")}</tr></tfoot>
      </table>
    </div>`;

  // Wait a tick so DOM is ready
  setTimeout(() => {
    const tableEl = document.getElementById(dtId);
    if (!tableEl) return;

    const dtInstance = $(tableEl).DataTable({
      dom:
        "<'dt-toolbar'<'dt-toolbar-left'Bf><'dt-toolbar-right'l>>" +
        "<'dt-body'rt>" +
        "<'dt-footer'<'dt-footer-left'i><'dt-footer-right'p>>",

      buttons: [
        {
          extend: "copyHtml5",
          text: '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M16 1H4a2 2 0 00-2 2v14h2V3h12V1zm3 4H8a2 2 0 00-2 2v14a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H8V7h11v14z"/></svg> Copy',
          className: "dt-btn dt-btn-copy",
          exportOptions: { columns: ":visible" },
        },
        {
          extend: "csvHtml5",
          text: '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/></svg> CSV',
          className: "dt-btn dt-btn-csv",
          filename: () => `terminus_${type}_${new Date().toISOString().split("T")[0]}`,
          exportOptions: { columns: ":visible" },
        },
        {
          extend: "excelHtml5",
          text: '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M21.17 3.25Q21.5 3.25 21.76 3.5 22 3.74 22 4.08V19.92Q22 20.26 21.76 20.5 21.5 20.75 21.17 20.75H7.83Q7.5 20.75 7.24 20.5 7 20.26 7 19.92V17H2.83Q2.5 17 2.24 16.76 2 16.5 2 16.17V7.83Q2 7.5 2.24 7.24 2.5 7 2.83 7H7V4.08Q7 3.74 7.24 3.5 7.5 3.25 7.83 3.25M7 13.06L8.18 15.28H9.97L8 12.06 9.93 8.89H8.22L7 11.13 5.78 8.89H4.03L6 12.06 4.07 15.28H5.82M13.85 19.25V17H8.85V19.25M13.85 15.5V12.75H8.85V15.5M13.85 11.25V8.5H8.85V11.25M13.85 7V4.75H8.85V7M20.15 19.25V17H15.15V19.25M20.15 15.5V12.75H15.15V15.5M20.15 11.25V8.5H15.15V11.25M20.15 7V4.75H15.15V7Z"/></svg> Excel',
          className: "dt-btn dt-btn-excel",
          filename: () => `terminus_${type}_${new Date().toISOString().split("T")[0]}`,
          exportOptions: { columns: ":visible" },
        },
        {
          extend: "pdfHtml5",
          text: '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M20 2H8a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14a2 2 0 002 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg> PDF',
          className: "dt-btn dt-btn-pdf",
          filename: () => `terminus_${type}_${new Date().toISOString().split("T")[0]}`,
          title: `Terminus — ${(config.headers || []).join(", ")}`,
          exportOptions: { columns: ":visible" },
          customize: (doc) => {
            doc.defaultStyle.fontSize = 9;
            doc.styles.tableHeader.fillColor = "#1e293b";
            doc.styles.tableHeader.color = "#ffffff";
            doc.pageMargins = [20, 30, 20, 30];
          },
        },
        {
          extend: "print",
          text: '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M19 8H5a3 3 0 00-3 3v6h4v4h12v-4h4v-6a3 3 0 00-3-3zm-3 11H8v-5h8v5zm3-7a1 1 0 110-2 1 1 0 010 2zm-1-9H6v4h12V3z"/></svg> Print',
          className: "dt-btn dt-btn-print",
          exportOptions: { columns: ":visible" },
        },
        {
          extend: "colvis",
          text: '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg> Columns',
          className: "dt-btn dt-btn-colvis",
        },
      ],

      scrollX: true,
      autoWidth: true,
      pageLength: 10,
      lengthMenu: [
        [10, 25, 50, 100, -1],
        [10, 25, 50, 100, "All"],
      ],
      ordering: true,
      order: [], // no default sort — preserve insertion order
      responsive: false,
      language: {
        search: "",
        searchPlaceholder: "Search records…",
        lengthMenu: "Show _MENU_",
        info: "Showing _START_–_END_ of _TOTAL_ records",
        infoEmpty: "No records available",
        infoFiltered: "(filtered from _MAX_)",
        zeroRecords: "No matching records found",
        emptyTable: "No data available",
        paginate: {
          first: "«",
          last: "»",
          next: "›",
          previous: "‹",
        },
      },
      initComplete() {
        // Add tfoot column search inputs
        this.api()
          .columns()
          .every(function () {
            const col = this;
            const th = $(col.footer());
            const input = $(`<input type="text" placeholder="${th.text()}" class="dt-col-search">`)
              .appendTo(th.empty())
              .on("keyup change clear", function () {
                if (col.search() !== this.value) {
                  col.search(this.value).draw();
                }
              });
          });
      },
    });

    DTRegistry[dtId] = dtInstance;
  }, 0);
}

// ═══════════════════════════════════════
// FILTER BUTTONS
// ═══════════════════════════════════════
document.getElementById("btn-filter-gi")?.addEventListener("click", () => {
  renderReport(activeReportType, getGIFilters());
});
document.getElementById("btn-filter-go")?.addEventListener("click", () => {
  renderReport(activeReportType, getGOFilters());
});

// Legacy CSV button (kept for backward compat — DataTables CSV button is preferred)
document.getElementById("btn-export-csv")?.addEventListener("click", () => {
  const dtId = "dt_" + activeReportType.replace(/-/g, "_");
  const dt = DTRegistry[dtId];
  if (dt) {
    dt.button(".dt-btn-csv").trigger();
  } else {
    showToast("No active table to export", "error");
  }
});

function getGIFilters() {
  return {
    from: document.getElementById("gi-filter-from")?.value || "",
    to: document.getElementById("gi-filter-to")?.value || "",
    container: document.getElementById("gi-filter-container")?.value || "",
    truck: document.getElementById("gi-filter-truck")?.value || "",
    shipping: document.getElementById("gi-filter-shipping")?.value || "",
  };
}
function getGOFilters() {
  return {
    from: document.getElementById("go-filter-from")?.value || "",
    to: document.getElementById("go-filter-to")?.value || "",
    container: document.getElementById("go-filter-container")?.value || "",
    truck: document.getElementById("go-filter-truck")?.value || "",
    shipping: document.getElementById("go-filter-shipping")?.value || "",
  };
}

// ═══════════════════════════════════════
// REPORT SUB-TAB SWITCHING
// ═══════════════════════════════════════
document.querySelectorAll(".report-sub-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    const parent = btn.closest(".tab-content");
    parent.querySelectorAll(".report-sub-tab").forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");
    activeReportType = btn.dataset.report;
    renderReport(activeReportType);
  });
});

// ═══════════════════════════════════════
// DYNAMIC TABLE CREATOR
// ═══════════════════════════════════════
// Usage:
//   createCustomTable({
//     containerId: "my-container-div",   // id of wrapper element where table should appear
//     tableId:     "my_custom_table",    // unique id for this table
//     headers:     ["Col A","Col B"],    // column display names
//     columns:     ["colA","colB"],      // data key names
//     data:        [{colA:"x",colB:"y"}],// row data array
//     filters:     {}                    // optional filter object
//   });
//
function createCustomTable({ containerId, tableId, headers, columns, data = [], filters = {} }) {
  const wrapper = document.getElementById(containerId);
  if (!wrapper) {
    console.error(`createCustomTable: container #${containerId} not found`);
    return null;
  }

  // Inject a wrapper div inside the container
  let wrapDiv = document.getElementById(tableId + "_wrap");
  if (!wrapDiv) {
    wrapDiv = document.createElement("div");
    wrapDiv.id = tableId + "_wrap";
    wrapper.appendChild(wrapDiv);
  }

  const customCfg = { headers, columns, getData: () => data };

  renderReport(
    tableId, // type (used as DT id key)
    filters,
    tableId, // tableId override
    data,
    customCfg,
  );

  return {
    /** Add a row and refresh the table */
    addRow(row) {
      data.push(row);
      renderReport(tableId, filters, tableId, data, customCfg);
    },
    /** Replace all data */
    setData(newData) {
      data.length = 0;
      newData.forEach((r) => data.push(r));
      renderReport(tableId, filters, tableId, data, customCfg);
    },
    /** Destroy the DataTable and remove the element */
    destroy() {
      if (DTRegistry[tableId]) {
        try {
          DTRegistry[tableId].destroy();
        } catch (_) {}
        delete DTRegistry[tableId];
      }
      wrapDiv.remove();
    },
    /** Get the underlying DataTables instance */
    getInstance() {
      return DTRegistry[tableId];
    },
  };
}

// Expose globally so external scripts can use it
window.createCustomTable = createCustomTable;
window.DTRegistry = DTRegistry;
window.renderReport = renderReport;

// ═══════════════════════════════════════
// MANAGE — profile & user
// ═══════════════════════════════════════
document.getElementById("btn-save-profile")?.addEventListener("click", () => {
  showToast("Profile saved successfully");
});

document.getElementById("btn-add-user")?.addEventListener("click", () => {
  const name = document.getElementById("new-user-name").value;
  const role = document.getElementById("new-user-role").value;
  if (!name) {
    showToast("Please enter a name", "error");
    return;
  }
  const list = document.getElementById("users-list");
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const card = document.createElement("div");
  card.className = "user-card";
  card.innerHTML = `
    <div class="user-card-avatar">${initials}</div>
    <div class="user-card-info">
      <div class="uname">${name}</div>
      <div class="urole">${role}</div>
    </div>`;
  list.prepend(card);
  document.getElementById("new-user-name").value = "";
  showToast(`${name} added as ${role}`);
});

// ═══════════════════════════════════════
// DATE BADGE
// ═══════════════════════════════════════
const today = new Date();
document.getElementById("today-date").textContent = today.toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════
initData().then(() => {
  renderReport("report-gi-import");
  refreshRecentEntries();

  // Fix first table layout
  setTimeout(() => {
    $.fn.dataTable.tables({ visible: true, api: true }).columns.adjust();
  }, 300);
});

// ═══════════════════════════════════════
// CAPTURE SYSTEM
// ═══════════════════════════════════════
let captureTargetInput = null;
let captureStream = null;
let captureUsingFront = false;

const modal = document.getElementById("capture-modal");
const backdrop = document.getElementById("capture-backdrop");
const video = document.getElementById("capture-video");
const canvas = document.getElementById("capture-canvas");
const statusEl = document.getElementById("camera-status");
const statusText = document.getElementById("camera-status-text");
const preview = document.getElementById("camera-preview");
const previewImg = document.getElementById("capture-preview-img");
const chipsWrap = document.getElementById("extracted-wrap");
const chipsEl = document.getElementById("extracted-chips");
const confirmRow = document.getElementById("cam-confirm-row");
const confirmIn = document.getElementById("cam-confirm-input");

function openCapture(inputEl, labelText) {
  captureTargetInput = inputEl;
  document.getElementById("capture-modal-label").textContent = labelText || "Capture";
  document.getElementById("manual-entry-label").textContent = labelText || "Enter value";
  document.getElementById("manual-entry-input").value = "";
  resetCamera();
  modal.classList.add("open");
  backdrop.classList.add("open");
  document.body.style.overflow = "hidden";
  switchCaptureTab("camera");
  startCamera();
}

function closeCapture() {
  modal.classList.remove("open");
  backdrop.classList.remove("open");
  document.body.style.overflow = "";
  stopCamera();
}

document.getElementById("capture-close").addEventListener("click", closeCapture);
backdrop.addEventListener("click", closeCapture);

document.querySelectorAll(".capture-tab").forEach((btn) => {
  btn.addEventListener("click", () => switchCaptureTab(btn.dataset.ctab));
});

function switchCaptureTab(tab) {
  document
    .querySelectorAll(".capture-tab")
    .forEach((b) => b.classList.toggle("active", b.dataset.ctab === tab));
  document.querySelectorAll(".capture-panel").forEach((p) => p.classList.remove("active"));
  document.getElementById(`capture-panel-${tab}`)?.classList.add("active");
  if (tab === "camera") startCamera();
  else stopCamera();
}

async function startCamera() {
  stopCamera();
  resetCamera();
  setStatus("Starting camera…", "loading");
  const constraints = {
    video: {
      facingMode: captureUsingFront ? "user" : "environment",
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  };
  try {
    captureStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = captureStream;
    await video.play();
    setStatus("Ready — point at container label", "ready");
  } catch (err) {
    console.warn("Camera error:", err);
    setStatus("Camera unavailable — use Manual Entry", "error");
    setTimeout(() => switchCaptureTab("manual"), 1200);
  }
}

function stopCamera() {
  if (captureStream) {
    captureStream.getTracks().forEach((t) => t.stop());
    captureStream = null;
  }
  video.srcObject = null;
}

function setStatus(msg, state) {
  statusText.textContent = msg;
  statusEl.className = "camera-status " + (state || "");
}

function resetCamera() {
  preview.style.display = "none";
  video.style.display = "block";
  chipsWrap.style.display = "none";
  confirmRow.style.display = "none";
  document.getElementById("btn-capture-snap").style.display = "flex";
  document.getElementById("btn-retake").style.display = "none";
  chipsEl.innerHTML = "";
}

document.getElementById("btn-switch-cam").addEventListener("click", () => {
  captureUsingFront = !captureUsingFront;
  startCamera();
});

document.getElementById("btn-capture-snap").addEventListener("click", () => {
  if (!captureStream) return;
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  previewImg.src = dataUrl;
  preview.style.display = "block";
  video.style.display = "none";
  document.getElementById("btn-capture-snap").style.display = "none";
  document.getElementById("btn-retake").style.display = "flex";
  extractTextFromImage(dataUrl);
});

document.getElementById("btn-retake").addEventListener("click", () => {
  resetCamera();
  startCamera();
});

function extractTextFromImage(dataUrl) {
  setStatus("Processing image…", "loading");
  setTimeout(() => {
    setStatus("Image captured — enter the value below", "ready");
    const fieldName = captureTargetInput?.name || captureTargetInput?.placeholder || "value";
    const isContainer = /container/i.test(fieldName);
    chipsWrap.style.display = "flex";
    const hints = isContainer ? ["TCLU ______", "MSKU ______", "CMAU ______", "HLXU ______"] : [];
    chipsEl.innerHTML = hints.map((h) => `<span class="chip hint-chip">${h}</span>`).join("");
    confirmRow.style.display = "flex";
    confirmIn.value = "";
    confirmIn.placeholder = isContainer
      ? "e.g. TCLU 4589213"
      : captureTargetInput?.placeholder || "Enter value";
    confirmIn.focus();
  }, 600);
}

document.getElementById("btn-cam-confirm").addEventListener("click", () => {
  const val = confirmIn.value.trim();
  if (!val) {
    confirmIn.focus();
    return;
  }
  fillTarget(val);
});
confirmIn.addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("btn-cam-confirm").click();
});

chipsEl.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  if (chip.classList.contains("hint-chip")) {
    confirmIn.focus();
    return;
  }
  confirmIn.value = chip.textContent.trim();
  document.querySelectorAll(".chip").forEach((c) => c.classList.remove("selected"));
  chip.classList.add("selected");
});

document.getElementById("btn-manual-confirm").addEventListener("click", () => {
  const val = document.getElementById("manual-entry-input").value.trim();
  if (!val) {
    document.getElementById("manual-entry-input").focus();
    return;
  }
  fillTarget(val);
});
document.getElementById("manual-entry-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("btn-manual-confirm").click();
});

function fillTarget(value) {
  if (captureTargetInput) {
    captureTargetInput.value = value;
    captureTargetInput.dispatchEvent(new Event("input", { bubbles: true }));
    captureTargetInput.dispatchEvent(new Event("change", { bubbles: true }));
    captureTargetInput.style.transition = "border-color 0.2s, background 0.2s";
    captureTargetInput.style.borderColor = "var(--success)";
    captureTargetInput.style.background = "var(--success-light)";
    setTimeout(() => {
      captureTargetInput.style.borderColor = "";
      captureTargetInput.style.background = "";
    }, 1500);
  }
  showToast(`Filled: ${value}`);
  closeCapture();
}

function bindCaptureBtns() {
  document.querySelectorAll(".capture-btn").forEach((btn) => {
    if (btn.dataset.captureBound) return;
    btn.dataset.captureBound = "1";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const field = btn.closest(".field");
      const input = field?.querySelector("input");
      if (!input) return;
      const labelEl = field.querySelector("label");
      const labelText = labelEl ? labelEl.textContent.replace("*", "").trim() : "Capture";
      openCapture(input, labelText);
    });
  });
}

bindCaptureBtns();

// User avatar initials
const uname = document.querySelector(".uname")?.textContent || "";
const initials = uname
  .split(" ")
  .map((w) => w[0])
  .join("")
  .toUpperCase();
const avatarEl = document.querySelector(".user-avatar");
if (avatarEl) avatarEl.textContent = initials;
