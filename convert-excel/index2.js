// Sample data (replace this with actual API call)
const sampleData = [
  { item_pekerjaan: "1. Persiapan", type: "category" },
  {
    item_pekerjaan: "Pembersihan Lahan",
    volume: "50 m²",
    harga_satuan_rp: 20000,
    total_rp: 1000000,
    type: "detail",
  },
  {
    item_pekerjaan: "Pengukuran dan Layout",
    volume: "1 LS",
    harga_satuan_rp: 500000,
    total_rp: 700000,
    type: "detail",
  },
  {
    item_pekerjaan: "Subtotal Persiapan",
    total_rp: 1700000,
    type: "subtotal",
  },
  { item_pekerjaan: "2. Pekerjaan Struktur", type: "category" },
  {
    item_pekerjaan: "Galian Pondasi",
    volume: "10 m³",
    harga_satuan_rp: 100000,
    total_rp: 1000000,
    type: "detail",
  },
  {
    item_pekerjaan: "Pemasangan Batu Pondasi",
    volume: "8 m³",
    harga_satuan_rp: 750000,
    total_rp: 6000000,
    type: "detail",
  },
  {
    item_pekerjaan: "Cor Beton Sloof",
    volume: "2 m³",
    harga_satuan_rp: 1000000,
    total_rp: 2000000,
    type: "detail",
  },
  {
    item_pekerjaan: "Kolom Beton",
    volume: "3 m³",
    harga_satuan_rp: 1200000,
    total_rp: 3600000,
    type: "detail",
  },
  {
    item_pekerjaan: "Subtotal Struktur",
    total_rp: 12600000,
    type: "subtotal",
  },
  { item_pekerjaan: "3. Pekerjaan Dinding", type: "category" },
  {
    item_pekerjaan: "Pasang Bata",
    volume: "100 m²",
    harga_satuan_rp: 120000,
    total_rp: 12000000,
    type: "detail",
  },
  {
    item_pekerjaan: "Plesteran dan Acian",
    volume: "100 m²",
    harga_satuan_rp: 80000,
    total_rp: 8000000,
    type: "detail",
  },
  {
    item_pekerjaan: "Subtotal Dinding",
    total_rp: 20000000,
    type: "subtotal",
  },
  { item_pekerjaan: "4. Pekerjaan Atap", type: "category" },
  {
    item_pekerjaan: "Rangka Atap Baja Ringan",
    volume: "50 m²",
    harga_satuan_rp: 250000,
    total_rp: 12500000,
    type: "detail",
  },
  {
    item_pekerjaan: "Penutup Atap Genteng",
    volume: "50 m²",
    harga_satuan_rp: 150000,
    total_rp: 7500000,
    type: "detail",
  },
  {
    item_pekerjaan: "Subtotal Atap",
    total_rp: 20000000,
    type: "subtotal",
  },
  { item_pekerjaan: "5. Finishing", type: "category" },
  {
    item_pekerjaan: "Pengecatan Dinding",
    volume: "100 m²",
    harga_satuan_rp: 50000,
    total_rp: 5500000,
    type: "detail",
  },
  {
    item_pekerjaan: "Keramik Lantai",
    volume: "50 m²",
    harga_satuan_rp: 150000,
    total_rp: 7500000,
    type: "detail",
  },
  {
    item_pekerjaan: "Subtotal Finishing",
    total_rp: 13000000,
    type: "subtotal",
  },
  {
    item_pekerjaan: "Total Keseluruhan",
    total_rp: 67300000,
    type: "grand_total",
  },
];

const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const previewImg = document.getElementById("previewImg");
const convertBtn = document.getElementById("convertBtn");
const resultsContainer = document.getElementById("resultsContainer");
const tableBody = document.getElementById("tableBody");
const copyBtn = document.getElementById("copyBtn");
const notification = document.getElementById("notification");
const btnText = document.getElementById("btnText");
const btnLoader = document.getElementById("btnLoader");
const UploadArea = document.getElementById("uploadArea");
const startOver = document.getElementById("startOver");
const categoryWrapper = document.getElementById("categoryWrapper");
const categorySelect = document.getElementById("categorySelect");

