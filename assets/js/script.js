// ═══════════════════════════════════════
// DATA STORE
// ═══════════════════════════════════════
const DB = {
  gatein: { import: [], empty: [] },
  gateout: { import: [], empty: [], export: [], emptyReturn: [], sales: [] },
};

// Load seed data
async function initData() {
  try {
    const res = await fetch("assets/js/data.json");
    const json = await res.json();
    DB.gatein.import = json.gatein.import || [];
    DB.gatein.empty = json.gatein.empty || [];
    DB.gateout.import = json.gateout.import || [];
    DB.gateout.empty = json.gateout.empty || [];
    DB.gateout.export = json.gateout.export || [];
    DB.gateout.emptyReturn = json.gateout.emptyReturn || [];
    DB.gateout.sales = json.gateout.sales || [];
  } catch (e) {
    console.warn("Could not load data.json, using empty store.");
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
    document.getElementById(pageId).classList.add("active");
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
      ${type === "success" ? '<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>' : '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>'}
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

  // Collect all with metadata
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
    </div>
  `,
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
// REPORT SYSTEM
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
      "time",
    ],
    headers: ["Agent", "Driver", "Truck", "Container", "Size", "Shipping", "Receiver", "Time"],
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
      "time",
    ],
    headers: ["Port", "Container", "Size", "Driver", "Truck", "Shipping", "Time"],
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
      "time",
    ],
    headers: ["Port Dest.", "Container", "Size", "Driver", "Truck", "Shipping", "Time"],
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
      "time",
    ],
    headers: ["Container", "Size", "Agent", "Driver", "Truck", "Shipping", "Trucking Co.", "Time"],
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
      "Time",
    ],
  },
};

let activeReportType = "report-gi-import";
const PAGE_SIZE = 10;
let currentPage = 1;
let filteredData = [];

function renderReport(type, filters = {}) {
  activeReportType = type;
  currentPage = 1;
  const config = reportConfigs[type];
  if (!config) return;

  let data = config.getData();

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

  filteredData = data;
  renderPage();
}

function renderPage() {
  const type = activeReportType;
  const config = reportConfigs[type];
  const containerId = type.startsWith("report-gi-")
    ? "active-report-table"
    : "active-go-report-table";
  const container = document.getElementById(containerId);
  if (!container) return;

  const total = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageData = filteredData.slice(start, start + PAGE_SIZE);

  const isContainerCol = (col) => col === "containerNumber";
  const isTimeCol = (col) => col === "time";

  if (!pageData.length) {
    container.innerHTML = `
      <div class="table-wrap">
        <div class="empty-state" style="padding:40px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          <p>No records found</p>
        </div>
      </div>`;
    return;
  }

  const headerHtml = config.headers.map((h) => `<th>${h}</th>`).join("");
  const rowsHtml = pageData
    .map(
      (row) =>
        `<tr>${config.columns.map((col) => `<td class="${isContainerCol(col) ? "container-no" : ""} ${isTimeCol(col) ? "time-col" : ""}">${row[col] || "—"}</td>`).join("")}</tr>`,
    )
    .join("");

  const paginationHtml = Array.from(
    { length: totalPages },
    (_, i) =>
      `<button class="page-btn ${i + 1 === currentPage ? "active" : ""}" onclick="goPage(${i + 1})">${i + 1}</button>`,
  ).join("");

  container.innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="table-footer">
        <span class="table-info">Showing ${start + 1}–${Math.min(start + PAGE_SIZE, total)} of ${total} records</span>
        <div class="pagination">
          <button class="page-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>‹</button>
          ${paginationHtml}
          <button class="page-btn" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}>›</button>
        </div>
      </div>
    </div>`;
}

function goPage(n) {
  currentPage = n;
  renderPage();
}

// Which container to render into
function getReportContainer() {
  const type = activeReportType;
  if (type.startsWith("report-gi-")) return document.getElementById("active-report-table");
  return document.getElementById("active-go-report-table");
}

// Override renderPage to use correct container
const _origRenderPage = renderPage;

// Filter buttons
document.getElementById("btn-filter-gi").addEventListener("click", () => {
  const filters = getGIFilters();
  renderReport(activeReportType, filters);
});
document.getElementById("btn-filter-go").addEventListener("click", () => {
  const filters = getGOFilters();
  renderReport(activeReportType, filters);
});

function getGIFilters() {
  return {
    from: document.getElementById("gi-filter-from").value,
    to: document.getElementById("gi-filter-to").value,
    container: document.getElementById("gi-filter-container").value,
    truck: document.getElementById("gi-filter-truck").value,
    shipping: document.getElementById("gi-filter-shipping").value,
  };
}
function getGOFilters() {
  return {
    from: document.getElementById("go-filter-from").value,
    to: document.getElementById("go-filter-to").value,
    container: document.getElementById("go-filter-container").value,
    truck: document.getElementById("go-filter-truck").value,
    shipping: document.getElementById("go-filter-shipping").value,
  };
}

// Sub-tab switching in report section
document.querySelectorAll(".report-sub-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    const parent = btn.closest(".tab-content");
    parent.querySelectorAll(".report-sub-tab").forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");
    const type = btn.dataset.report;
    activeReportType = type;
    renderReport(type);
  });
});

