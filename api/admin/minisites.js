import { isAdminAuthorized } from "./auth.js";
// Admin-only list endpoint for saved landing pages.
const URL=process.env.SUPABASE_URL;
const SERVICE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
export default async function handler(req,res){
 res.setHeader("Content-Type","application/json; charset=utf-8");
 res.setHeader("Cache-Control","no-store");
 if(!["GET","DELETE"].includes(req.method)){res.setHeader("Allow","GET, DELETE");return res.status(405).json({error:"Method not allowed"});}
 if(!URL||!SERVICE_KEY)return res.status(503).json({error:"Konfigurasi database/admin belum lengkap."});
 if(!isAdminAuthorized(req))return res.status(401).json({error:"Sesi admin tidak valid. Silakan login kembali."});
 try{
  const id=String(req.query?.id||"").trim();
  const request=async(path,options={})=>{
   const response=await fetch(`${URL}/rest/v1/${path}`,{...options,headers:{apikey:SERVICE_KEY,Authorization:`Bearer ${SERVICE_KEY}`,Accept:"application/json",...(options.headers||{})}});
   const raw=await response.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{}
   if(!response.ok)throw Object.assign(new Error(data?.message||"Database request failed."),{status:response.status});
   return data;
  };
  if(req.method==="DELETE"){
   if(!id)return res.status(400).json({error:"ID landing page wajib diisi."});
   await request(`minisites?id=eq.${encodeURIComponent(id)}`,{method:"DELETE",headers:{Prefer:"return=minimal"}});
   return res.status(200).json({success:true});
  }
  if(id){
   const rows=await request(`minisites?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
   if(!rows?.length)return res.status(404).json({error:"Landing page tidak ditemukan."});
   const site=rows[0];
   const [sections,materials,agenda,speakers,pricing]=await Promise.all([
    request(`minisite_sections?select=*&minisite_id=eq.${id}&order=sort_order.asc`),
    request(`minisite_materials?select=*&minisite_id=eq.${id}&order=sort_order.asc`),
    request(`minisite_agenda?select=*&minisite_id=eq.${id}&order=sort_order.asc`),
    request(`minisite_speakers?select=*&minisite_id=eq.${id}&order=sort_order.asc`),
    request(`minisite_pricing?select=*&minisite_id=eq.${id}&order=sort_order.asc`)
   ]);
   return res.status(200).json({item:{site,sections,materials,agenda,speakers,pricing}});
  }
  const data=await request("minisites?select=id,title,slug,status,updated_at,created_at&order=updated_at.desc.nullslast,created_at.desc");
  return res.status(200).json({items:Array.isArray(data)?data:[]});
 }catch(error){console.error("Admin minisites error",error);return res.status(error.status||500).json({error:error.message||"Terjadi kesalahan saat memproses landing page."});}
}