let uploadedImage = null;

/* =====================================================
   UNIVERSAL FILE HANDLER (UPLOAD / PASTE / DRAG)
===================================================== */
function handleFile(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("File harus berupa gambar!");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    alert("Ukuran file terlalu besar. Maksimal 10MB");
    return;
  }

  uploadedImage = file;

  const reader = new FileReader();
  reader.onload = function (e) {
    previewImg.src = e.target.result;
    imagePreview.classList.remove("hidden");
    convertBtn.classList.remove("hidden");
    resultsContainer.classList.add("hidden");
    UploadArea.classList.add("hidden");
    startOver.classList.remove("hidden");
    // categoryWrapper.classList.remove("hidden"); // tampilkan category
  };
  reader.readAsDataURL(file);
}

/* =====================================================
   SET FILE TO INPUT (AGAR BISA DIKIRIM VIA FORM DATA)
===================================================== */
function setFileToInput(file) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  imageInput.files = dataTransfer.files;
}

/* =====================================================
   FILE INPUT CHANGE
===================================================== */
imageInput.addEventListener("change", function (e) {
  handleFile(e.target.files[0]);
});

/* =====================================================
   HANDLE PASTE (CTRL + V SCREENSHOT)
===================================================== */
document.addEventListener("paste", function (event) {
  const items = event.clipboardData?.items;
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      const file = items[i].getAsFile();
      setFileToInput(file);
      handleFile(file);
    }
  }
});

/* =====================================================
   DRAG & DROP
===================================================== */
UploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  UploadArea.classList.add("border-blue-500");
});

UploadArea.addEventListener("dragleave", () => {
  UploadArea.classList.remove("border-blue-500");
});

UploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  UploadArea.classList.remove("border-blue-500");

  const file = e.dataTransfer.files[0];
  if (file) {
    setFileToInput(file);
    handleFile(file);
  }
});

/* =====================================================
   FORMAT UTILITIES
===================================================== */
function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID").format(amount);
}

function isNumeric(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

function formatCellValue(key, value) {
  if (value === null || value === undefined) return "";

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

  const isCurrency = currencyKeywords.some((keyword) =>
    key.toLowerCase().includes(keyword),
  );

  if (isCurrency && isNumeric(value)) {
    return formatCurrency(value);
  }

  return value;
}

function getAllKeys(data) {
  const keysSet = new Set();
  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (key !== "type") {
        keysSet.add(key);
      }
    });
  });
  return Array.from(keysSet);
}

