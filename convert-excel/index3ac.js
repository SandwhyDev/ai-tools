const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const convertBtn = document.getElementById("convertBtn");
const resultsContainer = document.getElementById("resultsContainer");
const notification = document.getElementById("notification");
const btnText = document.getElementById("btnText");
const btnLoader = document.getElementById("btnLoader");
const UploadArea = document.getElementById("uploadArea");
const startOver = document.getElementById("startOver");
const categoryWrapper = document.getElementById("categoryWrapper");
const categorySelect = document.getElementById("categorySelect");

const JWT_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHAiOiJ0cnVtcyIsInVzZXIiOnsidW5pcXVlX2lkIjoiOGNiYTg4YTMyODY1MjgwZWY3MjdlMGJhY2M1NmU1NDUiLCJ1bmlxdWVfY29kZSI6IlBFT1BMRSA2MTc5MzM5NSIsImdpZCI6bnVsbCwicGxhdGZvcm0iOiJ3ZWIiLCJpZGVudGlmaWVyIjoid2ViLWNocm9tZS05YXM4ZGgxIn0sInR5cGUiOiJzdXBlcnVzZXIiLCJpYXQiOjE3NzMzODU1NzR9.85hDE7l0R48WZvjQdrEcblwt-6BenRhriejlWWesJCA";
const URL = "http://192.168.1.228:9008";
let uploadedImages = []; // array of File objects (multiple)
let currentColumnKeys = [];
let collectedItems = []; // accumulates items across multiple images
let convertedIndices = new Set(); // tracks which image indices already processed

/* =====================================================
   MULTI-FILE HANDLER
===================================================== */
function makeImageCard(file, idx) {
  const card = document.createElement("div");
  card.className =
    "relative group w-24 h-24 rounded-lg border-2 border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center";
  card.id = `imgCard-${idx}`;

  const img = document.createElement("img");
  img.className = "w-full h-full object-cover";
  const reader = new FileReader();
  reader.onload = (ev) => {
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
  card.appendChild(img);

  // Status badge
  const badge = document.createElement("div");
  badge.className =
    "img-status-badge absolute bottom-0 left-0 right-0 text-center text-xs font-semibold py-0.5 bg-gray-800 bg-opacity-70 text-white hidden";
  card.appendChild(badge);

  // Remove button — only allow removing unconverted images
  const rm = document.createElement("button");
  rm.type = "button";
  rm.id = `imgRemove-${idx}`;
  rm.className =
    "absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity";
  rm.textContent = "✕";
  rm.addEventListener("click", () => {
    if (convertedIndices.has(idx)) return; // cannot remove already-converted
    uploadedImages.splice(idx, 1);
    // Rebuild indices in convertedIndices above idx
    const updated = new Set();
    convertedIndices.forEach((n) => {
      if (n < idx) updated.add(n);
      else if (n > idx) updated.add(n - 1);
    });
    convertedIndices = updated;
    initImageQueue();
  });
  card.appendChild(rm);

  card.title = file.name;
  return card;
}

function addFiles(files) {
  const newFiles = [];
  Array.from(files).forEach((file) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) {
      alert(`File "${file.name}" terlalu besar. Maksimal 10MB`);
      return;
    }
    if (
      !uploadedImages.find((f) => f.name === file.name && f.size === file.size)
    ) {
      newFiles.push(file);
    }
  });
  if (!newFiles.length) return;

  const grid = document.getElementById("imgQueueGrid");

  if (!grid) {
    // First time — build full queue
    newFiles.forEach((f) => uploadedImages.push(f));
    initImageQueue();
    return;
  }

  // Queue already exists — append only new cards before the "+ Tambah" button
  const addMoreBtn = grid.lastElementChild;
  newFiles.forEach((file) => {
    const idx = uploadedImages.length;
    uploadedImages.push(file);
    grid.insertBefore(makeImageCard(file, idx), addMoreBtn);
  });

  // Update counter
  const counter = imagePreview.querySelector("p");
  if (counter) counter.textContent = `${uploadedImages.length} gambar dipilih`;

  // Update button text to show how many new images are pending
  const pendingCount = uploadedImages.filter(
    (_, i) => !convertedIndices.has(i),
  ).length;
  btnText.textContent =
    pendingCount === uploadedImages.length
      ? "Konversi ke Excel"
      : `Konversi ${pendingCount} Gambar Baru`;

  UploadArea.classList.add("hidden");
  startOver.classList.remove("hidden");
  convertBtn.classList.remove("hidden");
  convertBtn.disabled = false;
  imagePreview.classList.remove("hidden");
  imageInput.value = "";
}

function initImageQueue() {
  if (uploadedImages.length === 0) {
    imagePreview.classList.add("hidden");
    convertBtn.classList.add("hidden");
    UploadArea.classList.remove("hidden");
    startOver.classList.add("hidden");
    return;
  }

  UploadArea.classList.add("hidden");
  startOver.classList.remove("hidden");
  convertBtn.classList.remove("hidden");
  imagePreview.classList.remove("hidden");

  imagePreview.innerHTML = `
    <div class="w-full">
      <p class="text-sm font-semibold text-gray-600 mb-2">${uploadedImages.length} gambar dipilih</p>
      <div id="imgQueueGrid" class="flex flex-wrap gap-3"></div>
    </div>
  `;

  const grid = imagePreview.querySelector("#imgQueueGrid");
  uploadedImages.forEach((file, idx) =>
    grid.appendChild(makeImageCard(file, idx)),
  );

  // "+ Tambah lagi" button
  const addMore = document.createElement("label");
  addMore.className =
    "w-24 h-24 rounded-lg border-2 border-dashed border-blue-300 text-blue-400 hover:border-blue-500 hover:text-blue-600 flex flex-col items-center justify-center cursor-pointer transition-colors text-xs font-semibold gap-1";
  addMore.innerHTML = `<span class="text-2xl leading-none">＋</span><span>Tambah</span>`;
  const addMoreInput = document.createElement("input");
  addMoreInput.type = "file";
  addMoreInput.accept = "image/*";
  addMoreInput.multiple = true;
  addMoreInput.className = "hidden";
  addMoreInput.addEventListener("change", (e) => addFiles(e.target.files));
  addMore.appendChild(addMoreInput);
  grid.appendChild(addMore);
}

imageInput.addEventListener("change", (e) => addFiles(e.target.files));

document.addEventListener("paste", (event) => {
  const items = event.clipboardData?.items;
  if (!items) return;
  const files = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      const file = items[i].getAsFile();
      if (file) files.push(file);
    }
  }
  if (files.length) addFiles(files);
});

UploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  UploadArea.classList.add("border-blue-500");
});
UploadArea.addEventListener("dragleave", () =>
  UploadArea.classList.remove("border-blue-500"),
);
UploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  UploadArea.classList.remove("border-blue-500");
  if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
});

/* =====================================================
   FORMAT UTILITIES
===================================================== */
const currencyKeywords = [
  "harga",
  "total",
  "biaya",
  "cost",
  "price",
  "amount",
  "rp",
  "rupiah",
];
function isCurrencyKey(key) {
  return currencyKeywords.some((kw) => key.toLowerCase().includes(kw));
}
function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID").format(amount);
}
function isNumeric(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

function getAllKeys(data) {
  const keysSet = new Set();
  data.forEach((item) =>
    Object.keys(item).forEach((key) => {
      if (key !== "type") keysSet.add(key);
    }),
  );
  return Array.from(keysSet);
}

function getHeaderLabels() {
  return Array.from(document.querySelectorAll("#dataTable thead th")).map(
    (th) => th.dataset.label || th.innerText.trim(),
  );
}

/* =====================================================
   EDITABLE HEADER CELL
===================================================== */
function makeHeaderEditable(th, colIndex) {
  if (th.querySelector("input")) return;
  const originalText = th.innerText.trim();
  const input = document.createElement("input");
  input.type = "text";
  input.value = originalText;
  input.className =
    "w-full bg-blue-50 border border-blue-400 rounded px-1 py-0.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400";
  th.innerHTML = "";
  th.appendChild(input);
  input.focus();
  input.select();

  function commitHeaderEdit() {
    const newLabel = input.value.trim() || originalText;
    th.innerHTML = newLabel;
    th.dataset.label = newLabel;
    th.style.transition = "background 0.3s";
    th.style.backgroundColor = "#bfdbfe";
    setTimeout(() => {
      th.style.backgroundColor = "";
    }, 600);
  }

  input.addEventListener("blur", commitHeaderEdit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      input.blur();
    }
    if (e.key === "Escape") {
      th.innerHTML = originalText;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      input.blur();
      const nextTh = th.nextElementSibling;
      if (nextTh) makeHeaderEditable(nextTh, colIndex + 1);
    }
  });
}