// ═══════════════════════════════════════
// EXPORT CSV
// ═══════════════════════════════════════
document.getElementById("btn-export-csv")?.addEventListener("click", () => exportCSV());

function exportCSV() {
  const config = reportConfigs[activeReportType];
  if (!filteredData.length) {
    showToast("No data to export", "error");
    return;
  }
  const header = config.headers.join(",");
  const rows = filteredData
    .map((r) => config.columns.map((c) => `"${r[c] || ""}"`).join(","))
    .join("\n");
  const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `terminus_report_${activeReportType}.csv`;
  a.click();
  showToast("CSV exported successfully");
}

// ═══════════════════════════════════════
// MANAGE — Profile save
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
});

// ═══════════════════════════════════════
// CAPTURE SYSTEM
// ═══════════════════════════════════════
let captureTargetInput = null; // the <input> we'll fill
let captureStream = null; // active MediaStream
let captureUsingFront = false; // front vs back camera

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

// ---------- open / close ----------
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

// ---------- tabs ----------
document.querySelectorAll(".capture-tab").forEach((btn) => {
  btn.addEventListener("click", () => switchCaptureTab(btn.dataset.ctab));
});

function switchCaptureTab(tab) {
  document
    .querySelectorAll(".capture-tab")
    .forEach((b) => b.classList.toggle("active", b.dataset.ctab === tab));
  document.querySelectorAll(".capture-panel").forEach((p) => p.classList.remove("active"));
  document.getElementById(`capture-panel-${tab}`).classList.add("active");
  if (tab === "camera") startCamera();
  else stopCamera();
}

// ---------- camera ----------
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
    // auto-switch to manual
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

// ---------- switch camera ----------
document.getElementById("btn-switch-cam").addEventListener("click", () => {
  captureUsingFront = !captureUsingFront;
  startCamera();
});

// ---------- snap ----------
document.getElementById("btn-capture-snap").addEventListener("click", () => {
  if (!captureStream) return;

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  previewImg.src = dataUrl;
  preview.style.display = "block";
  video.style.display = "none";

  document.getElementById("btn-capture-snap").style.display = "none";
  document.getElementById("btn-retake").style.display = "flex";

  // Simulate OCR extraction (browser has no built-in OCR, so we present helpful UI)
  extractTextFromImage(dataUrl);
});

// ---------- retake ----------
document.getElementById("btn-retake").addEventListener("click", () => {
  resetCamera();
  startCamera();
});

// ---------- pseudo-OCR / text extraction ----------
// Real OCR requires a server or Tesseract.js (large lib). We provide a smart manual assist flow.
function extractTextFromImage(dataUrl) {
  setStatus("Processing image…", "loading");

  // Give user a moment then show the confirm input pre-filled with context hint
  setTimeout(() => {
    setStatus("Image captured — enter the value below", "ready");

    const fieldName = captureTargetInput?.name || captureTargetInput?.placeholder || "value";
    const isContainer = /container/i.test(fieldName);

    // Show a helpful prompt
    chipsWrap.style.display = "flex";

    // Give smart placeholder chips based on field type
    const hints = isContainer ? ["TCLU ______", "MSKU ______", "CMAU ______", "HLXU ______"] : [];

    chipsEl.innerHTML = hints.length
      ? hints.map((h) => `<span class="chip hint-chip">${h}</span>`).join("")
      : "";

    // Show editable confirm field
    confirmRow.style.display = "flex";
    confirmIn.value = "";
    confirmIn.placeholder = isContainer
      ? "e.g. TCLU 4589213"
      : captureTargetInput?.placeholder || "Enter value";
    confirmIn.focus();
  }, 600);
}

// Use captured value
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

// Chip click → fill confirm input
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

// ---------- manual confirm ----------
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

// ---------- fill target + close ----------
function fillTarget(value) {
  if (captureTargetInput) {
    captureTargetInput.value = value;
    captureTargetInput.dispatchEvent(new Event("input", { bubbles: true }));
    captureTargetInput.dispatchEvent(new Event("change", { bubbles: true }));

    // Flash the input green
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

// ---------- wire every capture button ----------
function bindCaptureBtns() {
  document.querySelectorAll(".capture-btn").forEach((btn) => {
    // Avoid double-binding
    if (btn.dataset.captureBound) return;
    btn.dataset.captureBound = "1";

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const field = btn.closest(".field");
      const input = field?.querySelector("input");
      if (!input) return;
      // Determine a nice label from the sibling <label>
      const labelEl = field.querySelector("label");
      const labelText = labelEl ? labelEl.textContent.replace("*", "").trim() : "Capture";
      openCapture(input, labelText);
    });
  });
}

// Run on load (and again after any dynamic content)
bindCaptureBtns();

const name = document.querySelector(".uname").textContent;

const initials = name
  .split(" ")
  .map((word) => word[0])
  .join("")
  .toUpperCase();

document.querySelector(".user-avatar").textContent = initials;