function createTableHeader(keys) {
  const thead = document.querySelector("#dataTable thead");
  thead.innerHTML = "";

  const headerRow = document.createElement("tr");
  headerRow.className = "bg-gray-100";

  keys.forEach((key) => {
    const th = document.createElement("th");
    th.className =
      "border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700";

    const headerText = key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    th.textContent = headerText;

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

    if (
      currencyKeywords.some((keyword) => key.toLowerCase().includes(keyword))
    ) {
      th.classList.add("text-right");
    }

    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
}

function populateTable(data) {
  if (!data || data.length === 0) {
    resultsContainer.classList.add("hidden");
    showNotification("❌ Tidak ada data untuk ditampilkan", "error");
    return;
  }

  const allKeys = getAllKeys(data);
  createTableHeader(allKeys);
  tableBody.innerHTML = "";

  data.forEach((item) => {
    const row = document.createElement("tr");
    const rowType = item.type || "detail";

    if (rowType === "category") row.className = "category-row";
    else if (rowType === "subtotal") row.className = "subtotal-row";
    else if (rowType === "grand_total") row.className = "grand-total-row";
    else row.className = "detail-row";

    allKeys.forEach((key) => {
      const td = document.createElement("td");

      console.log(key);

      td.className = "border border-gray-300 px-4 py-2";
      td.style.whiteSpace = "normal"; // 🔥 override nowrap
      td.style.wordBreak = "break-word"; // 🔥 biar panjang tetap wrap
      td.style.verticalAlign = "top";

      let value = item[key];

      if (value === null || value === undefined) {
        value = "-";
      }

      // 🔥 STRING YANG ADA \n
      else if (typeof value === "string" && value.includes("\n")) {
        value = value.replace(/\n/g, "<br>");
      }

      // ARRAY
      else if (Array.isArray(value)) {
        value = value
          .map((v) => {
            if (typeof v === "object" && v !== null) {
              return Object.entries(v)
                .map(([k, val]) => `${k}: ${val}`)
                .join(", ");
            }
            return v;
          })
          .join("<br>");
      }

      // OBJECT
      else if (typeof value === "object") {
        value = Object.entries(value)
          .map(([k, v]) => `${k}: ${v}`)
          .join("<br>");
      }

      td.innerHTML = value;

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

      if (
        currencyKeywords.some((keyword) => key.toLowerCase().includes(keyword))
      ) {
        td.classList.add("text-right");
      }

      row.appendChild(td);
    });

    tableBody.appendChild(row);
  });

  resultsContainer.classList.remove("hidden");
}

/* =====================================================
   POST IMAGE
===================================================== */
const postImage = async (url, image) => {
  const formData = new FormData();
  const category = categorySelect.value || "inquiry";

  formData.append("image", image);
  formData.append("category", category);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}`);
  }

  const data = await response.json();

  if (!data || !Array.isArray(data)) {
    throw new Error("Format data tidak sesuai");
  }

  return data;
};

/* =====================================================
   CONVERT BUTTON
===================================================== */
convertBtn.addEventListener("click", async function () {
  if (!uploadedImage) return;

  btnText.classList.add("hidden");
  btnLoader.classList.remove("hidden");
  convertBtn.disabled = true;
  resultsContainer.classList.add("hidden");

  try {
    let data;

    try {
      data = await postImage(
        "https://wa.togu.co.id/webhook/f212c24e-b0c5-4a9d-afd3-72228fb3eb97",
        uploadedImage,
      );
    } catch (primaryError) {
      console.warn("Primary gagal, coba fallback...");
      data = await postImage(
        "http://192.168.1.96:5678/webhook/f212c24e-b0c5-4a9d-afd3-72228fb3eb97",
        uploadedImage,
      );
    }

    if (data[0]?.error) {
      alert("Server error");
      return;
    }

    // data  =

    const final = data[0]?.items ?? data;

    populateTable(final);

    resultsContainer.classList.remove("hidden");
    resultsContainer.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error(error);
    alert("Server sedang bermasalah, silakan coba lagi.");
  } finally {
    btnText.classList.remove("hidden");
    btnLoader.classList.add("hidden");
    convertBtn.disabled = false;
  }
});

/* =====================================================
   COPY TABLE
===================================================== */
copyBtn.addEventListener("click", function () {
  const table = document.getElementById("dataTable");
  const range = document.createRange();
  range.selectNode(table);

  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);

  try {
    document.execCommand("copy");
    showNotification(
      "✅ Tabel berhasil di-copy! Paste ke Excel dengan Ctrl+V",
      "success",
    );
  } catch {
    showNotification("❌ Gagal menyalin tabel", "error");
  }

  window.getSelection().removeAllRanges();
});

/* =====================================================
   START OVER (RESET)
===================================================== */
startOver.addEventListener("click", function () {
  uploadedImage = null;
  imageInput.value = "";
  previewImg.src = "";

  UploadArea.classList.remove("hidden");
  imagePreview.classList.add("hidden");
  convertBtn.classList.add("hidden");
  resultsContainer.classList.add("hidden");
  startOver.classList.add("hidden");
  categoryWrapper.classList.add("hidden"); // tampilkan category
});

/* =====================================================
   NOTIFICATION
===================================================== */
function showNotification(message, type) {
  notification.textContent = message;
  notification.className = `my-4 p-4 rounded-lg ${
    type === "success"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800"
  }`;
  notification.classList.remove("hidden");

  setTimeout(() => {
    notification.classList.add("hidden");
  }, 3000);
}
