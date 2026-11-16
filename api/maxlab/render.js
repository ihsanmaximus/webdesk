const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]);
}
async function db(path) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Accept: "application/json" },
    cache: "no-store"
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch {}
  if (!response.ok) throw new Error(data?.message || "Gagal mengambil data website.");
  return data;
}
function heroHtml(config) {
  if (!config || !String(config.headline || "").trim() || !String(config.subheadline || "").trim()) return "";
  const c = config;
  const image = c.imageUrl ? esc(c.imageUrl) : "";
  const heightClass = c.height === "compact" ? "hero-height-compact" : c.height === "medium" ? "hero-height-medium" : "hero-height-tall";
  const layoutClass = c.layout || "background-image";
  const safeTarget = value => /^(#|https:\/\/|http:\/\/|mailto:|tel:)/i.test(String(value || "")) ? esc(value) : "#";
  const buttons = `${c.primaryCtaEnabled && c.primaryCtaLabel && c.primaryCtaTarget ? `<a class="hero-cta primary" href="${safeTarget(c.primaryCtaTarget)}">${esc(c.primaryCtaLabel)}</a>` : ""}${c.secondaryCtaEnabled && c.secondaryCtaLabel && c.secondaryCtaTarget ? `<a class="hero-cta secondary" href="${safeTarget(c.secondaryCtaTarget)}">${esc(c.secondaryCtaLabel)}</a>` : ""}`;
  const pointIcons = {
    people: '<circle cx="12" cy="6" r="3"/><circle cx="5" cy="10" r="2"/><circle cx="19" cy="10" r="2"/><path d="M6 21v-5a6 6 0 0 1 12 0v5M2 18v-3M22 18v-3"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    heart: '<path d="M12 21C5 15 3 11.5 3 8.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 9 1.5C21 11.5 19 15 12 21z"/>'
  };
  const points = (Array.isArray(c.points) ? c.points : []).filter(point => String(point?.text || "").trim()).slice(0, 3);
  const pointsHtml = points.length ? `<ul class="hero-points">${points.map(point => {
    const icon = pointIcons[point.icon] || "";
    return `<li class="hero-point">${icon ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>` : ""}<span>${esc(point.text)}</span></li>`;
  }).join("")}</ul>` : "";
  const copy = `<div class="hero-copy">${c.eyebrow ? `<p class="hero-eyebrow">${esc(c.eyebrow)}</p>` : ""}<h1>${esc(c.headline)}</h1><p class="hero-description">${esc(c.subheadline)}</p><div class="hero-actions">${buttons}</div>${pointsHtml}</div>`;
  let layout = copy;
  if (c.layout === "text-image" && image) layout = `<div class="hero-two-col">${c.imagePosition === "left" ? `<img class="hero-image" src="${image}" alt="${esc(c.imageAlt)}">` : ""}${copy}${c.imagePosition !== "left" ? `<img class="hero-image" src="${image}" alt="${esc(c.imageAlt)}">` : ""}</div>`;
  if (c.layout === "split-full-bleed") layout = `<div class="hero-split">${c.imagePosition === "left" && image ? `<img class="hero-image" src="${image}" alt="${esc(c.imageAlt)}">` : ""}${copy}${c.imagePosition !== "left" && image ? `<img class="hero-image" src="${image}" alt="${esc(c.imageAlt)}">` : ""}</div>`;
  if (c.layout === "text-image" && !image) layout = copy;
  const gradient = c.gradientEnabled ? `<div class="hero-gradient"></div>` : "";
  const cssVars = `--hero-image:url('${image}');--hero-background:${esc(c.backgroundColor || "#eaf5fc")};--hero-text:${esc(c.textColor || "#14305a")};--hero-accent:${esc(c.accentColor || "#b4c540")};--hero-eyebrow-color:${esc(c.eyebrowColor || "#176b9b")};--hero-headline-color:${esc(c.headlineColor || "#123d63")};--hero-description-color:${esc(c.descriptionColor || "#405c73")};--hero-alignment:${esc(c.alignment || "left")}`;
  return `<section class="hero-section ${esc(layoutClass)} ${heightClass}${c.gradientEnabled ? "" : " no-gradient"}" style="${cssVars}">${gradient}<div class="hero-inner">${layout}</div></section>`;
}
function aboutHtml(config, slug) {
  if (!config || !String(config.section_name || "").trim() || !String(config.title || "").trim() || !String(config.description || "").trim() || !String(config.read_more_label || "").trim()) return "";
  const image = config.image_url ? esc(config.image_url) : "";
  return '<section class="about" id="about"><div class="container about-inner"><div><div class="section-head"><h2 class="section-title">' + esc(config.section_name) + '</h2></div><h3 class="about-title">' + esc(config.title) + '</h3><p class="about-text">' + esc(config.description) + '</p><a class="link-arrow" href="/maxlab/' + esc(slug) + '/profil">' + esc(config.read_more_label) + ' <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-arrow"/></svg></a></div>' + (image ? '<img class="about-photo" src="' + image + '" alt="" loading="lazy">' : '') + '</div></section>';
}

function experienceHtml(config) {
  if (!config || typeof config !== "object") return "";
  const education = Array.isArray(config.education) ? config.education : [];
  const work = Array.isArray(config.work) ? config.work : [];
  const experience = Array.isArray(config.experience) ? config.experience : [];
  const hasContent = [config.sectionName, config.headline, config.subheadline].some(value => String(value || "").trim()) ||
    education.some(item => [item.label, item.degree, item.faculty, item.institution].some(value => String(value || "").trim())) ||
    work.some(item => [item.position, item.institution, item.period].some(value => String(value || "").trim())) ||
    experience.some(item => [item.role, item.organization, item.detail].some(value => String(value || "").trim()));
  if (!hasContent) return "";

  const educationItems = education.filter(item =>
    [item.label, item.degree, item.faculty, item.institution].some(value => String(value || "").trim())
  ).map(item => `<article class="ee-entry">
    ${item.label ? `<span class="ee-label">${esc(item.label)}</span>` : ""}
    ${item.degree ? `<h4>${esc(item.degree)}</h4>` : ""}
    ${item.faculty ? `<p>${esc(item.faculty)}</p>` : ""}
    ${item.institution ? `<strong>${esc(item.institution)}</strong>` : ""}
  </article>`).join("");

  const workItems = work.filter(item =>
    [item.position, item.institution, item.period].some(value => String(value || "").trim()) || item.current
  ).map(item => `<article class="ee-entry">
    ${item.position ? `<h4>${esc(item.position)}</h4>` : ""}
    ${item.period ? `<span class="ee-period">${esc(item.period)}</span>` : ""}
    ${item.institution ? `<p>${esc(item.institution)}</p>` : ""}
    ${item.current ? '<span class="ee-current">Masih menjabat</span>' : ""}
  </article>`).join("");

  const experienceItems = experience.filter(item =>
    [item.role, item.organization, item.detail].some(value => String(value || "").trim())
  ).map(item => `<article class="ee-org-item">
    ${item.role ? `<span class="ee-org-role">${esc(item.role)}</span>` : ""}
    ${item.organization ? `<h4>${esc(item.organization)}</h4>` : ""}
    ${item.detail ? `<p>${esc(item.detail)}</p>` : ""}
  </article>`).join("");

  return `<section class="ee-section" id="experience">
    <div class="container">
      <div class="ee-heading">
        ${config.sectionName ? `<span class="ee-eyebrow">${esc(config.sectionName)}</span>` : ""}
        ${config.headline ? `<h2>${esc(config.headline)}</h2>` : ""}
        ${config.subheadline ? `<p class="ee-description">${esc(config.subheadline)}</p>` : ""}
      </div>
      <div class="ee-layout">
        ${educationItems ? `<section class="ee-card ee-education"><div class="ee-card-heading"><span class="ee-icon" aria-hidden="true">01</span><h3>Pendidikan</h3></div><div class="ee-timeline">${educationItems}</div></section>` : ""}
        ${workItems ? `<section class="ee-card ee-career"><div class="ee-card-heading"><span class="ee-icon" aria-hidden="true">02</span><h3>Pekerjaan</h3></div><div class="ee-timeline">${workItems}</div></section>` : ""}
        ${experienceItems ? `<section class="ee-card ee-organization"><div class="ee-card-heading"><span class="ee-icon" aria-hidden="true">03</span><h3>Pengalaman</h3></div><div class="ee-org-grid">${experienceItems}</div></section>` : ""}
      </div>
    </div>
  </section>`;
}

const serviceIcons = {
 "heart-pulse": '<path d="M20 8c0 6-8 11-8 11S4 14 4 8a4 4 0 0 1 8-2 4 4 0 0 1 8 2Z"/><path d="M4 12h4l2-3 3 6 2-3h5"/>',
 "shield-check": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m8 12 3 3 5-6"/>',
 "users": '<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 4a4 4 0 0 1 0 7m1 3a5 5 0 0 1 4 5v2"/>',
 "stethoscope": '<path d="M6 3v5a4 4 0 0 0 8 0V3M4 3h4M12 3h4M10 12v2a5 5 0 0 0 10 0v-1"/><circle cx="20" cy="10" r="2"/>',
 "award": '<circle cx="12" cy="8" r="6"/><path d="m8 13-1 9 5-3 5 3-1-9"/>',
 "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 "hand-heart": '<path d="M12 21S4 16 4 10a4 4 0 0 1 8-2 4 4 0 0 1 8 2c0 6-8 11-8 11Z"/>',
 "clipboard-check": '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4h6M8 13l3 3 5-6"/>',
 "baby": '<circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M9 15q3 3 6 0"/>',
 "apple": '<path d="M12 7c-2-4 1-5 4-5M12 7C4 4 2 9 3 15s5 8 9 5c4 3 8 1 9-5s-2-11-9-8Z"/>',
 "activity": '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
 "star": '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z"/>'
};
function servicesHtml(config) {
 if (!config || typeof config !== "object") return "";
 const items = (Array.isArray(config.items) ? config.items : []).slice(0,6).filter(item => [item.title,item.description].some(value => String(value || "").trim()) || serviceIcons[item.icon]);
 const hasHeading = [config.sectionName,config.headline,config.subheadline].some(value => String(value || "").trim());
 if (!hasHeading && !items.length) return "";
 const cards = items.map(item => {
  const icon = serviceIcons[item.icon] || "";
  return '<li><article class="services-card">' +
   (icon ? '<span class="services-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + icon + '</svg></span>' : "") +
   '<div class="services-body">' + (item.title ? '<h3 class="services-name">' + esc(item.title) + '</h3>' : "") + (item.description ? '<p class="services-desc">' + esc(item.description) + '</p>' : "") + '</div>' +
   '<svg class="services-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></article></li>';
 }).join("");
 return '<section class="services" id="services"><div class="container">' +
  (hasHeading ? '<div class="section-head">' + (config.sectionName ? '<p class="section-lead">' + esc(config.sectionName) + '</p>' : "") + (config.headline ? '<h2 class="section-title">' + esc(config.headline) + '</h2>' : "") + (config.subheadline ? '<p class="section-lead">' + esc(config.subheadline) + '</p>' : "") + '</div>' : "") +
  (cards ? '<ul class="services-grid">' + cards + '</ul>' : "") + '</div></section>';
}
function profileHtml(config) {
  const title = esc(config?.profile_title || "");
  const paragraphs = String(config?.profile_content || "").split(/\r?\n\s*\r?\n/).map(p => p.trim()).filter(Boolean);
  const content = paragraphs.map(p => "<p>" + esc(p).replace(/\r?\n/g, "<br>") + "</p>").join("");
  return '<!doctype html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + title + '</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Montserrat:wght@400;500;600&family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/css/maxlab-global.css?v=1">\n<link rel="stylesheet" href="/assets/css/maxlab-about.css?v=2">\n<link rel="stylesheet" href="/assets/css/maxlab-education-experience.css?v=1">
<link rel="stylesheet" href="/assets/css/maxlab-services.css?v=1"></head><body><main class="about-profile-page"><article class="about-profile-inner"><h1>' + title + '</h1><div class="about-profile-content">' + content + '</div></article></main></body></html>';
}
function pageHtml(website, config, menuItems, heroConfig, aboutConfig, experienceConfig, servicesConfig) {
  const brand = config?.brand_name || website.name || "Website";
  const logo = config?.logo_url ? `<img src="${esc(config.logo_url)}" alt="">` : "";
  const menus = (menuItems || []).filter(item => item.is_active !== false).map(item =>
    `<a href="${esc(item.target_url || "#")}">${esc(item.label || "Menu")}</a>`
  ).join("");
  const phone = String(config?.whatsapp_number || "").replace(/[^0-9]/g, "");
  const cta = phone && config?.cta_label
    ? `<a class="cta" href="https://wa.me/${esc(phone)}">${esc(config.cta_label)}</a>` : "";
  return `<!doctype html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex,nofollow"><title>${esc(brand)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Montserrat:wght@400;500;600&family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n<link rel="stylesheet" href="/assets/css/maxlab-global.css?v=1">\n<link rel="stylesheet" href="/assets/css/maxlab-global.css?v=1">\n<link rel="stylesheet" href="/assets/css/maxlab-hero.css?v=2">\n<link rel="stylesheet" href="/assets/css/maxlab-about.css?v=2">
<link rel="stylesheet" href="/assets/css/maxlab-education-experience.css?v=1">
<style>
*{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#172033;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}
/* Navbar color and controls aligned to Dokter Faisal reference: white surface, blue identity. */
.site-nav{position:sticky;top:0;z-index:20;min-height:76px;padding:12px clamp(18px,5vw,72px);display:flex;align-items:center;justify-content:space-between;gap:24px;background:#fff;border-bottom:1px solid #d5e4f3;color:#14305a}
.brand{display:flex;align-items:center;gap:12px;min-width:0;color:#083a73;font-weight:700;font-size:18px}.brand img{width:42px;height:42px;flex:0 0 42px;object-fit:contain;border-radius:8px}
.nav-links{display:flex;align-items:center;justify-content:center;gap:clamp(14px,2.5vw,34px);flex-wrap:wrap}.nav-links a{color:#14305a;text-decoration:none;font-size:14px;font-weight:600}
.nav-links a:hover{color:#0b5cad}.cta{display:inline-flex;align-items:center;justify-content:center;padding:12px 18px;border-radius:999px;background:#0b5cad;color:#fff;text-decoration:none;font-size:14px;font-weight:700;white-space:nowrap}
.nav-toggle{display:none;width:44px;height:44px;padding:9px;border:0;border-radius:9px;background:transparent;color:#0b5cad;cursor:pointer}
.nav-toggle span{display:block;height:2.5px;margin:6px 0;background:currentColor;border-radius:2px;transition:transform .2s ease,opacity .2s ease}
@media(max-width:767px){.site-nav{min-height:68px;padding:12px 18px;gap:12px;background:#fff;border-bottom:1px solid #d5e4f3}.brand{font-size:16px;flex:1;color:#083a73}.brand img{width:42px;height:42px;flex-basis:42px}.nav-toggle{display:block;flex:0 0 44px;color:#0b5cad}.site-nav>.cta{display:none}
.nav-toggle[aria-expanded="true"] span:nth-child(1){transform:translateY(8px) rotate(45deg)}.nav-toggle[aria-expanded="true"] span:nth-child(2){opacity:0}.nav-toggle[aria-expanded="true"] span:nth-child(3){transform:translateY(-8px) rotate(-45deg)}
.nav-links{position:absolute;top:100%;left:0;right:0;display:none;flex-direction:column;align-items:stretch;gap:0;padding:8px 18px 16px;background:#fff;border-top:1px solid #d5e4f3;box-shadow:0 12px 24px rgba(8,58,115,.12)}
.nav-links.is-open{display:flex;animation:menuDrop .2s ease-out}.nav-links a{display:block;padding:14px 8px;border-bottom:1px solid #d5e4f3;color:#14305a;font-size:15px}.nav-links a:last-child{border-bottom:0}.cta{padding:10px 13px;font-size:13px}main{margin:28px auto;padding:24px}}
@keyframes menuDrop{from{opacity:0;transform:translateY(-7px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.nav-links.is-open{animation:none}}


</style></head><body>
<header class="site-nav" id="site-navbar"><div class="brand" id="site-brand">${logo}<span>${esc(brand)}</span></div>
<nav class="nav-links" id="site-menu" aria-label="Navigasi utama">${menus}</nav>${cta}
<button class="nav-toggle" id="nav-toggle" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="Buka menu"><span></span><span></span><span></span></button></header>
${heroHtml(heroConfig)}
${aboutHtml(aboutConfig, website.slug)}
${experienceHtml(experienceConfig)}
${servicesHtml(servicesConfig)}
<script>(function(){const b=document.getElementById("nav-toggle"),m=document.getElementById("site-menu");if(!b||!m)return;function setOpen(v){m.classList.toggle("is-open",v);b.setAttribute("aria-expanded",String(v));b.setAttribute("aria-label",v?"Tutup menu":"Buka menu")}b.addEventListener("click",()=>setOpen(!m.classList.contains("is-open")));m.addEventListener("click",e=>{if(e.target.closest("a"))setOpen(false)});document.addEventListener("keydown",e=>{if(e.key==="Escape")setOpen(false)});window.addEventListener("resize",()=>{if(window.innerWidth>767)setOpen(false)})})();</script>
</body></html>`;
}
export default async function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Vercel-CDN-Cache-Control", "no-store");
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).send("Method not allowed"); }
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(503).send("Konfigurasi Supabase belum lengkap di server.");
  const slug = String(req.query?.slug || "").trim();
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return res.status(400).send("Slug website tidak valid.");
  try {
    const websites = await db(`maxlab_websites?select=id,name,domain,slug,status&slug=eq.${encodeURIComponent(slug)}&limit=1`);
    if (!websites?.length) return res.status(404).send("Website tidak ditemukan.");
    const website = websites[0];
    const configs = await db(`maxlab_navbar_configs?select=*&website_id=eq.${website.id}&order=updated_at.desc&limit=1`);
    const config = configs?.[0] || null;
    const menuItems = config ? await db(`maxlab_navbar_menu_items?select=id,label,target_url,sort_order,is_active&navbar_config_id=eq.${config.id}&order=sort_order.asc`) : [];

    // Load the saved Hero configuration for this website and pass it to the renderer.
    const heroRows = await db(`maxlab_hero_configs?select=config&website_id=eq.${website.id}&limit=1`);
    const heroConfig = heroRows?.[0]?.config || null;
    const aboutRows = await db(`maxlab_about_configs?select=*&website_id=eq.${website.id}&limit=1`);
    const aboutConfig = aboutRows?.[0] || null;
    const experienceRows = await db(`maxlab_experience_configs?select=config,status&website_id=eq.${website.id}&limit=1`);
    const experienceConfig = experienceRows?.[0]?.config || null;
    const servicesRows = await db(`maxlab_services_configs?select=config,status&website_id=eq.${website.id}&limit=1`);
    const servicesConfig = servicesRows?.[0]?.config || null;
    if (String(req.query?.view || "") === "profile") { if (!aboutConfig || !String(aboutConfig.profile_title || "").trim() || !String(aboutConfig.profile_content || "").trim()) return res.status(404).send("Halaman profil belum tersedia."); return res.status(200).send(profileHtml(aboutConfig)); }

    return res.status(200).send(pageHtml(website, config, menuItems || [], heroConfig, aboutConfig, experienceConfig, servicesConfig));
  } catch (error) {
    console.error("MaxLab SSR render error", error);
    return res.status(500).send("Gagal merender halaman website. Detail: " + String(error?.message || error).slice(0, 500));
  }
}
