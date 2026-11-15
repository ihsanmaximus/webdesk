const sectionSeed = [
  { id: "navbar", name: "Navbar", enabled: true, description: "Navigasi dan identitas brand." },
  { id: "hero", name: "Hero", enabled: true, description: "Bagian pembuka halaman." },
  { id: "benefit", name: "Benefit", enabled: true, description: "Manfaat dan keunggulan utama." },
  { id: "services", name: "Services", enabled: true, description: "Layanan atau informasi utama." },
  { id: "portfolio", name: "Portfolio", enabled: true, description: "Karya dan pengalaman." },
  { id: "testimonials", name: "Testimonials", enabled: true, description: "Ulasan dan kepercayaan." },
  { id: "faq", name: "FAQ", enabled: true, description: "Pertanyaan yang sering diajukan." },
  { id: "contact", name: "Contact / CTA", enabled: true, description: "Kontak dan ajakan bertindak." },
  { id: "footer", name: "Footer", enabled: true, description: "Informasi penutup website." }
];

const state = {
  activePage: "general",
  activeSection: "hero",
  sections: sectionSeed.map(item => ({ ...item }))
};

const meta = {
  general: ["General Setup", "WEBSITE SETTINGS", "Atur identitas dan pengaturan dasar website."],
  sections: ["Section Configurator", "SECTION MANAGEMENT", "Atur konten setiap section, status tampil, dan urutan section."],
  seo: ["SEO", "SEARCH ENGINE OPTIMIZATION", "Atur metadata halaman dan tampilan Open Graph saat tautan dibagikan."]
};

const $ = selector => document.querySelector(selector);
const title = $("#page-title");
const heading = $("#page-heading");
const eyebrow = $("#page-eyebrow");
const description = $("#page-description");
const content = $("#page-content");
const sidebar = $("#sidebar");
const backdrop = $("#sidebar-backdrop");
const navItems = [...document.querySelectorAll(".nav-item")];

function field(label, placeholder, type = "text", value = "") {
  return `<label class="field"><span>${label}</span><input type="${type}" placeholder="${placeholder}" value="${value}"></label>`;
}

function renderGeneral() {
  return `
    <div class="panel-heading"><div><h3>General Setup</h3><p>Pengaturan identitas dan karakter visual website pasangan.</p></div><span class="state-chip">Belum tersambung</span></div>
    <div class="form-grid">
      ${field("Nama Website", "Contoh: Faisal Pedriatica")}
      ${field("Nama Brand / Pemilik", "Nama brand atau pemilik website")}
      ${field("Domain Website", "https://domain.com", "url")}
      ${field("Jenis Website", "Pilih jenis website")}
      ${field("Bahasa Website", "Bahasa Indonesia")}
      ${field("Lokasi / Target Audiens", "Kota atau wilayah target")}
    </div>
    <div class="subsection"><h4>Visual Identity</h4><p>Identitas visual dasar yang digunakan oleh section website.</p>
      <div class="form-grid">
        ${field("Warna Utama", "#1D4ED8", "text", "#1D4ED8")}
        ${field("Warna Sekunder", "#0F172A", "text", "#0F172A")}
        ${field("Warna Aksen", "#38BDF8", "text", "#38BDF8")}
        ${field("Font Heading", "Nama font heading")}
        ${field("Font Body", "Nama font body")}
        ${field("Gaya Visual", "Modern / Minimal / Corporate")}
      </div>
    </div>
    <div class="form-actions"><span>Database belum dibuat. Form ini merupakan rancangan antarmuka.</span><button class="primary-button" disabled>Save General Setup</button></div>`;
}