/* =====================================================
   EDITABLE BODY CELL
===================================================== */
function makeEditable(td, key) {
  if (td.querySelector("input, textarea")) return;
  const originalHTML = td.innerHTML;
  const originalText = td.innerText.trim();
  const rawValue = isCurrencyKey(key)
    ? originalText.replace(/\./g, "").replace(/,/g, "")
    : originalText;

  const input = document.createElement("input");
  input.type = isCurrencyKey(key) ? "number" : "text";
  input.value = rawValue === "-" ? "" : rawValue;
  input.className =
    "w-full bg-yellow-50 border border-yellow-400 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400";
  if (isCurrencyKey(key)) {
    input.style.textAlign = "right";
    input.style.minWidth = "120px";
  }

  td.innerHTML = "";
  td.appendChild(input);
  input.focus();
  input.select();

  function commitEdit() {
    const newVal = input.value.trim();
    if (newVal === "" || newVal === "-") {
      td.innerHTML = "-";
    } else if (isCurrencyKey(key) && !isNaN(parseFloat(newVal))) {
      td.innerHTML = formatCurrency(parseFloat(newVal));
    } else {
      td.innerHTML = newVal;
    }
    td.style.transition = "background 0.3s";
    const prevBg = td.style.backgroundColor;
    td.style.backgroundColor = "#bbf7d0";
    setTimeout(() => {
      td.style.backgroundColor = prevBg;
    }, 600);
  }

  input.addEventListener("blur", commitEdit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      input.blur();
      const nextRow = td.parentElement.nextElementSibling;
      if (nextRow) {
        const ci = Array.from(td.parentElement.children).indexOf(td);
        const nextTd = nextRow.children[ci];
        if (nextTd) nextTd.click();
      }
    }
    if (e.key === "Escape") {
      td.innerHTML = originalHTML;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      input.blur();
      const nextTd = td.nextElementSibling;
      if (nextTd) nextTd.click();
    }
  });
}

/* =====================================================
   FIXED COLUMN DEFINITIONS
===================================================== */
const FIXED_COLUMNS = [
  { key: "nama_item", label: "Nama Item", align: "left" },
  { key: "deskripsi", label: "Deskripsi", align: "left" },
  { key: "quantity", label: "Quantity", align: "right" },
  { key: "unit", label: "Unit", align: "left" },
];

