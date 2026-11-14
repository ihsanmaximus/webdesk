// Admin-only publish endpoint. Configure WEBDESK_ADMIN_TOKEN and SUPABASE_SERVICE_ROLE_KEY in Vercel.
const URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_TOKEN = process.env.WEBDESK_ADMIN_TOKEN;
async function db(path, options={}) {
  const r = await fetch(`${URL}/rest/v1/${path}`, { ...options, headers: {
    apikey:SERVICE_KEY, Authorization:`Bearer ${SERVICE_KEY}`, "Content-Type":"application/json",
    ...(options.headers||{})
  }});
  const raw=await r.text(); let data=null; try{data=raw?JSON.parse(raw):null}catch{}
  if(!r.ok){const e=new Error(data?.message||"Database request failed");e.status=r.status;throw e}
  return data;
}
export default async function handler(req,res){
  res.setHeader("Content-Type","application/json; charset=utf-8");
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Method not allowed"})}
  if(!URL||!SERVICE_KEY||!ADMIN_TOKEN)return res.status(503).json({error:"Konfigurasi admin/database belum lengkap di Vercel."});
  const token=String(req.headers.authorization||"").replace(/^Bearer\s+/i,"");
  if(token!==ADMIN_TOKEN)return res.status(401).json({error:"Token admin tidak valid."});
  try{
    const b=typeof req.body==="string"?JSON.parse(req.body):(req.body||{});
    const title=String(b.title||"").trim(),slug=String(b.slug||"").trim().toLowerCase();
    if(!title||title.split(/\s+/).length>3)return res.status(400).json({error:"Judul Event wajib diisi, maksimal 3 kata."});
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return res.status(400).json({error:"Slug tidak valid."});
    const status=b.status==="published"?"published":"draft";
    const saved=await db("minisites?on_conflict=slug&select=id,slug,status",{
      method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},
      body:JSON.stringify({title,slug,status,description:b.description||"",theme:b.theme||{},seo:b.seo||{},settings:b.settings||{},published_at:status==="published"?new Date().toISOString():null})
    });
    const site=saved?.[0]; if(!site?.id)throw new Error("Database tidak mengembalikan ID minisite.");
    await db(`minisite_sections?minisite_id=eq.${site.id}`,{method:"DELETE",headers:{Prefer:"return=minimal"}});
    const sections=(b.sections||[]).map((s,i)=>({minisite_id:site.id,section_key:s.key,section_type:s.type,title:s.title||null,sort_order:i+1,is_visible:!!s.visible,content:s.content||{}}));
    if(sections.length)await db("minisite_sections",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(sections)});
    return res.status(200).json({success:true,id:site.id,slug:site.slug,status:site.status,section_count:sections.length});
  }catch(e){console.error(e);return res.status(e.status||500).json({error:e.message||"Gagal menyimpan data."})}
}