function renderSectionFields(section) {
  if (section.id !== "navbar") return `<div class="section-fields-placeholder"><strong>Field ${section.name}</strong><p>Konfigurasi section ini belum dikerjakan. Saat ini pengerjaan dibatasi pada Navbar.</p></div>`;
  return [
    '<div class="navbar-config-form">',
    '<div class="navbar-field-group"><h4>Identitas Brand</h4><div class="form-grid">',
    '<label class="field field--full"><span>Upload Logo</span><input id="navbar-logo" type="file" accept="image/*"><small class="field-help">Pilih file logo (PNG, JPG, SVG).</small><img id="navbar-logo-preview" class="navbar-logo-preview" alt="Preview logo" hidden></label>',
    '<label class="field field--full"><span>Nama Brand</span><input id="navbar-brand" type="text" placeholder="Masukkan nama brand"></label>',
    '</div></div>',
    '<div class="navbar-field-group"><div class="navbar-group-heading"><div><h4>Menu Navigasi</h4><p>Setiap baris berisi satu label dan satu target URL.</p></div><button class="secondary-button" id="navbar-add-link" type="button">+ Add Link</button></div>',
    '<div id="navbar-menu-list" class="navbar-menu-list"><div class="navbar-menu-row"><label class="field"><span>Label Menu</span><input type="text" placeholder="Contoh: Home"></label><label class="field"><span>Target URL</span><input type="text" placeholder="#home"></label><button class="remove-menu-button" type="button" aria-label="Hapus menu" disabled>×</button></div></div></div>',
    '<div class="navbar-field-group"><h4>CTA Button</h4><div class="form-grid">',
    '<label class="field"><span>Nomor WhatsApp</span><input id="navbar-whatsapp" type="tel" inputmode="tel" placeholder="628123456789"></label>',
    '<label class="field"><span>Label CTA</span><input id="navbar-cta-label" type="text" placeholder="Contoh: Hubungi Kami"></label>',
    '</div></div></div>'
  ].join("");
}
function renderSections() {
  const rows = state.sections.map(section => {
    const opened = state.activeSection === section.id;
    return `
      <article class="accordion-item ${opened ? "is-open" : ""} ${section.enabled ? "" : "is-disabled"}" data-section-id="${section.id}">
        <div class="accordion-heading">
          <span class="drag-handle" title="Geser untuk mengubah urutan" aria-label="Geser section">⠿</span>
          <button class="accordion-trigger" type="button" data-accordion-toggle="${section.id}" aria-expanded="${opened}">
            <strong>${section.name}</strong><span class="accordion-chevron">${opened ? "−" : "+"}</span>
          </button>
          <label class="accordion-visibility"><input type="checkbox" data-toggle-section="${section.id}" ${section.enabled ? "checked" : ""}><span class="visibility-check"></span><small>Tampilkan</small></label>
        </div>
        ${opened ? `
          <div class="accordion-body">
            <p class="accordion-description">${section.description}</p>
            ${renderSectionFields(section)}
          </div>` : ""}
      </article>`;
  }).join("");

  return `
    <div class="panel-heading"><div><h3>Konten Website</h3><p>Atur section yang ditampilkan dan urutannya. Buka setiap section untuk melihat konfigurasi field.</p></div><span class="state-chip">Draft</span></div>
    <div class="section-accordion-intro"><strong>Struktur Konten</strong><span>${state.sections.length} section</span><small>Centang untuk menampilkan. Gunakan ikon titik untuk drag and drop.</small></div>
    <div class="section-accordion" id="section-list">${rows}</div>
    <div class="form-actions section-form-actions"><span>Database belum dibuat. Save Draft dan Publish akan diaktifkan setelah backend siap.</span><div class="button-group"><button class="secondary-button" disabled>Save Draft</button><button class="primary-button" disabled>Publish</button></div></div>`;
}

function renderSeo() {
  return `
    <div class="panel-heading"><div><h3>SEO & Open Graph</h3><p>Metadata untuk mesin pencari dan tampilan saat URL dibagikan.</p></div><span class="state-chip">Belum tersambung</span></div>
    <div class="subsection"><h4>Search Engine Metadata</h4><div class="form-grid">
      ${field("Meta Title", "Judul halaman untuk hasil pencarian")}
      ${field("Canonical URL", "https://domain.com/", "url")}
      <label class="field field--full"><span>Meta Description</span><textarea rows="3" placeholder="Ringkasan halaman untuk hasil pencarian"></textarea></label>
      ${field("Robots", "index, follow")}
    </div></div>
    <div class="subsection"><h4>Open Graph</h4><div class="form-grid">
      ${field("OG Title", "Judul ketika link dibagikan")}
      ${field("OG Type", "website")}
      <label class="field field--full"><span>OG Description</span><textarea rows="3" placeholder="Deskripsi untuk preview media sosial"></textarea></label>
      ${field("OG Image URL", "https://domain.com/og-image.jpg", "url")}
      ${field("OG URL", "https://domain.com/", "url")}
    </div><div class="og-preview"><div class="og-image-placeholder">OG IMAGE</div><div><small>DOMAIN.COM</small><strong>Open Graph title preview</strong><p>Deskripsi tautan akan tampil di sini.</p></div></div></div>
    <div class="form-actions"><span>Database belum dibuat. Metadata belum disimpan.</span><button class="primary-button" disabled>Save SEO</button></div>`;
}

