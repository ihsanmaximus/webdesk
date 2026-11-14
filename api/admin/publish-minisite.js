// Admin-only publish endpoint. Persists the complete minisite to Supabase.
const URL=process.env.SUPABASE_URL;
const SERVICE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_TOKEN=process.env.WEBDESK_ADMIN_TOKEN;
async function db(path,options={}){
 const r=await fetch(`${URL}/rest/v1/${path}`,{...options,headers:{apikey:SERVICE_KEY,Authorization:`Bearer ${SERVICE_KEY}`,"Content-Type":"application/json",...(options.headers||{})}});
 const raw=await r.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{}
 if(!r.ok){const e=new Error(data?.message||"Database request failed");e.status=r.status;throw e}return data;
}
const val=(obj,key)=>obj?.[key]??null;
export default async function handler(req,res){
 res.setHeader("Content-Type","application/json; charset=utf-8");res.setHeader("Cache-Control","no-store");
 if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Method not allowed"})}
 if(!URL||!SERVICE_KEY||!ADMIN_TOKEN)return res.status(503).json({error:"Konfigurasi database/admin belum lengkap."});
 if(String(req.headers.authorization||"").replace(/^Bearer\\s+/i,"")!==ADMIN_TOKEN)return res.status(401).json({error:"Token admin tidak valid."});
 try{
  const b=typeof req.body==="string"?JSON.parse(req.body):(req.body||{});
  const title=String(b.title||"").trim(),slug=String(b.slug||"").trim().toLowerCase();
  if(!title||title.split(/\\s+/).length>3)return res.status(400).json({error:"Judul Event wajib diisi, maksimal 3 kata."});
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return res.status(400).json({error:"Slug tidak valid."});
  const sections=Array.isArray(b.sections)?b.sections:[];
  const byKey=Object.fromEntries(sections.map(s=>[s.key,s]));
  const nav=byKey.navbar?.content||{},hero=byKey.hero?.content||{},heroImg=byKey.hero_image?.content||{};
  const materials=byKey.materi_acara?.content?.items||[],agenda=byKey.schedule?.content?.items||[],speakers=byKey.speakers?.content?.items||[],pricing=byKey.pricing?.content?.items||[];
  const reg=byKey.registration?.content||{},footer=byKey.footer?.content||{},sticky=byKey.sticky_cta?.content||{};
  const settings=b.settings||{},seo=b.seo||{},theme=b.theme||{},published=b.status==="published";
  const sitePayload={
   title,slug,status:published?"published":"draft",description:b.description||"",
   start_date:settings.start_date||null,end_date:settings.end_date||null,event_format:settings.format||null,location:settings.location||null,organizer:settings.organizer||null,
   navbar_brand:nav.brand||null,navbar_button_label:nav.button_label||null,
   hero_eyebrow:hero.eyebrow||null,hero_title:hero.title||null,hero_description:hero.description||null,hero_primary_cta:hero.primary_cta||null,hero_secondary_cta:hero.secondary_cta||null,
   hero_image_url:null,hero_image_alt:heroImg.alt||null,
   materi_heading:byKey.materi_acara?.title||null,schedule_heading:byKey.schedule?.title||null,speakers_heading:byKey.speakers?.title||null,pricing_heading:byKey.pricing?.title||null,
   registration_heading:reg.heading||null,registration_description:reg.description||null,registration_button_label:reg.button_label||null,admin_whatsapp:reg.whatsapp||null,
   footer_organization:footer.organization||null,footer_address:footer.address||null,footer_whatsapp:footer.whatsapp||null,footer_email:footer.email||null,
   sticky_cta_text:sticky.text||null,sticky_cta_button_label:sticky.button_label||null,
   seo_meta_title:seo.title||null,seo_meta_description:seo.description||null,seo_og_image_url:null,seo_canonical_url:seo.canonical||null,
   theme_primary_color:theme.primary_color||"#173b70",theme,seo,settings,
   published_at:published?new Date().toISOString():null
  };
  const saved=await db("minisites?on_conflict=slug&select=id,slug,status",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify(sitePayload)});
  const site=saved?.[0];if(!site?.id)throw new Error("Database tidak mengembalikan ID minisite.");
  await db(`minisite_sections?minisite_id=eq.${site.id}`,{method:"DELETE",headers:{Prefer:"return=minimal"}});
  const sectionRows=sections.map((s,i)=>({minisite_id:site.id,section_key:s.key,section_type:s.type,title:s.title||null,sort_order:i+1,is_visible:!!s.visible,content:s.content||{}}));
  if(sectionRows.length)await db("minisite_sections",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(sectionRows)});
  const collections=[
   ["minisite_materials",materials.map((x,i)=>({minisite_id:site.id,title:x.title||"",description:x.description||null,sort_order:i+1}))],
   ["minisite_agenda",agenda.map((x,i)=>({minisite_id:site.id,day_label:x.day||null,time_label:x.time||null,title:x.title||"",description:x.description||null,sort_order:i+1}))],
   ["minisite_speakers",speakers.map((x,i)=>({minisite_id:site.id,name:x.name||"",role:x.role||null,bio:x.bio||null,topic:x.topic||null,image_url:null,sort_order:i+1}))],
   ["minisite_pricing",pricing.map((x,i)=>({minisite_id:site.id,name:x.name||"",description:x.description||null,original_price:Number(x.original_price)||null,price:Number(x.price)||0,unit_label:x.unit||null,badge:x.badge||null,features:String(x.features||"").split(/\\r?\\n/).map(v=>v.trim()).filter(Boolean),button_label:x.button_label||null,is_featured:!!x.featured,sort_order:i+1}))]
  ];
  for(const [table] of collections)await db(`${table}?minisite_id=eq.${site.id}`,{method:"DELETE",headers:{Prefer:"return=minimal"}});
  for(const [table,rows] of collections)if(rows.length)await db(table,{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(rows)});
  return res.status(200).json({success:true,id:site.id,slug:site.slug,status:site.status,section_count:sectionRows.length,materials:materials.length,agenda:agenda.length,speakers:speakers.length,pricing:pricing.length});
 }catch(e){console.error("Publish minisite error",e);return res.status(e.status||500).json({error:e.message||"Gagal menyimpan data."})}
}