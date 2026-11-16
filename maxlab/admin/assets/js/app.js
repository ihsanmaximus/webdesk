const sectionSeed = [
  { id: "navbar", name: "Navbar", enabled: true, description: "Navigasi dan identitas brand." },
  { id: "hero", name: "Hero", enabled: true, description: "Bagian pembuka halaman." },
  { id: "about", name: "About", enabled: true, description: "Profil singkat dan tautan ke halaman profil lengkap." },
  { id: "experience", name: "Experience", enabled: true, description: "Pendidikan, pekerjaan, dan pengalaman profesional." },
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
let navbarFormCache = null;
let navbarDataLoaded = false;
let heroConfigCache = null;
let heroConfigLoaded = false;
let aboutConfigCache = null;
let aboutConfigLoaded = false;
const aboutDefaults = { sectionName:"", title:"", description:"", readMoreLabel:"", profileTitle:"", profileContent:"", imageUrl:"" };
const heroDefaults = { version:1, layout:"background-image", eyebrow:"", headline:"", subheadline:"", primaryCtaEnabled:true, primaryCtaLabel:"", primaryCtaTarget:"", secondaryCtaEnabled:false, secondaryCtaLabel:"", secondaryCtaTarget:"", imageUrl:"", imageAlt:"", gradientEnabled:true };
function escAttr(value) { return String(value ?? "").replace(/[&<>"\']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","\'":"&#39;"}[ch])); }
function sanitizeHeroPlaceholders(config) {
 const c={...config};
 const stale={headline:["Bangun Sesuatu yang Luar Biasa"],subheadline:["Perkenalkan bisnis Anda dengan pesan yang jelas, menarik, dan mudah diingat."],primaryCtaLabel:["Hubungi Kami"],primaryCtaTarget:["#contact"],secondaryCtaLabel:["Pelajari Lebih Lanjut"],secondaryCtaTarget:["#about"],imageAlt:["Background Hero"]};
 Object.entries(stale).forEach(([key,values])=>{if(values.includes(String(c[key]??"")))c[key]="";});
 return c;
}
function heroValue(key) { return escAttr((heroConfigCache || heroDefaults)[key]); }
function heroInput(label,key,type="text",hint="") { return `<label class="field"><span>${label}</span><input data-hero-field="${key}" type="${type}" value="${heroValue(key)}">${hint?`<small class="field-help">${hint}</small>`:""}</label>`; }
function heroSelect(label,key,options) { return `<label class="field"><span>${label}</span><select data-hero-field="${key}">${options.map(([v,t])=>`<option value="${v}" ${heroValue(key)===v?"selected":""}>${t}</option>`).join("")}</select></label>`; }
function heroCheck(label,key) { return `<label class="hero-check"><input data-hero-field="${key}" type="checkbox" ${(heroConfigCache||heroDefaults)[key]?"checked":""}> ${label}</label>`; }
function renderHeroFields() {
 return `<div class="hero-config-form">
 <div class="navbar-field-group"><h4>Konten Hero</h4><div class="form-grid">
 ${heroInput("Eyebrow","eyebrow")}
 ${heroInput("Headline","headline")}
 <label class="field field--full"><span>Subheadline</span><textarea data-hero-field="subheadline" rows="3">${heroValue("subheadline")}</textarea></label>
 </div></div>
 <div class="navbar-field-group"><h4>Background</h4><div class="form-grid">
 <label class="field field--full"><span>Upload Background</span><input id="hero-background-file" type="file" accept="image/jpeg,image/png,image/webp"><small class="field-help">Format JPG, PNG, WebP. Maksimal 3 MB.</small><div id="hero-upload-status" class="field-help"></div><img id="hero-background-preview" alt="Preview background Hero" style="display:none;max-width:100%;max-height:180px;object-fit:cover;border-radius:10px"></label>
 </div></div>
 <div class="navbar-field-group"><h4>CTA</h4>
 ${heroCheck("Tampilkan CTA 1","primaryCtaEnabled")}
 <div class="form-grid">${heroInput("Label CTA 1","primaryCtaLabel")}${heroInput("Tujuan CTA 1","primaryCtaTarget")}</div>
 ${heroCheck("Tampilkan CTA 2","secondaryCtaEnabled")}
 <div class="form-grid">${heroInput("Label CTA 2","secondaryCtaLabel")}${heroInput("Tujuan CTA 2","secondaryCtaTarget")}</div>
 </div>
 <div class="navbar-field-group"><h4>Gradasi</h4>${heroCheck("Aktifkan gradasi","gradientEnabled")}<p class="field-help">Desktop: gradasi dari kanan ke kiri. Mobile: gradasi dari atas ke bawah.</p></div>
 </div>`;
}
function heroPreviewMarkup(c) { const bg=c.layout==="background-image"?`background-image:${c.imageUrl?`url(&quot;${escAttr(c.imageUrl)}&quot;)`:"none"};background-size:cover;background-position:center;`:""; const h=c.height==="compact"?"360px":c.height==="medium"?"480px":"600px"; return `<div class="hero-preview-inner" style="min-height:${h};background-color:${escAttr(c.backgroundColor)};${bg}color:${escAttr(c.textColor)};text-align:${escAttr(c.alignment)}"><div class="hero-preview-copy">${c.eyebrow?`<small style="color:${escAttr(c.eyebrowColor)}">${escAttr(c.eyebrow)}</small>`:""}<h2 style="color:${escAttr(c.headlineColor)}">${escAttr(c.headline)}</h2><p style="color:${escAttr(c.descriptionColor)}">${escAttr(c.subheadline)}</p><div>${c.primaryCtaEnabled?`<span style="background:${escAttr(c.accentColor)}">${escAttr(c.primaryCtaLabel)}</span>`:""}${c.secondaryCtaEnabled?`<span class="secondary">${escAttr(c.secondaryCtaLabel)}</span>`:""}</div></div>${c.layout!=="text-only"&&c.layout!=="background-image"&&c.imageUrl?`<img src="${escAttr(c.imageUrl)}" alt="${escAttr(c.imageAlt)}">`:""}</div>`; }
async function loadHeroConfig() { if(heroConfigLoaded)return; try { const r=await fetch("/api/maxlab/hero",{cache:"no-store"}); const d=await r.json(); if(!r.ok)throw new Error(d.error||"Gagal memuat Hero"); const local=localStorage.getItem("maxlab:maxlabtest:hero:draft"); heroConfigCache=sanitizeHeroPlaceholders({...heroDefaults,...(local?JSON.parse(local):(d.config||{}))}); heroConfigLoaded=true; if(state.activePage==="sections"&&state.activeSection==="hero")render(); } catch(e) { const s=$("#hero-save-status"); if(s)s.textContent=e.message; } }
function collectHeroForm() { const c={...(heroConfigCache||heroDefaults)}; document.querySelectorAll("[data-hero-field]").forEach(el=>{const k=el.dataset.heroField;c[k]=el.type==="checkbox"?el.checked:el.value;}); heroConfigCache=c; return c; }
function refreshHeroPreview() { const p=$("#hero-live-preview"); if(p)p.innerHTML=heroPreviewMarkup(collectHeroForm()); }
async function saveHeroLocalDraft() { const b=$("#hero-local-draft"),s=$("#hero-save-status");try{b.disabled=true;localStorage.setItem("maxlab:maxlabtest:hero:draft",JSON.stringify(collectHeroForm()));s.textContent="Draft Hero tersimpan di browser ini.";}catch(e){s.textContent=e.message;}finally{b.disabled=false;} }
async function saveHeroDatabase() { const b=$("#hero-save-database"),s=$("#hero-save-status");try{b.disabled=true;b.textContent="Saving...";const config=collectHeroForm();const r=await fetch("/api/maxlab/hero",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({config})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Gagal menyimpan Hero.");heroConfigCache=d.config;heroConfigLoaded=true;localStorage.removeItem("maxlab:maxlabtest:hero:draft");s.textContent="Hero tersimpan di database. Frontend menampilkan data terbaru setelah refresh.";b.textContent="Saved ✓";}catch(e){s.textContent=e.message;b.textContent="Save";}finally{b.disabled=false;} }
function captureNavbarForm() {
  const brand = $("#navbar-brand");
  if (!brand) return;
  navbarFormCache = { ...collectNavbarFormData(), logoDataUrl: $("#navbar-logo-preview")?.src || "" };
}
function restoreNavbarFormCache() {
  if (!navbarFormCache) return;
  const data = navbarFormCache;
  if ($("#navbar-brand")) $("#navbar-brand").value = data.brandName || "";
  if ($("#navbar-whatsapp")) $("#navbar-whatsapp").value = data.whatsappNumber || "";
  if ($("#navbar-cta-label")) $("#navbar-cta-label").value = data.ctaLabel || "";
  const preview = $("#navbar-logo-preview");
  if (preview && data.logoDataUrl) { preview.src = data.logoDataUrl; preview.hidden = false; }
  const list = $("#navbar-menu-list");
  if (list && Array.isArray(data.menuItems)) {
    list.innerHTML = "";
    data.menuItems.forEach(item => {
      const row = document.createElement("div"); row.className = "navbar-menu-row";
      row.innerHTML = '<label class="field"><span>Label Menu</span><input type="text" placeholder="Contoh: Home"></label><label class="field"><span>Target URL</span><input type="text" placeholder="#home"></label><button class="remove-menu-button" type="button" aria-label="Hapus menu">×</button>';
      row.querySelectorAll("input")[0].value = item.label || "";
      row.querySelectorAll("input")[1].value = item.targetUrl || "";
      row.querySelector(".remove-menu-button").addEventListener("click", () => { row.remove(); captureNavbarForm(); });
      list.appendChild(row);
    });
  }
}


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

async function fileToBase64(file){
 const buffer=await file.arrayBuffer();
 const bytes=new Uint8Array(buffer);
 let binary="";
 for(let offset=0;offset<bytes.length;offset+=0x8000){
  binary+=String.fromCharCode(...bytes.subarray(offset,offset+0x8000));
 }
 return btoa(binary);
}
function aboutInput(label,key,value,full=false){return '<label class="field ' + (full?"field--full":"") + '"><span>' + label + '</span><input data-about-field="' + key + '" type="text" value="' + escAttr(value??"") + '"></label>';}
function renderAboutFields(){
 const c=aboutConfigCache||aboutDefaults;
 return '<div class="navbar-config-form"><div class="navbar-field-group"><h4>Konten Section About</h4><div class="form-grid">' +
 aboutInput("Nama Section","sectionName",c.sectionName) +
 aboutInput("Judul","title",c.title,true) +
 '<label class="field field--full"><span>Deskripsi</span><textarea data-about-field="description" rows="4">' + escAttr(c.description) + '</textarea></label>' +
 aboutInput("Label Read More","readMoreLabel",c.readMoreLabel) +
 '</div></div><div class="navbar-field-group"><h4>Halaman Profil Lengkap</h4><div class="form-grid">' +
 aboutInput("Judul Halaman Profil","profileTitle",c.profileTitle,true) +
 '<label class="field field--full"><span>Isi Profil</span><textarea data-about-field="profileContent" rows="10">' + escAttr(c.profileContent) + '</textarea></label>' +
 '</div></div><div class="navbar-field-group"><h4>Gambar About</h4><div class="form-grid"><label class="field field--full"><span>Upload Gambar About</span><input id="about-image-file" type="file" accept="image/jpeg,image/png,image/webp"><small class="field-help">Format JPG, PNG, WebP. Maksimal 3 MB.</small><div id="about-upload-status" class="field-help"></div><img id="about-image-preview" alt="Preview gambar About" src="' + escAttr(c.imageUrl) + '" style="' + (c.imageUrl ? "display:block;" : "display:none;") + 'max-width:100%;max-height:220px;object-fit:cover;border-radius:10px"></label></div></div></div>';
}
function collectAboutForm(){const c={...aboutDefaults,...(aboutConfigCache||{})};document.querySelectorAll("[data-about-field]").forEach(el=>c[el.dataset.aboutField]=el.value);aboutConfigCache=c;return c;}
async function loadAboutConfig(){if(aboutConfigLoaded)return;try{const r=await fetch("/api/maxlab/about",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Gagal memuat About");const local=localStorage.getItem("maxlab:maxlabtest:about:draft");aboutConfigCache={...aboutDefaults,...(d.config||{}),...(local?JSON.parse(local):{})};aboutConfigLoaded=true;if(state.activePage==="sections"&&state.activeSection==="about")render();}catch(e){const status=$("#about-save-status");if(status)status.textContent=e.message;}}
async function saveAboutLocalDraft(){const b=$("#about-local-draft"),status=$("#about-save-status");try{b.disabled=true;localStorage.setItem("maxlab:maxlabtest:about:draft",JSON.stringify(collectAboutForm()));status.textContent="Draft About tersimpan di browser ini.";}catch(e){status.textContent=e.message;}finally{b.disabled=false;}}
async function saveAboutDatabase(){const b=$("#about-save-database"),status=$("#about-save-status");try{b.disabled=true;b.textContent="Saving...";const config=collectAboutForm();const r=await fetch("/api/maxlab/about",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({config})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Gagal menyimpan About");aboutConfigCache={...aboutDefaults,...d.config};aboutConfigLoaded=true;localStorage.removeItem("maxlab:maxlabtest:about:draft");status.textContent="About berhasil disimpan ke database.";b.textContent="Saved ✓";}catch(e){status.textContent=e.message;b.textContent="Save";}finally{b.disabled=false;}}
function publishAbout(){const status=$("#about-save-status");const page=window.open("/maxlab/maxlabtest/","_blank");if(page)status.textContent="Frontend dibuka di tab baru. Data yang sudah di-Save akan tampil setelah halaman dimuat ulang.";else status.textContent="Browser memblokir tab baru. Izinkan pop-up untuk Webdesk lalu tekan Publish lagi."; }

const experienceDefaults = {
  education: [{ label:"", degree:"", faculty:"", institution:"" }],
  work: [{ position:"", institution:"", period:"", current:false }],
  experience: [{ role:"", organization:"", detail:"" }]
};
let experienceConfig = JSON.parse(JSON.stringify(experienceDefaults));
function experienceText(label, group, index, key, value, full=false) {
  return '<label class="field ' + (full ? 'field--full' : '') + '"><span>' + label + '</span><input type="text" data-experience-group="' + group + '" data-experience-index="' + index + '" data-experience-key="' + key + '" value="' + escAttr(value || '') + '"></label>';
}
function experienceGroup(title, group, fields, rows) {
  const items = rows.map((row, index) => '<div class="experience-entry-fields">' +
    fields.map(field => field.type === "checkbox"
      ? '<label class="experience-current-field"><input type="checkbox" data-experience-group="' + group + '" data-experience-index="' + index + '" data-experience-key="' + field.key + '" ' + (row[field.key] ? 'checked' : '') + '> ' + field.label + '</label>'
      : experienceText(field.label, group, index, field.key, row[field.key], !!field.full)
    ).join('') +
    (rows.length > 1 ? '<button type="button" class="secondary-button experience-remove" data-experience-remove="' + group + '" data-experience-index="' + index + '">Hapus entri</button>' : '') +
    '</div>').join('');
  return '<details class="experience-subaccordion"><summary>' + title + '</summary><div class="experience-subaccordion-body">' + items +
    '<button type="button" class="secondary-button experience-add" data-experience-add="' + group + '">+ Tambah ' + title + '</button></div></details>';
}
function renderExperienceFields() {
  return '<div class="experience-config">' +
    experienceGroup('01 Pendidikan', 'education', [
      {label:'Label Pendidikan',key:'label'},
      {label:'Gelar / Jenjang Pendidikan',key:'degree'},
      {label:'Fakultas / Program Studi',key:'faculty'},
      {label:'Universitas / Institusi',key:'institution',full:true}
    ], experienceConfig.education) +
    experienceGroup('02 Pekerjaan', 'work', [
      {label:'Jabatan / Posisi',key:'position'},
      {label:'Nama Institusi / Tempat Kerja',key:'institution',full:true},
      {label:'Periode',key:'period'},
      {label:'Masih menjabat',key:'current',type:'checkbox'}
    ], experienceConfig.work) +
    experienceGroup('03 Pengalaman', 'experience', [
      {label:'Peran / Jabatan',key:'role'},
      {label:'Nama Organisasi',key:'organization',full:true},
      {label:'Keterangan / Cabang',key:'detail',full:true}
    ], experienceConfig.experience) +
    '</div>';
}
function renderSectionFields(section) {
  if (section.id === "hero") return renderHeroFields();
  if (section.id === "about") return renderAboutFields();
  if (section.id === "experience") return renderExperienceFields();
  if (section.id !== "navbar") return `<div class="section-fields-placeholder"><strong>Field ${section.name}</strong><p>Konfigurasi section ini belum dikerjakan. Konfigurasi section ini belum dikerjakan.</p></div>`;
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
    <div class="form-actions section-form-actions"><span id="${state.activeSection === "hero" ? "hero-save-status" : state.activeSection === "about" ? "about-save-status" : "navbar-save-status"}">Draft lokal belum disimpan.</span><div class="button-group">${state.activeSection === "hero" ? `<button class="secondary-button" id="hero-local-draft" type="button">Draft</button><button class="secondary-button" id="hero-save-database" type="button">Save</button>` : state.activeSection === "about" ? `<button class="secondary-button" id="about-local-draft" type="button">Draft</button><button class="secondary-button" id="about-save-database" type="button">Save</button>` : `<button class="secondary-button" id="navbar-local-draft" type="button">Draft</button><button class="secondary-button" id="navbar-save-database" type="button">Save</button>`}${state.activeSection === "about" ? `<button class="primary-button" id="about-publish" type="button">Publish</button>` : `<button class="primary-button" id="navbar-publish" type="button">Publish</button>`}</div></div>`;
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
  captureNavbarForm();
  const [pageTitle, pageEyebrow, pageDescription] = meta[state.activePage];
  title.textContent = pageTitle;
  heading.textContent = pageTitle;
  eyebrow.textContent = pageEyebrow;
  description.textContent = pageDescription;
  navItems.forEach(item => item.classList.toggle("is-active", item.dataset.page === state.activePage));
  content.innerHTML = state.activePage === "general" ? renderGeneral() : state.activePage === "sections" ? renderSections() : renderSeo();
  bindInteractions();
  if (state.activePage === "sections" && state.activeSection === "hero") { loadHeroConfig(); }
  if (state.activePage === "sections" && state.activeSection === "about") { loadAboutConfig(); }
  if (state.activePage === "sections" && state.activeSection === "navbar") {
    if (navbarFormCache) restoreNavbarFormCache();
    else if (!navbarDataLoaded) loadNavbarDraftIntoForm();
  }
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

  $("#navbar-local-draft")?.addEventListener("click", saveNavbarLocalDraft);
  $("#hero-local-draft")?.addEventListener("click", saveHeroLocalDraft);
  $("#hero-save-database")?.addEventListener("click", saveHeroDatabase);
  $("#about-local-draft")?.addEventListener("click", saveAboutLocalDraft);
  $("#about-save-database")?.addEventListener("click", saveAboutDatabase);
  $("#about-publish")?.addEventListener("click", publishAbout);
  document.querySelectorAll("[data-experience-group]").forEach(input => input.addEventListener("input", () => {
    const { experienceGroup: group, experienceIndex: index, experienceKey: key } = input.dataset;
    experienceConfig[group][Number(index)][key] = input.type === "checkbox" ? input.checked : input.value;
  }));
  document.querySelectorAll("[data-experience-add]").forEach(button => button.addEventListener("click", () => {
    const group = button.dataset.experienceAdd;
    const blank = group === "education" ? {label:"",degree:"",faculty:"",institution:""} : group === "work" ? {position:"",institution:"",period:"",current:false} : {role:"",organization:"",detail:""};
    experienceConfig[group].push(blank);
    render();
  }));
  document.querySelectorAll("[data-experience-remove]").forEach(button => button.addEventListener("click", () => {
    const group = button.dataset.experienceRemove;
    experienceConfig[group].splice(Number(button.dataset.experienceIndex), 1);
    render();
  }));
  const aboutFile = $("#about-image-file");
  if (aboutFile) aboutFile.addEventListener("change", async () => {
    const file = aboutFile.files?.[0]; if (!file) return;
    const status = $("#about-upload-status"), preview = $("#about-image-preview");
    if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 3*1024*1024) { status.textContent = "Pilih JPG, PNG, atau WebP maksimal 3 MB."; aboutFile.value = ""; return; }
    try {
      status.textContent = "Mengunggah gambar...";
      const base64 = await fileToBase64(file);
      const response = await fetch("/api/maxlab/hero-upload",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fileName:file.name,mimeType:file.type,data:base64,section:"about"})});
      const result = await response.json(); if(!response.ok) throw new Error(result.error||"Upload gagal.");
      aboutConfigCache = {...(aboutConfigCache||aboutDefaults), imageUrl:result.publicUrl};
      status.textContent = "Upload berhasil. Gambar siap disimpan bersama field About melalui tombol Save.";
      if(preview){preview.src=result.publicUrl;preview.style.display="block";}
    } catch(error){status.textContent=error.message;}
  });
  const heroFile = $("#hero-background-file");
  if (heroFile) heroFile.addEventListener("change", async () => {
    const file = heroFile.files?.[0]; if (!file) return;
    const status = $("#hero-upload-status"), preview = $("#hero-background-preview");
    if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 3*1024*1024) { status.textContent = "Pilih JPG, PNG, atau WebP maksimal 3 MB."; heroFile.value = ""; return; }
    try {
      status.textContent = "Mengunggah gambar...";
      const base64 = await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(",")[1]);reader.onerror=()=>reject(new Error("File gagal dibaca."));reader.readAsDataURL(file);});
      const response = await fetch("/api/maxlab/hero-upload",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fileName:file.name,mimeType:file.type,data:base64})});
      const result = await response.json(); if(!response.ok) throw new Error(result.error||"Upload gagal.");
      heroConfigCache = {...(heroConfigCache||heroDefaults), imageUrl:result.publicUrl};
      status.textContent = "Upload berhasil. Simpan dengan tombol Save.";
      if(preview){preview.src=result.publicUrl;preview.style.display="block";}
    } catch(error){status.textContent=error.message;}
  });

  $("#navbar-save-database")?.addEventListener("click", saveNavbarDraft);
  $("#navbar-publish")?.addEventListener("click", publishNavbar);



  const addMenu = $("#navbar-add-link");
  if (addMenu) addMenu.addEventListener("click", () => {
    const list = $("#navbar-menu-list");
    const row = document.createElement("div");
    row.className = "navbar-menu-row";
    row.innerHTML = '<label class="field"><span>Label Menu</span><input type="text" placeholder="Contoh: Tentang Kami"></label><label class="field"><span>Target URL</span><input type="text" placeholder="#about"></label><button class="remove-menu-button" type="button" aria-label="Hapus menu">×</button>';
    list.appendChild(row);
    row.querySelector(".remove-menu-button").addEventListener("click", () => { row.remove(); captureNavbarForm(); });
    captureNavbarForm();
  });
  document.querySelectorAll(".remove-menu-button:not(:disabled)").forEach(button => button.addEventListener("click", () => { button.closest(".navbar-menu-row")?.remove(); captureNavbarForm(); }));
  const logoInput = $("#navbar-logo");
  if (logoInput) logoInput.addEventListener("change", () => {
    const file = logoInput.files?.[0];
    const preview = $("#navbar-logo-preview");
    if (!file || !preview) return;
    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
    captureNavbarForm();
  });

  ["#navbar-brand", "#navbar-whatsapp", "#navbar-cta-label"].forEach(selector => $(selector)?.addEventListener("input", captureNavbarForm));
  $("#navbar-menu-list")?.addEventListener("input", captureNavbarForm);

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
function collectNavbarFormData() {
  return {
    brandName: $("#navbar-brand")?.value || "",
    whatsappNumber: $("#navbar-whatsapp")?.value || "",
    ctaLabel: $("#navbar-cta-label")?.value || "",
    menuItems: [...document.querySelectorAll("#navbar-menu-list .navbar-menu-row")].map(row => ({
      label: row.querySelectorAll("input")[0]?.value || "",
      targetUrl: row.querySelectorAll("input")[1]?.value || ""
    }))
  };
}
async function readNavbarLogo() {
  const file = $("#navbar-logo")?.files?.[0];
  if (!file) return "";
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Logo gagal dibaca."));
    reader.readAsDataURL(file);
  });
}
async function saveNavbarLocalDraft() {
  const button = $("#navbar-local-draft"), status = $("#navbar-save-status");
  try {
    button.disabled = true;
    const data = collectNavbarFormData();
    data.logoDataUrl = await readNavbarLogo() || ($("#navbar-logo-preview")?.src?.startsWith("data:image/") ? $("#navbar-logo-preview").src : "");
    localStorage.setItem("maxlab:maxlabtest:navbar:draft", JSON.stringify(data));
    navbarFormCache = data;
    status.textContent = "Draft tersimpan lokal di browser ini.";
    button.textContent = "Draft ✓";
  } catch (error) { status.textContent = "Draft gagal disimpan: " + error.message; }
  finally { button.disabled = false; }
}
async function saveNavbarDraft() {
  const button = $("#navbar-save-database"), status = $("#navbar-save-status");
  try {
    button.disabled = true; button.textContent = "Saving...";
    const data = collectNavbarFormData();
    data.logoDataUrl = await readNavbarLogo() || ($("#navbar-logo-preview")?.src?.startsWith("data:image/") ? $("#navbar-logo-preview").src : "");
    const response = await fetch("/api/maxlab/navbar", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Gagal menyimpan ke database.");
    localStorage.removeItem("maxlab:maxlabtest:navbar:draft");
    navbarFormCache = data;
    navbarDataLoaded = true;
    status.textContent = "Tersimpan di database. Frontend akan mengambil data terbaru saat dibuka atau di-refresh.";
    button.textContent = "Saved ✓";
  } catch (error) { status.textContent = error.message; button.textContent = "Save"; }
  finally { button.disabled = false; }
}
function publishNavbar() {
  const status = $("#navbar-save-status");
  const page = window.open("/maxlab/maxlabtest/", "_blank");
  if (page) status.textContent = "Frontend dibuka di tab baru. Save berikutnya akan tampil setelah halaman di-refresh.";
  else status.textContent = "Browser memblokir tab baru. Izinkan pop-up untuk Webdesk lalu tekan Publish lagi.";
}
async function initMaxLabAdminAuth() {
  const gate = document.getElementById("maxlab-auth-gate");
  const form = document.getElementById("maxlab-auth-form");
  const error = document.getElementById("maxlab-auth-error");
  const password = document.getElementById("maxlab-admin-password");
  const submit = document.getElementById("maxlab-auth-submit");
  if (!gate || !form) return;
  try {
    const response = await fetch("/api/admin/auth", { cache: "no-store", credentials: "same-origin" });
    const data = await response.json();
    if (data.authenticated) gate.hidden = true;
  } catch {}
  form.addEventListener("submit", async event => {
    event.preventDefault();
    submit.disabled = true;
    error.textContent = "";
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.value })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login gagal.");
      const check = await fetch("/api/admin/auth", { cache: "no-store", credentials: "same-origin" });
      const session = await check.json();
      if (!check.ok || !session.authenticated) throw new Error("Login diterima, tetapi sesi belum tersimpan. Periksa izin cookie browser lalu coba lagi.");
      gate.hidden = true;
    } catch (err) {
      error.textContent = err.message;
    } finally {
      submit.disabled = false;
    }
  });
}
initMaxLabAdminAuth();

async function loadNavbarDraftIntoForm() {
  if (navbarDataLoaded) { restoreNavbarFormCache(); return; }
  const status = $("#navbar-save-status");
  const brand = $("#navbar-brand");
  const whatsapp = $("#navbar-whatsapp");
  const cta = $("#navbar-cta-label");
  const preview = $("#navbar-logo-preview");
  const list = $("#navbar-menu-list");

  // Restore the local browser draft independently; it must work even when
  // no database configuration exists yet or the API is temporarily unavailable.
  function restoreLocalDraft() {
    const localRaw = localStorage.getItem("maxlab:maxlabtest:navbar:draft");
    if (!localRaw) return false;
    const local = JSON.parse(localRaw);
    if (brand) brand.value = local.brandName || "";
    if (whatsapp) whatsapp.value = local.whatsappNumber || "";
    if (cta) cta.value = local.ctaLabel || "";
    if (local.logoDataUrl && preview) { preview.src = local.logoDataUrl; preview.hidden = false; }
    if (list && Array.isArray(local.menuItems)) {
      list.innerHTML = "";
      local.menuItems.forEach(item => {
        const row = document.createElement("div");
        row.className = "navbar-menu-row";
        row.innerHTML = '<label class="field"><span>Label Menu</span><input type="text" placeholder="Contoh: Home"></label><label class="field"><span>Target URL</span><input type="text" placeholder="#home"></label><button class="remove-menu-button" type="button" aria-label="Hapus menu">×</button>';
        row.querySelectorAll("input")[0].value = item.label || "";
        row.querySelectorAll("input")[1].value = item.targetUrl || "";
        row.querySelector(".remove-menu-button").addEventListener("click", () => row.remove());
        list.appendChild(row);
      });
    }
    if (status) status.textContent = "Draft lokal dipulihkan dari browser ini.";
    navbarDataLoaded = true;
    navbarFormCache = { ...local, logoDataUrl: local.logoDataUrl || preview?.src || "" };
    return true;
  }

  let databaseLoaded = false;
  try {
    const response = await fetch("/api/maxlab/navbar?slug=maxlabtest", { cache: "no-store" });
    const data = await response.json();
    if (!$("#navbar-brand")?.isConnected) return;
    if (response.ok && data.config) {
      const config = data.config;
      if (brand && !brand.value) brand.value = config.brand_name || "";
      if (whatsapp && !whatsapp.value) whatsapp.value = config.whatsapp_number || "";
      if (cta && !cta.value) cta.value = config.cta_label || "";
      if (preview && config.logo_url) { preview.src = config.logo_url; preview.hidden = false; }
      if (list && data.menuItems?.length && list.dataset.loaded !== "true") {
        list.innerHTML = "";
        data.menuItems.forEach(item => {
          const row = document.createElement("div");
          row.className = "navbar-menu-row";
          row.innerHTML = '<label class="field"><span>Label Menu</span><input type="text" placeholder="Contoh: Home"></label><label class="field"><span>Target URL</span><input type="text" placeholder="#home"></label><button class="remove-menu-button" type="button" aria-label="Hapus menu">×</button>';
          row.querySelectorAll("input")[0].value = item.label || "";
          row.querySelectorAll("input")[1].value = item.target_url || "";
          row.querySelector(".remove-menu-button").addEventListener("click", () => row.remove());
          list.appendChild(row);
        });
        list.dataset.loaded = "true";
      }
      databaseLoaded = true;
    }
  } catch (error) {
    if (status) status.textContent = "Database belum dapat dimuat; memeriksa Draft lokal...";
  }

  try {
    if (restoreLocalDraft()) return;
  } catch (error) {
    if (status) status.textContent = "Draft lokal tidak dapat dibaca: " + error.message;
    return;
  }
  if (!$("#navbar-brand")?.isConnected) return;
  navbarDataLoaded = true;
  navbarFormCache = { ...collectNavbarFormData(), logoDataUrl: preview?.src || "" };
  if (status) status.textContent = databaseLoaded
    ? "Konfigurasi berhasil dimuat."
    : "Belum ada Draft lokal atau konfigurasi database.";
}