/* =====================================================
   CREATE TABLE HEADER (fixed)
===================================================== */
function createTableHeader() {
  currentColumnKeys = FIXED_COLUMNS.map((c) => c.key);
  const thead = document.querySelector("#dataTable thead");
  thead.innerHTML = "";
  const headerRow = document.createElement("tr");
  headerRow.className = "bg-gray-100";

  FIXED_COLUMNS.forEach((col, colIndex) => {
    const th = document.createElement("th");
    th.className =
      "border border-gray-300 px-4 py-2 font-semibold text-gray-700 cursor-pointer select-none " +
      (col.align === "right" ? "text-right" : "text-left");
    th.title = "Klik untuk edit nama kolom";
    th.dataset.key = col.key;
    th.dataset.label = col.label;
    th.textContent = col.label;
    th.addEventListener("mouseenter", () => {
      if (!th.querySelector("input")) {
        th.style.outline = "2px dashed #93c5fd";
        th.style.outlineOffset = "-2px";
      }
    });
    th.addEventListener("mouseleave", () => {
      th.style.outline = "";
    });
    th.addEventListener("click", () => makeHeaderEditable(th, colIndex));
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
}

/* =====================================================
   SPLIT QUANTITY + UOM  e.g. "4 PC" → { qty: "4", uom: "PC" }
===================================================== */
function splitQtyUom(value) {
  if (!value || value === "-") return { qty: "", uom: "" };
  const str = String(value).trim();
  const match = str.match(/^([\d.,]+)\s*([a-zA-Z].*)$/);
  if (match) {
    return {
      qty: match[1].replace(/,/g, ""),
      uom: match[2].trim(),
    };
  }
  return isNumeric(str) ? { qty: str, uom: "" } : { qty: "", uom: str };
}

/* =====================================================
   BUILD TABLE ROWS (shared helper)
===================================================== */
function buildTableRows(tbody, data) {
  data.forEach((item) => {
    const row = document.createElement("tr");
    const rowType = item.type || "detail";
    if (rowType === "category") row.className = "category-row";
    else if (rowType === "subtotal") row.className = "subtotal-row";
    else if (rowType === "grand_total") row.className = "grand-total-row";
    else row.className = "detail-row";

    FIXED_COLUMNS.forEach((col) => {
      const key = col.key;
      const td = document.createElement("td");
      td.className =
        "border border-gray-300 px-4 py-2 " +
        (col.align === "right" ? "text-right" : "text-left");
      td.style.whiteSpace = "normal";
      td.style.wordBreak = "break-word";
      td.style.verticalAlign = "top";
      td.style.cursor = "pointer";
      td.title = "Klik untuk edit";

      let value = item[key];
      if (value === null || value === undefined || value === "") {
        value = "-";
      } else if (typeof value === "string" && value.includes("\n")) {
        value = value.replace(/\n/g, "<br>");
      } else if (Array.isArray(value)) {
        value = value
          .map((v) =>
            typeof v === "object" && v !== null
              ? Object.entries(v)
                  .map(([k, val]) => `${k}: ${val}`)
                  .join(", ")
              : v,
          )
          .join("<br>");
      } else if (typeof value === "object") {
        value = Object.entries(value)
          .map(([k, v]) => `${k}: ${v}`)
          .join("<br>");
      }

      td.innerHTML = value;
      td.addEventListener("click", () => makeEditable(td, key));
      td.addEventListener("mouseenter", () => {
        if (!td.querySelector("input")) {
          td.style.outline = "2px dashed #fbbf24";
          td.style.outlineOffset = "-2px";
        }
      });
      td.addEventListener("mouseleave", () => {
        td.style.outline = "";
      });
      row.appendChild(td);
    });

    tbody.appendChild(row);
  });
}

/* =====================================================
   MAKE MINI TABLE  (reusable — returns a <table> element)
===================================================== */
function makeMiniTable(data) {
  const table = document.createElement("table");
  table.className = "w-full border-collapse text-sm";

  // thead
  const thead = document.createElement("thead");
  const hrow = document.createElement("tr");
  hrow.className = "bg-gray-100";
  FIXED_COLUMNS.forEach((col) => {
    const th = document.createElement("th");
    th.className =
      "border border-gray-300 px-3 py-2 font-semibold text-gray-700 " +
      (col.align === "right" ? "text-right" : "text-left");
    th.textContent = col.label;
    hrow.appendChild(th);
  });
  thead.appendChild(hrow);
  table.appendChild(thead);

  // tbody
  const tbody = document.createElement("tbody");
  buildTableRows(tbody, data);
  table.appendChild(tbody);
  return table;
}

/* =====================================================
   IMAGE MODAL
===================================================== */
function openImageModal(src, name, tblEl) {
  document.getElementById("imgModal")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "imgModal";
  overlay.className =
    "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4";
  overlay.style.backdropFilter = "blur(4px)";

  // ── Outer container ──
  const box = document.createElement("div");
  box.className = "relative w-full flex flex-col bg-transparent";
  box.style.maxWidth = "95vw";
  box.style.maxHeight = "92vh";

  // ── Top bar: filename + close ──
  const topBar = document.createElement("div");
  topBar.className = "flex items-center justify-between mb-2 px-1";

  const label = document.createElement("p");
  label.className = "text-white text-sm opacity-80 truncate";
  label.textContent = name;

  const closeBtn = document.createElement("button");
  closeBtn.className =
    "flex-shrink-0 ml-4 text-white text-2xl font-bold hover:text-gray-300 transition-colors leading-none";
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", () => overlay.remove());

  topBar.append(label, closeBtn);

  // ── Content row: image left + table right ──
  const contentRow = document.createElement("div");
  contentRow.className = "flex gap-4 overflow-hidden";
  contentRow.style.maxHeight = "85vh";

  // Image col
  const imgCol = document.createElement("div");
  imgCol.className = "flex-shrink-0 flex items-start justify-center";
  imgCol.style.maxWidth = tblEl ? "55%" : "100%";

  const img = document.createElement("img");
  img.src = src;
  img.alt = name;
  img.className = "rounded-xl shadow-2xl object-contain w-full";
  img.style.maxHeight = "85vh";
  imgCol.appendChild(img);

  contentRow.appendChild(imgCol);

  // Table col (if tbl DOM element provided)
  if (tblEl) {
    const rowCount = tblEl.querySelectorAll("tbody tr").length;
    const tableCol = document.createElement("div");
    tableCol.className = "flex-1 bg-white rounded-xl overflow-auto shadow-xl";
    tableCol.style.maxHeight = "85vh";

    // Header
    const tblHeader = document.createElement("div");
    tblHeader.className =
      "sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2";
    tblHeader.innerHTML = `
      <span class="font-semibold text-gray-700 text-sm">Item Ditemukan</span>
      <span class="bg-blue-100 text-blue-700 text-xs font-bold rounded-full px-2 py-0.5">${rowCount}</span>
    `;

    // Clone the live table so edits show up, but modal copy is read-only display
    const clonedTbl = tblEl.cloneNode(true);
    clonedTbl.className = "w-full border-collapse text-sm";
    // Strip edit interactivity from clone
    clonedTbl.querySelectorAll("td").forEach((td) => {
      td.style.cursor = "default";
      td.style.outline = "";
      td.title = "";
    });

    tableCol.appendChild(tblHeader);
    tableCol.appendChild(clonedTbl);
    contentRow.appendChild(tableCol);
  }

  box.append(topBar, contentRow);
  overlay.appendChild(box);

  // Close on backdrop
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Close on Escape
  const onKey = (e) => {
    if (e.key === "Escape") {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    }
  };
  document.addEventListener("keydown", onKey);

  document.body.appendChild(overlay);
}

/* =====================================================
   APPEND IMAGE SECTION  (called per-image after n8n returns)
===================================================== */
function appendImageSection(file, data, index) {
  if (!data || data.length === 0) return;

  // ── Merge into collectedItems (for Trums form) ──
  const newItems = data
    .map((item) => ({
      item: item.nama_item || "",
      deskripsi: item.deskripsi || "",
      quantity: item.quantity ?? "",
      unit: item.unit || "",
    }))
    .filter((r) => r.item || r.deskripsi);
  collectedItems = collectedItems.concat(newItems);
  updateCollectedBadge();

  // ── Section card ──
  const section = document.createElement("div");
  section.className =
    "bg-white rounded-xl shadow border border-gray-200 overflow-hidden";
  section.dataset.sectionIndex = index;

  // ── Collapsible header bar ──
  const headerBar = document.createElement("div");
  headerBar.className =
    "flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer select-none hover:bg-gray-100 transition-colors";

  const numBadge = document.createElement("span");
  numBadge.className =
    "flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center";
  numBadge.textContent = index + 1;

  const fileName = document.createElement("span");
  fileName.className = "flex-1 text-sm font-semibold text-gray-700 truncate";
  fileName.textContent = file.name;

  const itemCount = document.createElement("span");
  itemCount.className = "text-xs text-gray-500 flex-shrink-0";
  itemCount.textContent = `${data.length} item`;

  const chevron = document.createElement("span");
  chevron.className =
    "text-gray-400 text-sm flex-shrink-0 transition-transform duration-200";
  chevron.textContent = "▾";

  headerBar.append(numBadge, fileName, itemCount, chevron);

  // ── Body: image (left) + table (right) side by side ──
  const body = document.createElement("div");
  body.className = "flex gap-0";

  // Left: full-size image (clickable to open modal)
  const imgCol = document.createElement("div");
  imgCol.className =
    "flex-shrink-0 w-56 border-r border-gray-200 bg-gray-50 flex items-start justify-center p-3";

  const imgEl = document.createElement("img");
  imgEl.className =
    "w-full rounded-lg border border-gray-200 shadow-sm object-contain cursor-zoom-in hover:opacity-90 transition-opacity";
  imgEl.alt = file.name;
  imgEl.style.maxHeight = "360px";
  imgEl.title = "Klik untuk lihat full size";

  const fr = new FileReader();
  fr.onload = (ev) => {
    imgEl.src = ev.target.result;
    imgEl.addEventListener("click", () =>
      openImageModal(ev.target.result, file.name, tbl),
    );
  };
  fr.readAsDataURL(file);

  imgCol.appendChild(imgEl);

  // Right: editable table
  const tableCol = document.createElement("div");
  tableCol.className = "flex-1 overflow-x-auto";
  const tbl = makeMiniTable(data);
  tableCol.appendChild(tbl);

  body.appendChild(imgCol);
  body.appendChild(tableCol);

  // ── Assemble ──
  section.appendChild(headerBar);
  section.appendChild(body);

  resultsContainer.appendChild(section);

  // ── Collapse toggle ──
  let collapsed = false;
  headerBar.addEventListener("click", () => {
    collapsed = !collapsed;
    body.style.display = collapsed ? "none" : "";
    chevron.style.transform = collapsed ? "rotate(-90deg)" : "";
  });
}

/* =====================================================
   AUTOCOMPLETE FACTORY
   Reusable untuk contacts maupun address
===================================================== */
function setupAutocomplete({
  inputEl,
  dropdownEl,
  hiddenEl,
  searchTable,
  displayField,
  subField,
  idField,
  customRender,
  onNoResults,
  noResultsLabel = null,
  onSelect = null,
  extraPayload = {},
}) {
  let debounceTimer = null;

  async function searchItems(keyword) {
    try {
      const res = await fetch(`${URL}/api/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify({
          keyword,
          table: searchTable,
          column: [],
          limit: "10",
          offset: "1",
          sort: null,
          flag: "form",
          ...extraPayload,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return Array.isArray(json) ? json : (json.data?.data ?? json.data ?? []);
    } catch (err) {
      console.error(`Autocomplete [${searchTable}] error:`, err);
      return [];
    }
  }

  function renderDropdown(results, keyword) {
    dropdownEl.innerHTML = "";
    if (!results.length) {
      const noResultDiv = document.createElement("div");
      noResultDiv.className = "px-4 py-3 text-sm text-gray-500";
      noResultDiv.textContent = "Tidak ada hasil";
      dropdownEl.appendChild(noResultDiv);

      if (onNoResults) {
        const addBtn = document.createElement("div");
        addBtn.className =
          "px-4 py-2.5 cursor-pointer flex items-center gap-2 text-sm text-blue-400 hover:bg-gray-700 transition-colors border-t border-gray-700 font-semibold";
        const btnLabel = noResultsLabel
          ? noResultsLabel
          : `Tambah Perusahaan "<span class="text-white">${keyword}</span>"`;
        addBtn.innerHTML = `<span class="text-lg leading-none">＋</span> ${btnLabel}`;
        addBtn.addEventListener("mousedown", (e) => {
          e.preventDefault();
          dropdownEl.classList.add("hidden");
          onNoResults(keyword);
        });
        dropdownEl.appendChild(addBtn);
      }

      dropdownEl.classList.remove("hidden");
      return;
    }
    results.forEach((record) => {
      const label =
        (typeof displayField === "function"
          ? displayField(record)
          : record[displayField]) ?? JSON.stringify(record);
      const sub = subField
        ? ((typeof subField === "function"
            ? subField(record)
            : record[subField]) ?? "")
        : "";
      const id = idField ? (record[idField] ?? "") : "";

      const item = document.createElement("div");
      item.className =
        "px-4 py-2.5 cursor-pointer hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-0";

      if (customRender) {
        item.innerHTML = customRender(record);
      } else {
        item.innerHTML = `
          <div class="text-sm text-white font-medium">${label}</div>
          ${sub ? `<div class="text-xs text-gray-400 mt-0.5">${sub}</div>` : ""}
        `;
      }

      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        inputEl.value = label;
        if (hiddenEl) hiddenEl.value = id;
        if (onSelect) onSelect(record);
        dropdownEl.classList.add("hidden");
      });
      dropdownEl.appendChild(item);
    });
    dropdownEl.classList.remove("hidden");
  }

  inputEl.addEventListener("input", () => {
    if (hiddenEl) hiddenEl.value = "";
    const kw = inputEl.value.trim();
    clearTimeout(debounceTimer);
    if (kw.length < 1) {
      dropdownEl.classList.add("hidden");
      return;
    }
    debounceTimer = setTimeout(async () => {
      dropdownEl.innerHTML = `<div class="px-4 py-3 text-sm text-gray-400 flex items-center gap-2"><span class="animate-spin inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full"></span> Mencari...</div>`;
      dropdownEl.classList.remove("hidden");
      const results = await searchItems(kw);
      renderDropdown(results, kw);
    }, 300);
  });

  inputEl.addEventListener("blur", () => {
    setTimeout(() => dropdownEl.classList.add("hidden"), 150);
  });

  inputEl.addEventListener("focus", () => {
    if (inputEl.value.trim().length >= 1 && dropdownEl.children.length) {
      dropdownEl.classList.remove("hidden");
    }
  });

  inputEl.addEventListener("keydown", (e) => {
    const items = dropdownEl.querySelectorAll("div[class*='cursor-pointer']");
    const active = dropdownEl.querySelector(".bg-gray-600");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!items.length) return;
      const next = active ? (active.nextElementSibling ?? items[0]) : items[0];
      active?.classList.remove("bg-gray-600");
      next.classList.add("bg-gray-600");
      next.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!items.length) return;
      const prev = active
        ? (active.previousElementSibling ?? items[items.length - 1])
        : items[items.length - 1];
      active?.classList.remove("bg-gray-600");
      prev.classList.add("bg-gray-600");
      prev.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && active) {
      e.preventDefault();
      active.dispatchEvent(new MouseEvent("mousedown"));
    } else if (e.key === "Escape") {
      dropdownEl.classList.add("hidden");
    }
  });
}

/* =====================================================
   TRUMS INLINE PANEL
===================================================== */
function showTrumsModal() {
  document.getElementById("trumsPanelWrapper")?.remove();

  const wrapper = document.createElement("div");
  wrapper.id = "trumsPanelWrapper";
  wrapper.className = "bg-gray-900 rounded-2xl shadow-2xl mt-6 overflow-hidden";
  wrapper.style.color = "#e5e7eb";

  // Insert BEFORE resultsContainer (above hasil konversi)
  const resultsContainerEl = document.getElementById("resultsContainer");
  resultsContainerEl.parentNode.insertBefore(wrapper, resultsContainerEl);

  setTimeout(
    () => wrapper.scrollIntoView({ behavior: "smooth", block: "start" }),
    50,
  );

  const modal = wrapper;

  // No mapping needed — columns are fixed (nama_item, deskripsi, quantity, unit)

  modal.innerHTML = `
    <div class="p-6 border-b border-gray-700 flex justify-between items-center">
      <div>
        <h2 class="text-xl font-bold text-white">🚀 Upload ke Trums</h2>
        <p class="text-sm text-gray-400 mt-1">Item dari semua gambar yang dikonversi sudah otomatis terkumpul di bawah</p>
      </div>
      <button id="trumsCloseBtn" class="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
    </div>

    <!-- Header fields -->
    <div class="p-6 space-y-4 border-b border-gray-700">

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-semibold text-gray-300 mb-1">
            <span class="text-red-400">*</span> Nama Perusahaan/Perorangan
          </label>
          <div class="relative">
            <input id="tf_nama" type="text" placeholder="Cari Kontak" autocomplete="off"
              class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div id="tf_nama_dropdown"
              class="absolute z-50 w-full bg-gray-800 border border-gray-600 rounded-lg mt-1 shadow-xl hidden max-h-52 overflow-y-auto">
            </div>
          </div>
          <input id="tf_nama_id" type="hidden" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-300 mb-1">File Lampiran</label>
          <label class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors">
            📎 Upload File
            <input id="tf_file" type="file" class="hidden" multiple />
          </label>
          <div id="tf_file_preview" class="mt-2 flex flex-wrap gap-2"></div>
        </div>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-300 mb-1">PIC</label>
        <div class="relative">
          <input id="tf_pic" type="text" placeholder="Cari PIC/Kontak" autocomplete="off"
            class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div id="tf_pic_dropdown"
            class="absolute z-50 w-full bg-gray-800 border border-gray-600 rounded-lg mt-1 shadow-xl hidden max-h-52 overflow-y-auto">
          </div>
        </div>
        <input id="tf_pic_id" type="hidden" />
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-300 mb-1">Alamat Perusahaan/Perorangan</label>
        <div class="relative">
          <input id="tf_alamat" type="text" placeholder="Cari Alamat/Buat Baru" autocomplete="off"
            class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div id="tf_alamat_dropdown"
            class="absolute z-50 w-full bg-gray-800 border border-gray-600 rounded-lg mt-1 shadow-xl hidden max-h-52 overflow-y-auto">
          </div>
        </div>
        <input id="tf_alamat_id" type="hidden" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-semibold text-gray-300 mb-1">
            <span class="text-red-400">*</span> Tanggal Permintaan
          </label>
          <input id="tf_tanggal" type="date" value="${new Date().toISOString().split("T")[0]}"
            class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-300 mb-1">Prioritas</label>
          <div class="flex gap-0 rounded-lg overflow-hidden border border-gray-600 w-fit">
            ${["Low", "Medium", "High"]
              .map(
                (p, i) =>
                  `<button type="button" data-priority="${p}"
                class="priority-btn px-4 py-2 text-sm font-semibold transition-colors ${i === 0 ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}"
              >${p}</button>`,
              )
              .join("")}
          </div>
        </div>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-300 mb-1">Note</label>
        <textarea id="tf_note" rows="3" placeholder="Tambahkan catatan..."
          class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"></textarea>
      </div>
    </div>

    <!-- Item table -->
    <div class="p-6">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📋 Daftar Item</p>
      <div class="overflow-x-auto rounded-lg border border-gray-700">
        <table class="w-full text-sm" id="trumsItemTable">
          <thead>
            <tr class="bg-gray-800 text-gray-300">
              <th class="px-3 py-2 text-left font-semibold w-16">Image</th>
              <th class="px-3 py-2 text-left font-semibold">Item</th>
              <th class="px-3 py-2 text-left font-semibold">Deskripsi</th>
              <th class="px-3 py-2 text-left font-semibold w-24">Qty</th>
              <th class="px-3 py-2 text-left font-semibold w-24">Unit</th>
              <th class="px-3 py-2 text-center font-semibold w-12">Del</th>
            </tr>
          </thead>
          <tbody id="trumsItemBody">
            <!-- rows injected here -->
          </tbody>
        </table>
      </div>
      <button id="trumsAddRowBtn" type="button"
        class="mt-3 w-full border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 py-2 rounded-lg text-sm font-semibold transition-colors">
        + Tambahkan Baris Baru
      </button>
    </div>

    <!-- Footer -->
    <div class="px-6 pb-6 flex gap-3 justify-end">
      <button id="trumsModalCancelBtn"
        class="px-5 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-colors">
        Batal
      </button>
      <button id="trumsSubmitBtn"
        class="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors">
        🚀 Upload ke Trums
      </button>
    </div>
  `;

  // --- Autocomplete: Nama Perusahaan ---
  let selectedNamaContact = null;
  setupAutocomplete({
    inputEl: document.getElementById("tf_nama"),
    dropdownEl: document.getElementById("tf_nama_dropdown"),
    hiddenEl: document.getElementById("tf_nama_id"),
    searchTable: "contacts",
    displayField: (r) =>
      r.name ?? r.nama ?? r.contact_name ?? JSON.stringify(r),
    subField: (r) => r.email ?? r.phone ?? r.telp ?? "",
    idField: "unique_id",
    onSelect: (r) => {
      selectedNamaContact = {
        unique_id: r.unique_id ?? "",
        version: r.version ?? "",
      };
    },
    onNoResults: (keyword) => showTambahPerusahaanForm(keyword),
  });
  document.getElementById("tf_nama").addEventListener("input", () => {
    selectedNamaContact = null;
  });

  // --- Autocomplete: Alamat ---
  let selectedAlamatContact = null;
  setupAutocomplete({
    inputEl: document.getElementById("tf_alamat"),
    dropdownEl: document.getElementById("tf_alamat_dropdown"),
    hiddenEl: document.getElementById("tf_alamat_id"),
    searchTable: "address",
    displayField: (r) => {
      return r.street ?? r.address ?? r.alamat ?? r.name ?? JSON.stringify(r);
    },
    subField: (r) => {
      return null;
    },
    idField: "unique_id",
    onSelect: (r) => {
      selectedAlamatContact = {
        unique_id: r.unique_id ?? "",
        version: r.version ?? "",
      };
    },
    customRender: (r) => {
      const contactName = r.contact_name ?? r.name ?? "";
      const addressName = r.address_name ?? "";
      const street = r.street ?? r.address ?? r.alamat ?? "";
      const parts = [r.village, r.city, r.regency, r.province]
        .filter(Boolean)
        .join(", ");
      const codepos = r.codepos ? ` ${r.codepos}` : "";

      return `
        <div class="text-sm text-white font-semibold leading-snug">
          ${addressName ? `<span>${addressName}</span>` : ""}
          ${contactName ? `<span class="text-purple-400 font-normal text-xs ml-1">(${contactName})</span>` : ""}
        </div>
        ${street ? `<div class="text-xs text-gray-300 mt-0.5">${street}</div>` : ""}
        ${parts ? `<div class="text-xs text-gray-500 mt-0.5">${parts}${codepos}</div>` : ""}
      `;
    },
    onNoResults: () =>
      showFormAlamat(null, null, (result) => {
        const tfAlamat = document.getElementById("tf_alamat");
        const tfAlamatId = document.getElementById("tf_alamat_id");
        if (tfAlamat) {
          const display = [result.address_name, result.street, result.wilayah]
            .filter(Boolean)
            .join(", ");
          tfAlamat.value = display;
        }
        if (tfAlamatId)
          tfAlamatId.value = result.returned_id ?? result.id ?? "";
        selectedAlamatContact = {
          unique_id: result.returned_id ?? result.id ?? "",
          version: "",
        };
      }),
    noResultsLabel: "Tambah Alamat Baru",
  });
  document.getElementById("tf_alamat").addEventListener("input", () => {
    selectedAlamatContact = null;
  });

  // --- Autocomplete: PIC ---
  let selectedPicContact = null;
  setupAutocomplete({
    inputEl: document.getElementById("tf_pic"),
    dropdownEl: document.getElementById("tf_pic_dropdown"),
    hiddenEl: document.getElementById("tf_pic_id"),
    searchTable: "contacts",
    displayField: (r) =>
      r.name ?? r.nama ?? r.contact_name ?? JSON.stringify(r),
    subField: (r) => r.email ?? r.phone ?? r.telp ?? "",
    idField: "unique_id",
    onSelect: (r) => {
      selectedPicContact = {
        unique_id: r.unique_id ?? "",
        version: r.version ?? "",
      };
    },
    onNoResults: (keyword) =>
      showTambahPerusahaanForm(keyword, (result) => {
        const tfPic = document.getElementById("tf_pic");
        const tfPicId = document.getElementById("tf_pic_id");
        if (tfPic) tfPic.value = result.name;
        if (tfPicId) tfPicId.value = result.unique_id;
        selectedPicContact = {
          unique_id: result.unique_id,
          version: result.version,
        };
      }),
    noResultsLabel: "Tambah PIC Baru",
  });
  document.getElementById("tf_pic").addEventListener("input", () => {
    selectedPicContact = null;
  });

  // --- Priority toggle ---
  let selectedPriority = "Low";
  modal.querySelectorAll(".priority-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedPriority = btn.dataset.priority;
      modal.querySelectorAll(".priority-btn").forEach((b) => {
        b.className =
          b === btn
            ? "priority-btn px-4 py-2 text-sm font-semibold transition-colors bg-blue-600 text-white"
            : "priority-btn px-4 py-2 text-sm font-semibold transition-colors bg-gray-800 text-gray-300 hover:bg-gray-700";
      });
    });
  });

  // --- File input label (multiple) ---
  let selectedFiles = [];
  document.getElementById("tf_file").addEventListener("change", (e) => {
    const newFiles = Array.from(e.target.files);
    newFiles.forEach((file) => {
      if (
        !selectedFiles.find((f) => f.name === file.name && f.size === file.size)
      ) {
        selectedFiles.push(file);
      }
    });
    renderFilePreview();
  });

  function renderFilePreview() {
    const container = document.getElementById("tf_file_preview");
    container.innerHTML = "";
    selectedFiles.forEach((file, idx) => {
      const isImage = file.type.startsWith("image/");
      const card = document.createElement("div");
      card.className =
        "relative group w-20 h-20 rounded-lg border border-gray-600 bg-gray-800 overflow-hidden flex items-center justify-center";

      if (isImage) {
        const img = document.createElement("img");
        img.className = "w-full h-full object-cover";
        const reader = new FileReader();
        reader.onload = (ev) => {
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
        card.appendChild(img);
      } else {
        const icon = document.createElement("div");
        icon.className = "text-center px-1";
        icon.innerHTML = `<div class="text-2xl">📄</div><div class="text-xs text-gray-400 truncate w-16 text-center">${file.name}</div>`;
        card.appendChild(icon);
      }

      // Remove button
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className =
        "absolute top-0.5 right-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none";
      removeBtn.textContent = "✕";
      removeBtn.addEventListener("click", () => {
        selectedFiles.splice(idx, 1);
        renderFilePreview();
      });
      card.appendChild(removeBtn);

      // Filename tooltip
      card.title = file.name;
      container.appendChild(card);
    });
  }

  // --- Item table helpers ---
  function trInputClass(extra = "") {
    return `bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-400 w-full ${extra}`;
  }

  function addItemRow(data = {}) {
    const tbody = document.getElementById("trumsItemBody");
    const tr = document.createElement("tr");
    tr.className = "border-t border-gray-700 align-top";
    tr.innerHTML = `
      <td class="px-3 py-2">
        <label class="flex items-center justify-center w-12 h-12 bg-gray-800 border border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 transition-colors overflow-hidden relative">
          <span class="row-img-placeholder text-gray-500 text-xl">🖼</span>
          <img class="row-img-preview hidden w-full h-full object-cover absolute inset-0" />
          <input type="file" accept="image/*" class="hidden row-img-input" />
        </label>
      </td>
      <td class="px-3 py-2"><input type="text" placeholder="Please input" value="${data.item || ""}" class="${trInputClass()}" data-col="item" /></td>
      <td class="px-3 py-2"><textarea placeholder="Tambahkan Deskripsi" rows="2" class="${trInputClass("resize-y")}" data-col="deskripsi">${data.deskripsi || ""}</textarea></td>
      <td class="px-3 py-2"><input type="number" value="${data.quantity || 1}" min="0" class="${trInputClass("text-right")}" data-col="quantity" /></td>
      <td class="px-3 py-2"><input type="text" placeholder="Input Unit" value="${data.unit || ""}" class="${trInputClass()}" data-col="unit" /></td>
      <td class="px-3 py-2 text-center">
        <button type="button" class="delete-row-btn bg-red-600 hover:bg-red-700 text-white rounded-lg w-8 h-8 flex items-center justify-center mx-auto transition-colors">🗑</button>
      </td>
    `;

    // Image preview handler
    const imgInput = tr.querySelector(".row-img-input");
    const imgPreview = tr.querySelector(".row-img-preview");
    const imgPlaceholder = tr.querySelector(".row-img-placeholder");
    imgInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        imgPreview.src = ev.target.result;
        imgPreview.classList.remove("hidden");
        imgPlaceholder.classList.add("hidden");
      };
      reader.readAsDataURL(file);
    });

    tr.querySelector(".delete-row-btn").addEventListener("click", () => {
      tr.remove();
      if (document.getElementById("trumsItemBody").children.length === 0)
        addItemRow();
    });

    tbody.appendChild(tr);
  }

  // Auto-populate dari tabel hasil konversi (baca DOM langsung supaya edit inline ikut)
  const liveItems = [];
  document.querySelectorAll("#resultsContainer tbody tr").forEach((tr) => {
    const cells = tr.querySelectorAll("td");
    if (cells.length < 4) return;
    const item = {
      item: cells[0]?.innerText.trim().replace(/-$/, "").trim(),
      deskripsi: cells[1]?.innerText.trim().replace(/-$/, "").trim(),
      quantity: cells[2]?.innerText.trim().replace(/-$/, "").trim(),
      unit: cells[3]?.innerText.trim().replace(/-$/, "").trim(),
    };
    if (item.item || item.deskripsi) liveItems.push(item);
  });

  if (liveItems.length > 0) {
    liveItems.forEach((item) => addItemRow(item));
  } else {
    addItemRow();
  }

  document
    .getElementById("trumsAddRowBtn")
    .addEventListener("click", () => addItemRow());

  // --- Close ---
  document
    .getElementById("trumsCloseBtn")
    .addEventListener("click", () => wrapper.remove());
  document
    .getElementById("trumsModalCancelBtn")
    .addEventListener("click", () => wrapper.remove());

  // --- Submit ---
  document
    .getElementById("trumsSubmitBtn")
    .addEventListener("click", async () => {
      const nama = document.getElementById("tf_nama").value.trim();
      const tanggal = document.getElementById("tf_tanggal").value;

      if (!nama) {
        document
          .getElementById("tf_nama")
          .classList.add("ring-2", "ring-red-500");
        showNotification("❌ Nama Perusahaan/Perorangan wajib diisi", "error");
        return;
      }
      if (!tanggal) {
        document
          .getElementById("tf_tanggal")
          .classList.add("ring-2", "ring-red-500");
        showNotification("❌ Tanggal Permintaan wajib diisi", "error");
        return;
      }

      const itemRows = Array.from(
        document.querySelectorAll("#trumsItemBody tr"),
      )
        .map((tr) => {
          const obj = {};
          tr.querySelectorAll("[data-col]").forEach((input) => {
            obj[input.dataset.col] = input.value.trim();
          });
          return obj;
        })
        .filter((r) => r.item || r.deskripsi);

      if (itemRows.length === 0) {
        const tbody = document.getElementById("trumsItemBody");
        tbody
          .closest("table")
          .scrollIntoView({ behavior: "smooth", block: "center" });
        tbody.style.outline = "2px solid #f87171";
        tbody.style.borderRadius = "4px";
        setTimeout(() => {
          tbody.style.outline = "";
        }, 2500);
        showNotification(
          "❌ Daftar item masih kosong, isi minimal satu item",
          "error",
        );
        return;
      }

      // Build FormData
      const formData = new FormData();
      const unixTimestamp = Math.floor(new Date(tanggal).getTime() / 1000);
      formData.append("date", unixTimestamp);
      formData.append("type", "sales_inquiry");
      formData.append("status", "draft");
      formData.append("priority", selectedPriority.toLocaleLowerCase());
      formData.append(
        "description",
        document.getElementById("tf_note").value.trim(),
      );
      formData.append(
        "request_to_id",
        selectedNamaContact?.unique_id ||
          document.getElementById("tf_nama_id").value ||
          "",
      );

      formData.append("request_to_version", selectedNamaContact?.version || "");
      formData.append(
        "address_id",
        selectedAlamatContact?.unique_id ??
          document.getElementById("tf_alamat_id").value.trim(),
      );
      formData.append("address_version", selectedAlamatContact?.version ?? "");
      formData.append("request_by_id", selectedPicContact?.unique_id ?? "");
      formData.append("request_by_version", selectedPicContact?.version ?? "");

      itemRows.forEach((item, i) => {
        formData.append(`item_request[${i}][catalogue_name]`, item.item ?? "");
        formData.append(
          `item_request[${i}][description]`,
          item.deskripsi ?? "",
        );
        formData.append(`item_request[${i}][unit_name]`, item.unit ?? "");
        formData.append(`item_request[${i}][request_qty]`, item.quantity ?? "");
        formData.append(
          `item_request[${i}][remaining_qty]`,
          item.quantity ?? "",
        );
        // Attach item image if any
        const rowEl = document.querySelectorAll("#trumsItemBody tr")[i];
        const imgFile = rowEl?.querySelector(".row-img-input")?.files?.[0];
        if (imgFile) formData.append(`item_request[${i}][files]`, imgFile);
      });

      // Attach lampiran files
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const submitBtn = document.getElementById("trumsSubmitBtn");
      submitBtn.disabled = true;
      submitBtn.textContent = "⏳ Mengupload...";

      try {
        const response = await fetch(`${URL}/api/inquiries-create`, {
          headers: {
            Authorization: `Bearer ${JWT_TOKEN}`,
          },
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        wrapper.remove();
        collectedItems = [];
        uploadedImages = [];
        convertedIndices = new Set();
        updateCollectedBadge();
        showNotification("✅ Berhasil diupload ke Trums!", "success");
      } catch (err) {
        console.error(err);
        submitBtn.disabled = false;
        submitBtn.textContent = "🚀 Upload ke Trums";
        showNotification("❌ Gagal upload ke Trums. Coba lagi.", "error");
      }
    });
}

/* =====================================================
   TAMBAH PERUSAHAAN FORM
===================================================== */
// --- Alamat helpers ---
function showFormAlamat(
  existingData = null,
  existingCard = null,
  onSuccess = null,
) {
  document.getElementById("formAlamatOverlay")?.remove();

  const faCls =
    "w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

  const faOverlay = document.createElement("div");
  faOverlay.id = "formAlamatOverlay";
  faOverlay.className =
    "fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[70] p-4";
  faOverlay.style.backdropFilter = "blur(3px)";

  // Build wilayah display string for prefill
  const wilayahDisplay = existingData
    ? [
        existingData.village,
        existingData.city,
        existingData.regency,
        existingData.province,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  faOverlay.innerHTML = `
    <div class="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg" style="color:#e5e7eb">
      <!-- Header -->
      <div class="px-5 py-4 flex justify-between items-center border-b border-gray-700">
        <h3 class="text-base font-bold text-white">Form Alamat</h3>
        <button id="faCloseBtn" class="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-3">
        <!-- Row 1: Cari Nama Kontak + Nama/Label Alamat -->
        <div class="grid grid-cols-2 gap-3">
          <div class="relative">
            <input id="fa_kontak" type="text" placeholder="Cari Nama Kontak" autocomplete="off"
              value="${existingData?.contact_name || ""}"
              class="${faCls}" />
            <div id="fa_kontak_dropdown"
              class="absolute z-50 w-full bg-gray-800 border border-gray-600 rounded-lg mt-1 shadow-xl hidden max-h-48 overflow-y-auto">
            </div>
            <input id="fa_kontak_id" type="hidden" value="${existingData?.contact_id || ""}" />
          </div>
          <div>
            <input id="fa_nama" type="text" placeholder="Nama/Label Alamat"
              value="${existingData?.nama_alamat || ""}"
              class="${faCls}" />
            <p id="fa_nama_err" class="text-red-400 text-xs mt-1 hidden">Masukan Nama/Label Alamat</p>
          </div>
        </div>

        <!-- Wilayah autocomplete -->
        <div class="relative">
          <input id="fa_wilayah" type="text" autocomplete="off"
            placeholder="Kelurahan/Desa, Kecamatan, Kabupaten/Kota atau provinsi"
            value="${wilayahDisplay}"
            class="${faCls}" />
          <div id="fa_wilayah_dropdown"
            class="absolute z-50 w-full bg-gray-800 border border-gray-600 rounded-lg mt-1 shadow-xl hidden max-h-52 overflow-y-auto">
          </div>
          <input id="fa_wilayah_id" type="hidden" value="${existingData?.address_id || ""}" />
        </div>

        <!-- Jalan textarea -->
        <textarea id="fa_jalan" rows="3" placeholder="Nama Jalan, Gedung, Nomor Rumah"
          class="${faCls} resize-y">${existingData?.street || ""}</textarea>

        <!-- Kode Pos -->
        <input id="fa_kodepos" type="text" placeholder="Kode Pos"
          value="${existingData?.codepos || ""}"
          class="${faCls}" />
      </div>

      <!-- Footer -->
      <div class="px-5 pb-5 flex gap-3 items-center border-t border-gray-700 pt-4">
        <button id="faCancelBtn"
          class="px-5 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-colors">
          Batal
        </button>
        <button id="faSaveBtn"
          class="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
          Simpan
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(faOverlay);
  setTimeout(() => document.getElementById("fa_kontak")?.focus(), 50);

  // Selected data stores
  let selectedKontak = existingData?.contact_id
    ? { unique_id: existingData.contact_id, name: existingData.contact_name }
    : null;
  let selectedWilayah = existingData?.village_id
    ? {
        village_id: existingData.village_id,
        village: existingData.village,
        city: existingData.city,
        regency: existingData.regency,
        province: existingData.province,
      }
    : null;

  // --- Autocomplete: Cari Nama Kontak (simpan unique_id + name) ---
  setupAutocomplete({
    inputEl: document.getElementById("fa_kontak"),
    dropdownEl: document.getElementById("fa_kontak_dropdown"),
    hiddenEl: document.getElementById("fa_kontak_id"),
    searchTable: "contacts",
    displayField: (r) => r.name ?? r.contact_name ?? JSON.stringify(r),
    subField: (r) => r.email ?? r.phone ?? r.telp ?? "",
    idField: "unique_id",
    onSelect: (r) => {
      selectedKontak = {
        unique_id: r.unique_id ?? "",
        name: r.name ?? r.contact_name ?? "",
      };
    },
  });
  document.getElementById("fa_kontak").addEventListener("input", () => {
    selectedKontak = null;
  });

  // --- Autocomplete: Wilayah Indonesia ---
  const faWilayahInput = document.getElementById("fa_wilayah");
  const faWilayahDropdown = document.getElementById("fa_wilayah_dropdown");
  const faWilayahHidden = document.getElementById("fa_wilayah_id");

  let faDebounce = null;

  async function searchWilayah(keyword) {
    try {
      const res = await fetch(`${URL}/api/search-indonesia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify({ keyword, limit: 500, offset: 1 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return Array.isArray(json) ? json : (json.data?.data ?? json.data ?? []);
    } catch (err) {
      console.error("FA wilayah search error:", err);
      return [];
    }
  }

  function renderWilayahDropdown(results) {
    faWilayahDropdown.innerHTML = "";
    if (!results.length) {
      faWilayahDropdown.innerHTML = `<div class="px-4 py-3 text-sm text-gray-500">Tidak ada hasil</div>`;
      faWilayahDropdown.classList.remove("hidden");
      return;
    }
    results.forEach((r) => {
      const item = document.createElement("div");
      item.className =
        "px-4 py-2.5 cursor-pointer hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-0";
      item.innerHTML = `<div class="text-sm text-white">${r.name}</div>`;
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        faWilayahInput.value = r.name;
        faWilayahHidden.value = r.id ?? "";
        // Split: "PASAR BARU, SAWAH BESAR, KOTA JAKARTA PUSAT, DKI JAKARTA"
        const parts = r.name.split(",").map((s) => s.trim());
        selectedWilayah = {
          village_id: r.id ?? "",
          village: parts[0] ?? "",
          city: parts[1] ?? "",
          regency: parts[2] ?? "",
          province: parts[3] ?? "",
        };
        faWilayahDropdown.classList.add("hidden");
      });
      faWilayahDropdown.appendChild(item);
    });
    faWilayahDropdown.classList.remove("hidden");
  }

  faWilayahInput.addEventListener("input", () => {
    faWilayahHidden.value = "";
    selectedWilayah = null;
    const kw = faWilayahInput.value.trim();
    clearTimeout(faDebounce);
    if (kw.length < 1) {
      faWilayahDropdown.classList.add("hidden");
      return;
    }
    faDebounce = setTimeout(async () => {
      faWilayahDropdown.innerHTML = `<div class="px-4 py-3 text-sm text-gray-400 flex items-center gap-2"><span class="animate-spin inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full"></span> Mencari...</div>`;
      faWilayahDropdown.classList.remove("hidden");
      const results = await searchWilayah(kw);
      renderWilayahDropdown(results);
    }, 300);
  });
  faWilayahInput.addEventListener("blur", () =>
    setTimeout(() => faWilayahDropdown.classList.add("hidden"), 150),
  );
  faWilayahInput.addEventListener("focus", () => {
    if (
      faWilayahInput.value.trim().length >= 1 &&
      faWilayahDropdown.children.length
    )
      faWilayahDropdown.classList.remove("hidden");
  });

  // Keyboard nav
  faWilayahInput.addEventListener("keydown", (e) => {
    const items = faWilayahDropdown.querySelectorAll(
      "div[class*='cursor-pointer']",
    );
    const active = faWilayahDropdown.querySelector(".bg-gray-600");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!items.length) return;
      const next = active ? (active.nextElementSibling ?? items[0]) : items[0];
      active?.classList.remove("bg-gray-600");
      next.classList.add("bg-gray-600");
      next.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!items.length) return;
      const prev = active
        ? (active.previousElementSibling ?? items[items.length - 1])
        : items[items.length - 1];
      active?.classList.remove("bg-gray-600");
      prev.classList.add("bg-gray-600");
      prev.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && active) {
      e.preventDefault();
      active.dispatchEvent(new MouseEvent("mousedown"));
    } else if (e.key === "Escape") {
      faWilayahDropdown.classList.add("hidden");
    }
  });

  function closeFA() {
    faOverlay.remove();
  }

  document.getElementById("faCloseBtn").addEventListener("click", closeFA);
  document.getElementById("faCancelBtn").addEventListener("click", closeFA);
  faOverlay.addEventListener("click", (e) => {
    if (e.target === faOverlay) closeFA();
  });

  document.getElementById("faSaveBtn").addEventListener("click", async () => {
    const nama = document.getElementById("fa_nama").value.trim();
    const namaErr = document.getElementById("fa_nama_err");
    if (!nama) {
      document
        .getElementById("fa_nama")
        .classList.add("ring-2", "ring-red-500", "border-red-500");
      namaErr.classList.remove("hidden");
      return;
    }
    namaErr.classList.add("hidden");
    document
      .getElementById("fa_nama")
      .classList.remove("ring-2", "ring-red-500", "border-red-500");

    const payload = {
      contact_id: selectedKontak?.unique_id ?? "",
      contact_name:
        selectedKontak?.name ??
        document.getElementById("fa_kontak").value.trim(),
      address_name: nama,
      street: document.getElementById("fa_jalan").value.trim(),
      village_id: selectedWilayah?.village_id ?? "",
      village: selectedWilayah?.village ?? "",
      city: selectedWilayah?.city ?? "",
      regency: selectedWilayah?.regency ?? "",
      province: selectedWilayah?.province ?? "",
      country: "indonesia",
      codepos:
        parseInt(document.getElementById("fa_kodepos").value.trim(), 10) || 0,
    };

    const saveBtn = document.getElementById("faSaveBtn");
    saveBtn.disabled = true;
    saveBtn.textContent = "⏳ Menyimpan...";

    try {
      const res = await fetch(`${URL}/api/address-create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const returnedId = json?.unique_id ?? json?.data?.unique_id ?? "";
      const wilayah = [
        selectedWilayah?.village,
        selectedWilayah?.city,
        selectedWilayah?.regency,
        selectedWilayah?.province,
      ]
        .filter(Boolean)
        .join(", ");
      const cardData = {
        ...payload,
        id: returnedId,
        nama_alamat: nama,
        wilayah,
      };

      if (onSuccess) {
        // Called from Trums modal — fill tf_alamat field
        onSuccess({ ...cardData, returned_id: returnedId });
      } else if (existingCard) {
        // Edit mode — update existing card in list
        existingCard.dataset.alamat = JSON.stringify(cardData);
        existingCard.querySelector(".alamat-card-nama").textContent =
          cardData.nama_alamat;
        existingCard.querySelector(".alamat-card-detail").textContent = [
          cardData.street,
          cardData.wilayah,
          String(cardData.codepos || ""),
        ]
          .filter(Boolean)
          .join(", ");
      } else {
        // Add mode — push new card to list
        addAlamatCard(cardData);
      }
      closeFA();
      showNotification(`✅ Alamat "${nama}" berhasil disimpan`, "success");
    } catch (err) {
      console.error(err);
      saveBtn.disabled = false;
      saveBtn.textContent = "Simpan";
      showNotification("❌ Gagal menyimpan alamat. Coba lagi.", "error");
    }
  });
}

function addAlamatCard(data) {
  const list = document.getElementById("tp_alamat_list");
  const div = document.createElement("div");
  div.className =
    "alamat-row flex items-center justify-between px-4 py-3 group hover:bg-gray-800/30 transition-colors";
  div.dataset.alamat = JSON.stringify(data);
  div.innerHTML = `
    <div class="flex items-start gap-3 flex-1 min-w-0">
      <div class="mt-0.5 text-blue-400 text-base">📍</div>
      <div class="flex-1 min-w-0">
        <p class="alamat-card-nama text-sm font-semibold text-white truncate">${data.nama_alamat}</p>
        <p class="alamat-card-detail text-xs text-gray-400 mt-0.5 truncate">
          ${[data.street, data.wilayah, data.codepos].filter(Boolean).join(", ") || "—"}
        </p>
      </div>
    </div>
    <div class="flex items-center gap-2 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
      <button type="button" class="edit-alamat-btn text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-gray-700 transition-colors">Edit</button>
      <button type="button" class="del-alamat-btn text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-gray-700 transition-colors">Hapus</button>
    </div>
  `;
  div
    .querySelector(".del-alamat-btn")
    .addEventListener("click", () => div.remove());
  div.querySelector(".edit-alamat-btn").addEventListener("click", () => {
    showFormAlamat(JSON.parse(div.dataset.alamat), div);
  });
  list.appendChild(div);
}

/* =====================================================
   TAMBAH PERUSAHAAN FORM
===================================================== */
function showTambahPerusahaanForm(prefillName = "", onSaved = null) {
  // Remove if already open
  document.getElementById("tambahPerusahaanOverlay")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "tambahPerusahaanOverlay";
  overlay.className =
    "fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4";
  overlay.style.backdropFilter = "blur(3px)";

  const inputCls =
    "w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

  overlay.innerHTML = `
    <div id="tambahPerusahaanModal"
      class="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      style="color:#e5e7eb">

      <!-- Header -->
      <div class="p-5 border-b border-gray-700 flex justify-between items-center">
        <h2 class="text-lg font-bold text-white">➕ Tambah Perusahaan / Perorangan</h2>
        <button id="tpCloseBtn" class="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
      </div>

      <!-- Form -->
      <div class="p-5 space-y-4">

        <!-- Row 1: Name + Email -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-1">
              <span class="text-red-400">*</span> Name
            </label>
            <input id="tp_name" type="text" placeholder="Nama" value="${prefillName}"
              class="${inputCls}" />
            <p id="tp_name_err" class="text-red-400 text-xs mt-1 hidden">Input your name</p>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-1">Email</label>
            <input id="tp_email" type="email" placeholder="Email" class="${inputCls}" />
          </div>
        </div>

        <!-- Row 2: Phone + NPWP -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-1">
              <span class="text-red-400">*</span> Phone
            </label>
            <input id="tp_phone" type="text" placeholder="Phone" class="${inputCls}" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-1">NPWP</label>
            <input id="tp_npwp" type="text" placeholder="NPWP" class="${inputCls}" />
          </div>
        </div>

        <!-- Row 3: Website + Title -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-1">Website</label>
            <input id="tp_website" type="text" placeholder="Website" class="${inputCls}" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-1">Title</label>
            <input id="tp_title" type="text" placeholder="Title" class="${inputCls}" />
          </div>
        </div>

        <!-- Row 4: Tipe + Ownership -->
        <div class="flex flex-wrap items-end gap-6">
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Tipe</label>
            <div class="flex gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input id="tp_tipe_personal" type="checkbox" class="w-4 h-4 accent-blue-500" />
                <span class="text-sm font-semibold text-gray-200">Personal</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input id="tp_tipe_perusahaan" type="checkbox" class="w-4 h-4 accent-blue-500" />
                <span class="text-sm font-semibold text-gray-200">Perusahaan</span>
              </label>
            </div>
          </div>
          <div class="flex items-center gap-3 mt-1">
            <label class="block text-sm font-semibold text-gray-300">Ownership?</label>
            <label class="relative inline-flex items-center cursor-pointer">
              <input id="tp_ownership" type="checkbox" class="sr-only peer" />
              <div class="w-10 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer
                peer-checked:after:translate-x-5 peer-checked:bg-blue-500
                after:content-[''] after:absolute after:top-0.5 after:left-[2px]
                after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </label>
          </div>
        </div>

        <!-- Row 5: Tags + Parent -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-1">Tags</label>
            <input id="tp_tags" type="text" placeholder="enter up to 3 tags" class="${inputCls}" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-1">Parent</label>
            <div class="relative">
              <input id="tp_parent" type="text" placeholder="Search Parent" autocomplete="off"
                class="${inputCls}" />
              <div id="tp_parent_dropdown"
                class="absolute z-50 w-full bg-gray-800 border border-gray-600 rounded-lg mt-1 shadow-xl hidden max-h-52 overflow-y-auto">
              </div>
            </div>
            <input id="tp_parent_id" type="hidden" />
          </div>
        </div>

      </div>

      <!-- Daftar PIC -->
      <div class="mx-5 mb-4 border border-gray-700 rounded-xl overflow-hidden">
        <div class="flex justify-between items-center px-4 py-3 bg-gray-800/60">
          <span class="text-sm font-semibold text-gray-200">Daftar PIC</span>
          <button id="tp_add_pic_btn" type="button"
            class="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            + Tambahkan PIC
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-700 bg-gray-800/30 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th class="px-4 py-2 text-left">Nama</th>
                <th class="px-4 py-2 text-left">Telepon</th>
                <th class="px-4 py-2 text-left">Email</th>
                <th class="px-4 py-2 text-center w-12">Aksi</th>
              </tr>
            </thead>
            <tbody id="tp_pic_body">
              <tr id="tp_pic_empty">
                <td colspan="4" class="px-4 py-5 text-center text-sm text-gray-500">No Data</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-5 pb-5 flex gap-3 justify-end border-t border-gray-700 pt-4">
        <button id="tpCancelBtn"
          class="px-5 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-colors">
          Batal
        </button>
        <button id="tpSaveBtn"
          class="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
          💾 Simpan
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // --- Autocomplete: Parent (company only) ---
  let selectedParent = null;
  setupAutocomplete({
    inputEl: document.getElementById("tp_parent"),
    dropdownEl: document.getElementById("tp_parent_dropdown"),
    hiddenEl: document.getElementById("tp_parent_id"),
    searchTable: "contacts",
    displayField: (r) => r.name ?? r.contact_name ?? JSON.stringify(r),
    subField: (r) => r.email ?? r.phone ?? r.telp ?? "",
    idField: "unique_id",
    extraPayload: {
      column: [{ is_company: true }],
    },
    onSelect: (r) => {
      selectedParent = {
        unique_id: r.unique_id ?? "",
        version: r.version ?? "",
      };
    },
  });
  document.getElementById("tp_parent").addEventListener("input", () => {
    selectedParent = null;
  });

  // --- PIC helpers ---
  const picInputCls =
    "bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400 w-full";

  function refreshPicEmpty() {
    const body = document.getElementById("tp_pic_body");
    const emptyRow = document.getElementById("tp_pic_empty");
    const dataRows = body.querySelectorAll("tr.pic-row");
    if (dataRows.length === 0) {
      if (!emptyRow) {
        const tr = document.createElement("tr");
        tr.id = "tp_pic_empty";
        tr.innerHTML = `<td colspan="4" class="px-4 py-5 text-center text-sm text-gray-500">No Data</td>`;
        body.appendChild(tr);
      }
    } else {
      emptyRow?.remove();
    }
  }

  function addPicRow(data = {}) {
    const body = document.getElementById("tp_pic_body");
    document.getElementById("tp_pic_empty")?.remove();
    const tr = document.createElement("tr");
    tr.className = "pic-row border-t border-gray-700/50 align-middle";
    tr.innerHTML = `
      <td class="px-3 py-2"><input type="text" placeholder="Nama PIC" value="${data.nama || ""}" class="${picInputCls}" data-pic="nama" /></td>
      <td class="px-3 py-2"><input type="text" placeholder="Telepon" value="${data.telepon || ""}" class="${picInputCls}" data-pic="telepon" /></td>
      <td class="px-3 py-2"><input type="email" placeholder="Email" value="${data.email || ""}" class="${picInputCls}" data-pic="email" /></td>
      <td class="px-3 py-2 text-center">
        <button type="button" class="del-pic-btn text-red-400 hover:text-red-300 text-lg leading-none transition-colors" title="Hapus">✕</button>
      </td>
    `;
    tr.querySelector(".del-pic-btn").addEventListener("click", () => {
      tr.remove();
      refreshPicEmpty();
    });
    body.appendChild(tr);
  }

  document
    .getElementById("tp_add_pic_btn")
    .addEventListener("click", () => addPicRow());

  // Auto-focus name
  setTimeout(() => {
    const nameInput = document.getElementById("tp_name");
    if (nameInput) {
      nameInput.focus();
      nameInput.select();
    }
  }, 50);

  function closeForm() {
    overlay.remove();
  }

  document.getElementById("tpCloseBtn").addEventListener("click", closeForm);
  document.getElementById("tpCancelBtn").addEventListener("click", closeForm);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeForm();
  });

  document.getElementById("tpSaveBtn").addEventListener("click", async () => {
    const name = document.getElementById("tp_name").value.trim();
    const nameErr = document.getElementById("tp_name_err");

    if (!name) {
      document
        .getElementById("tp_name")
        .classList.add("ring-2", "ring-red-500");
      nameErr.classList.remove("hidden");
      return;
    }
    nameErr.classList.add("hidden");
    document
      .getElementById("tp_name")
      .classList.remove("ring-2", "ring-red-500");

    const payload = {
      name,
      email: document.getElementById("tp_email").value.trim(),
      phone: document.getElementById("tp_phone").value.trim(),
      website: document.getElementById("tp_website").value.trim(),
      title: document.getElementById("tp_title").value.trim(),
      is_personal: document.getElementById("tp_tipe_personal").checked,
      is_company: document.getElementById("tp_tipe_perusahaan").checked,
      ownership: document.getElementById("tp_ownership").checked,
      tags: document.getElementById("tp_tags").value.trim(),
      parent_id: selectedParent?.unique_id ?? "",
      parent_version: selectedParent?.version ?? "",
      children: Array.from(document.querySelectorAll("#tp_pic_body tr.pic-row"))
        .map((tr) => ({
          name: tr.querySelector('[data-pic="nama"]')?.value.trim() ?? "",
          email: tr.querySelector('[data-pic="email"]')?.value.trim() ?? "",
          phone: tr.querySelector('[data-pic="telepon"]')?.value.trim() ?? "",
        }))
        .filter((r) => r.name || r.email || r.phone),
    };

    const saveBtn = document.getElementById("tpSaveBtn");
    saveBtn.disabled = true;
    saveBtn.textContent = "⏳ Menyimpan...";

    try {
      const res = await fetch(`${URL}/api/contact-create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const returnedId =
        json?.unique_id ?? json?.unique_id ?? json?.data?.unique_id ?? "";

      const returnedVersion = json?.version ?? json?.data?.version ?? "";

      if (onSaved) {
        onSaved({
          name,
          unique_id: returnedId,
          version: returnedVersion,
        });
      } else {
        const namaInput = document.getElementById("tf_nama");
        const namaHidden = document.getElementById("tf_nama_id");

        if (namaInput) namaInput.value = name;
        if (namaHidden) namaHidden.value = returnedId;

        // PENTING
        selectedNamaContact = {
          unique_id: returnedId,
          version: returnedVersion,
        };
      }

      closeForm();
      showNotification(`✅ "${name}" berhasil ditambahkan`, "success");
    } catch (err) {
      console.error(err);
      saveBtn.disabled = false;
      saveBtn.textContent = "💾 Simpan";
      showNotification("❌ Gagal menyimpan. Coba lagi.", "error");
    }
  });
}
const postImage = async (url, image) => {
  const formData = new FormData();
  const category = categorySelect.value || "inquiry";
  formData.append("image", image);
  formData.append("category", category);
  const response = await fetch(url, { method: "POST", body: formData });
  if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
  const data = await response.json();
  if (!data || !Array.isArray(data))
    throw new Error("Format data tidak sesuai");
  return data;
};

/* =====================================================
   CONVERT BUTTON  (processes all queued images sequentially)
===================================================== */
convertBtn.addEventListener("click", async function () {
  if (uploadedImages.length === 0) return;

  convertBtn.disabled = true;
  convertBtn.classList.add("flex", "items-center", "justify-center", "gap-2");
  btnLoader.classList.remove("hidden");
  btnLoader.classList.remove("mx-auto");
  btnText.classList.remove("hidden");
  btnText.textContent = "Memproses...";

  // Only process images not yet converted
  const pending = uploadedImages
    .map((file, i) => ({ file, i }))
    .filter(({ i }) => !convertedIndices.has(i));

  if (pending.length === 0) {
    btnText.classList.remove("hidden");
    btnLoader.classList.add("hidden");
    convertBtn.disabled = false;
    showNotification("⚠️ Semua gambar sudah dikonversi", "error");
    return;
  }

  resultsContainer.classList.remove("hidden");
  document.getElementById("resultsHeader").classList.remove("hidden");

  let totalItems = 0;
  let successCount = 0;

  const stopLoading = () => {
    const remainingPending = uploadedImages.filter(
      (_, i) => !convertedIndices.has(i),
    ).length;
    btnText.textContent =
      remainingPending > 0
        ? `Konversi ${remainingPending} Gambar Baru`
        : "Konversi ke Excel";
    btnLoader.classList.add("hidden");
    btnLoader.classList.add("mx-auto");
    convertBtn.classList.remove(
      "flex",
      "items-center",
      "justify-center",
      "gap-2",
    );
    convertBtn.disabled = false;
  };

  try {
    for (const { file, i } of pending) {
      const card = document.getElementById(`imgCard-${i}`);
      const badge = card?.querySelector(".img-status-badge");

      // Mark card as processing
      if (badge) {
        badge.textContent = "⏳ Proses...";
        badge.classList.remove("hidden", "bg-green-600", "bg-red-600");
        badge.classList.add("bg-gray-700");
      }
      if (card) {
        card.classList.remove("border-green-400", "border-red-400");
        card.classList.add("border-blue-400", "border-2");
      }

      btnText.textContent = `Memproses ${i + 1} / ${uploadedImages.length}...`;

      try {
        let data;
        try {
          data = await postImage(
            "https://wa.togu.co.id/webhook/08bbdb49-ab3d-4898-9368-304992672a49",
            file,
          );
        } catch {
          console.warn(`Primary gagal untuk gambar ${i + 1}, coba fallback...`);
          data = await postImage(
            "http://192.168.1.96:5678/webhook/08bbdb49-ab3d-4898-9368-304992672a49",
            file,
          );
        }

        if (data[0]?.error) throw new Error("Server error");

        const items = data[0]?.items ?? data;
        appendImageSection(file, items, i);
        convertedIndices.add(i);
        totalItems += items.length;
        successCount++;

        if (badge) {
          badge.textContent = `✅ ${items.length} item`;
          badge.classList.remove("bg-gray-700");
          badge.classList.add("bg-green-600");
        }
        if (card) {
          card.classList.remove("border-blue-400");
          card.classList.add("border-green-400");
        }

        const targetSection = resultsContainer.lastElementChild;
        if (targetSection)
          targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (err) {
        console.error(`Gambar ${i + 1} gagal:`, err);
        if (badge) {
          badge.textContent = "❌ Gagal";
          badge.classList.remove("bg-gray-700");
          badge.classList.add("bg-red-600");
        }
        if (card) {
          card.classList.remove("border-blue-400");
          card.classList.add("border-red-400");
        }
        const errSection = document.createElement("div");
        errSection.className =
          "mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium";
        errSection.textContent = `❌ Gambar ${i + 1} (${file.name}) gagal dikonversi`;
        resultsContainer.appendChild(errSection);
      }
    }

    if (successCount > 0) {
      showNotification(
        `✅ ${totalItems} item dari ${successCount} gambar baru berhasil`,
        "success",
      );
    } else {
      showNotification("❌ Semua gambar gagal dikonversi", "error");
    }
  } finally {
    stopLoading();
  }
});

/* =====================================================
   TRUMS BUTTON — inject into DOM
===================================================== */
/* =====================================================
   COLLECTED ITEMS BADGE + NEXT IMAGE BUTTON
===================================================== */
function updateCollectedBadge() {
  const btn = document.getElementById("trumsBtn");
  if (!btn) return;
  const count = collectedItems.length;
  btn.innerHTML =
    count > 0
      ? `🚀 Upload ke Trums <span class="ml-1 bg-white text-purple-700 text-xs font-bold rounded-full px-2 py-0.5">${count}</span>`
      : "🚀 Upload ke Trums";
}

document.addEventListener("DOMContentLoaded", () => {
  const trumsBtn = document.createElement("button");
  trumsBtn.id = "trumsBtn";
  trumsBtn.className =
    "bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm";
  trumsBtn.innerHTML = "🚀 Upload ke Trums";
  trumsBtn.addEventListener("click", showTrumsModal);
  document.getElementById("resultsHeader").appendChild(trumsBtn);
});

/* =====================================================
   START OVER
===================================================== */
startOver.addEventListener("click", function () {
  uploadedImages = [];
  imageInput.value = "";
  currentColumnKeys = [];
  collectedItems = [];
  convertedIndices = new Set();
  UploadArea.classList.remove("hidden");
  imagePreview.classList.add("hidden");
  imagePreview.innerHTML = "";
  convertBtn.classList.add("hidden");
  resultsContainer.classList.add("hidden");
  resultsContainer.innerHTML = "";
  startOver.classList.add("hidden");
  categoryWrapper.classList.add("hidden");
  document.getElementById("trumsPanelWrapper")?.remove();
  document.getElementById("resultsHeader")?.classList.add("hidden");
  updateCollectedBadge();
});

/* =====================================================
   NOTIFICATION
===================================================== */
function showNotification(message, type) {
  notification.textContent = message;
  notification.className = `my-4 p-4 rounded-lg ${type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`;
  notification.classList.remove("hidden");
  setTimeout(() => {
    notification.classList.add("hidden");
  }, 3000);
}