function render() {
  const [pageTitle, pageEyebrow, pageDescription] = meta[state.activePage];
  title.textContent = pageTitle;
  heading.textContent = pageTitle;
  eyebrow.textContent = pageEyebrow;
  description.textContent = pageDescription;
  navItems.forEach(item => item.classList.toggle("is-active", item.dataset.page === state.activePage));
  content.innerHTML = state.activePage === "general" ? renderGeneral() : state.activePage === "sections" ? renderSections() : renderSeo();
  bindInteractions();
}

function bindInteractions() {
  document.querySelectorAll("[data-accordion-toggle]").forEach(button => {
    button.addEventListener("click", () => {
      state.activeSection = state.activeSection === button.dataset.accordionToggle ? "" : button.dataset.accordionToggle;
      render();
    });
  });

  document.querySelectorAll("[data-toggle-section]").forEach(input => {
    input.addEventListener("change", () => {
      const section = state.sections.find(item => item.id === input.dataset.toggleSection);
      if (section) section.enabled = input.checked;
      render();
    });
  });

  const addMenu = $("#navbar-add-link");
  if (addMenu) addMenu.addEventListener("click", () => {
    const list = $("#navbar-menu-list");
    const row = document.createElement("div");
    row.className = "navbar-menu-row";
    row.innerHTML = '<label class="field"><span>Label Menu</span><input type="text" placeholder="Contoh: Tentang Kami"></label><label class="field"><span>Target URL</span><input type="text" placeholder="#about"></label><button class="remove-menu-button" type="button" aria-label="Hapus menu">×</button>';
    list.appendChild(row);
    row.querySelector(".remove-menu-button").addEventListener("click", () => row.remove());
  });
  document.querySelectorAll(".remove-menu-button:not(:disabled)").forEach(button => button.addEventListener("click", () => button.closest(".navbar-menu-row")?.remove()));
  const logoInput = $("#navbar-logo");
  if (logoInput) logoInput.addEventListener("change", () => {
    const file = logoInput.files?.[0];
    const preview = $("#navbar-logo-preview");
    if (!file || !preview) return;
    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
  });

  // Pointer-based sorting supports touch screens as well as mouse input.
  const list = $("#section-list");
  if (list) {
    let draggedId = null;
    let draggedElement = null;
    let startY = 0;
    list.querySelectorAll(".drag-handle").forEach(handle => {
      handle.addEventListener("pointerdown", event => {
        const row = handle.closest(".accordion-item");
        if (!row) return;
        draggedId = row.dataset.sectionId;
        draggedElement = row;
        startY = event.clientY;
        row.classList.add("is-dragging");
        handle.setPointerCapture?.(event.pointerId);
        event.preventDefault();
      });
      handle.addEventListener("pointermove", event => {
        if (!draggedElement || !draggedId) return;
        const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".accordion-item");
        if (!target || target === draggedElement || !list.contains(target)) return;
        const rect = target.getBoundingClientRect();
        const after = event.clientY > rect.top + rect.height / 2;
        list.insertBefore(draggedElement, after ? target.nextSibling : target);
        startY = event.clientY;
      });
      const finish = () => {
        if (!draggedElement) return;
        draggedElement.classList.remove("is-dragging");
        const order = [...list.querySelectorAll(".accordion-item")].map(el => el.dataset.sectionId);
        state.sections.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
        draggedId = null;
        draggedElement = null;
        render();
      };
      handle.addEventListener("pointerup", finish);
      handle.addEventListener("pointercancel", finish);
    });
  }
}

navItems.forEach(item => item.addEventListener("click", () => {
  state.activePage = item.dataset.page;
  sidebar.classList.remove("is-open");
  backdrop.classList.remove("is-visible");
  render();
}));

$("#sidebar-open").addEventListener("click", () => { sidebar.classList.add("is-open"); backdrop.classList.add("is-visible"); });
$("#sidebar-close").addEventListener("click", () => { sidebar.classList.remove("is-open"); backdrop.classList.remove("is-visible"); });
backdrop.addEventListener("click", () => { sidebar.classList.remove("is-open"); backdrop.classList.remove("is-visible"); });

render();