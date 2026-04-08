let latestMarkdown = "";
let latestTitle = "";
let latestThumbnail = "";
let lastUsedPrompt = "";

const UPLOAD_API_URL = "https://migrationbe.trumecs.com/api/article/create";
// const IMAGE_GEN_API_URL = "https://files.togu.co.id/api/generate-image";

// const UPLOAD_API_URL = "http://192.168.1.96:5001/api/article/create";
const IMAGE_GEN_API_URL = "http://192.168.1.238:9009/api/generate-image";

// ==================== AUTO RESIZE TITLE ====================
function autoResizeTitle(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

// ==================== TOOLBAR ====================
function execCmd(cmd) {
  document.getElementById("wysiwyg-editor").focus();
  document.execCommand(cmd, false, null);
  updateToolbarState();
}

function execFormat(tag) {
  document.getElementById("wysiwyg-editor").focus();
  document.execCommand("formatBlock", false, "<" + tag + ">");
  updateToolbarState();
}

function insertLink() {
  const url = prompt("Masukkan URL:");
  if (url) {
    document.getElementById("wysiwyg-editor").focus();
    document.execCommand("createLink", false, url);
  }
}

function updateToolbarState() {
  ["bold", "italic", "underline", "strikeThrough"].forEach((cmd) => {
    const btn = document.getElementById("btn-" + cmd);
    if (btn) btn.classList.toggle("active", document.queryCommandState(cmd));
  });
  try {
    const block = document
      .queryCommandValue("formatBlock")
      .toLowerCase()
      .replace(/[<>]/g, "");
    const sel = document.getElementById("formatBlock");
    const match = [...sel.options].find((o) => o.value === block);
    if (match) sel.value = match.value;
  } catch (e) {}
}

document.addEventListener("selectionchange", updateToolbarState);

// ==================== WORD COUNT ====================
function updateWordCount() {
  const text = document.getElementById("wysiwyg-editor").innerText || "";
  const words = text.trim()
    ? text
        .trim()
        .split(/\s+/)
        .filter((w) => w).length
    : 0;
  const badge = document.getElementById("wordCountBadge");
  badge.textContent = `${words.toLocaleString("id-ID")} kata`;
  badge.classList.remove("hidden");
}

// ==================== SET EDITOR CONTENT ====================
function setEditorContent(html, title) {
  // Strip h1 from body content (title is now in its own input)
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const h1 = doc.querySelector("h1");
  const extractedTitle = h1 ? h1.textContent.trim() : title || "";
  if (h1) h1.remove();
  const bodyWithoutTitle = doc.body.innerHTML.trim();

  const titleEl = document.getElementById("articleTitleInput");
  titleEl.value = extractedTitle;
  autoResizeTitle(titleEl);
  document.getElementById("wysiwyg-editor").innerHTML = bodyWithoutTitle;
  document.getElementById("editorPlaceholder").classList.add("hidden");
  document.getElementById("wysiwyg-wrapper").classList.remove("hidden");
  document.getElementById("editorStatusBadge").classList.remove("hidden");
  updateWordCount();
}

function getEditorTitle() {
  return document.getElementById("articleTitleInput").value.trim();
}

function getEditorHTML() {
  return document.getElementById("wysiwyg-editor").innerHTML;
}

// ==================== TOAST ====================
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 ${type === "success" ? "bg-green-600" : "bg-red-600"}`;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 4000);
}

// ==================== THUMBNAIL ====================
function setThumbnailPreview(url) {
  document.getElementById("thumbnailPreviewImg").src = url;
  document.getElementById("thumbnailPreviewImg").classList.remove("hidden");
  document.getElementById("thumbnailSkeleton").classList.add("hidden");
  document.getElementById("thumbnailPreviewWrapper").classList.remove("hidden");
  latestThumbnail = url;
}

// ==================== LIGHTBOX ====================
function openLightbox(src) {
  document.getElementById("lightboxImg").src = src;
  document.getElementById("lightboxDownload").href = src;
  document.getElementById("lightboxModal").classList.add("open");
  document.body.style.overflow = "hidden";
  setTimeout(() => document.getElementById("lightboxClose").focus(), 50);
}
function closeLightbox() {
  document.getElementById("lightboxModal").classList.remove("open");
  document.body.style.overflow = "";
  setTimeout(() => {
    document.getElementById("lightboxImg").src = "";
  }, 300);
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

// ==================== GENERATE ====================
async function sendToN8n() {
  const topic = document.getElementById("topicInput").value.trim();
  const keyword = document.getElementById("keywordInput").value.trim();
  const wordCount = document.getElementById("wordCountInput").value || 800;
  let notes = document.getElementById("notesInput").value.trim();
  const thumbnailPrompt = document
    .getElementById("thumbnailPromptInput")
    .value.trim();

  if (!topic) {
    alert("Topik wajib diisi");
    return;
  }
  if (!keyword) {
    alert("Keyword wajib diisi");
    return;
  }
  if (!notes) notes = "Tidak ada";
  lastUsedPrompt = thumbnailPrompt;

  const btn = document.getElementById("generateBtn");
  btn.disabled = true;
  btn.textContent = "⏳ Sedang generate...";

  latestMarkdown = "";
  latestTitle = "";
  latestThumbnail = "";
  document.getElementById("thumbnailPreviewWrapper").classList.add("hidden");
  document.getElementById("copyButtons").classList.add("hidden");
  document.getElementById("wysiwyg-wrapper").classList.add("hidden");
  document.getElementById("editorStatusBadge").classList.add("hidden");
  document.getElementById("wordCountBadge").classList.add("hidden");
  document.getElementById("regenPromptInput").value = "";
  const titleResetEl = document.getElementById("articleTitleInput");
  titleResetEl.value = "";
  autoResizeTitle(titleResetEl);

  const ph = document.getElementById("editorPlaceholder");
  ph.classList.remove("hidden");
  ph.innerHTML = `<div class="text-4xl mb-3 animate-spin">⚙️</div><p class="text-sm">Sedang generate artikel, mohon tunggu…</p>`;

  const formData = new FormData();
  formData.append("topic", topic);
  formData.append("keyword", keyword);
  formData.append("word_count", Number(wordCount));
  formData.append("additional_notes", notes);
  if (thumbnailPrompt) formData.append("thumbnail_prompt", thumbnailPrompt);

  try {
    const primaryUrl =
      "https://wa.togu.co.id/webhook/bc01e8c1-2f72-4498-8fa3-53d7f6407a32";
    const fallbackUrl =
      "http://192.168.1.96:5678/webhook-test/bc01e8c1-2f72-4498-8fa3-53d7f6407a32";
    let res;
    try {
      res = await fetch(primaryUrl, { method: "POST", body: formData });
      if (!res.ok) throw new Error();
    } catch {
      res = await fetch(fallbackUrl, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Fallback juga gagal");
    }

    const response = await res.json();
    const data = response[0];
    latestMarkdown = data.content;
    latestTitle = data.title || topic;
    latestThumbnail = data.thumbnail || "";

    const renderedHTML = marked.parse(data.content);
    setEditorContent(renderedHTML, latestTitle);

    document.getElementById("copyButtons").classList.remove("hidden");
    if (data.thumbnail) setThumbnailPreview(data.thumbnail);
    document
      .getElementById("wysiwyg-wrapper")
      .scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    ph.classList.remove("hidden");
    ph.innerHTML = `<div class="text-4xl mb-3">❌</div><p class="text-sm text-red-500">Server error. Pastikan n8n aktif dan endpoint benar.</p>`;
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = "🚀 Generate & Kirim ke n8n";
  }
}

// ==================== REGEN THUMBNAIL ====================
async function regenerateThumbnail() {
  const regenPrompt = document.getElementById("regenPromptInput").value.trim();
  const prompt = regenPrompt || lastUsedPrompt;
  if (!prompt) {
    showToast("❌ Masukkan prompt untuk generate thumbnail.", "error");
    return;
  }

  const regenBtn = document.getElementById("regenThumbBtn");
  const regenSubmitBtn = document.getElementById("regenSubmitBtn");
  regenBtn.disabled = regenSubmitBtn.disabled = true;
  regenBtn.textContent = regenSubmitBtn.textContent = "⏳ Generating...";
  document.getElementById("thumbnailPreviewImg").classList.add("hidden");
  document.getElementById("thumbnailSkeleton").classList.remove("hidden");

  const old_file_name = latestThumbnail.split("/").pop().split("?")[0];

  try {
    const res = await fetch(IMAGE_GEN_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, old_file_name }),
    });
    if (!res.ok) throw new Error(`Server ${res.status}`);
    const response = await res.json();
    if (!response.data?.url) throw new Error("URL gambar tidak ditemukan.");
    if (regenPrompt) lastUsedPrompt = regenPrompt;
    setThumbnailPreview(response.data.url);
    showToast("✅ Thumbnail berhasil di-generate ulang!");
  } catch (err) {
    showToast("❌ Gagal generate thumbnail: " + err.message, "error");
    document.getElementById("thumbnailPreviewImg").classList.remove("hidden");
    document.getElementById("thumbnailSkeleton").classList.add("hidden");
  } finally {
    regenBtn.disabled = regenSubmitBtn.disabled = false;
    regenBtn.textContent = "🔄 Generate Ulang";
    regenSubmitBtn.textContent = "🔄 Generate";
  }
}

// ==================== UPLOAD ====================
async function uploadArtikel() {
  const editorHTML = getEditorHTML();
  if (!editorHTML || editorHTML === "<br>") {
    showToast("❌ Belum ada artikel.", "error");
    return;
  }

  // Title from the dedicated input (editable by user)
  const title = getEditorTitle() || latestTitle;
  if (!title) {
    showToast("❌ Judul artikel wajib diisi.", "error");
    document.getElementById("articleTitleInput").focus();
    return;
  }

  const seoDescription = document
    .getElementById("seoDescriptionInput")
    .value.trim();
  const seoKey = document.getElementById("keywordInput").value.trim();
  if (!seoDescription) {
    showToast("❌ Deskripsi SEO wajib diisi sebelum upload.", "error");
    return;
  }

  const uploadBtn = document.getElementById("uploadBtn");
  uploadBtn.disabled = true;
  uploadBtn.textContent = "⏳ Mengupload...";

  const payload = {
    title,
    value: editorHTML,
    img: latestThumbnail,
    discription_seo: seoDescription,
    seo_key: seoKey,
  };

  try {
    const res = await fetch(UPLOAD_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Server ${res.status}`);
    showToast("✅ Artikel berhasil diupload!");
  } catch (err) {
    showToast("❌ Gagal upload: server error", "error");
    console.error(err);
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = "☁️ Upload Artikel";
  }
}

// ==================== COPY ====================
function copyMarkdown() {
  navigator.clipboard.writeText(latestMarkdown);
  showToast("✅ Markdown berhasil dicopy!");
}
