// Admin-only list endpoint for saved landing pages.
const URL=process.env.SUPABASE_URL;
const SERVICE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_TOKEN=process.env.WEBDESK_ADMIN_TOKEN;
export default async function handler(req,res){
 res.setHeader("Content-Type","application/json; charset=utf-8");
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({error:"Method not allowed"});}
 if(!URL||!SERVICE_KEY||!ADMIN_TOKEN)return res.status(503).json({error:"Konfigurasi database/admin belum lengkap."});
 if(String(req.headers.authorization||"").replace(/^Bearer\s+/i,"")!==ADMIN_TOKEN)return res.status(401).json({error:"Token admin tidak valid."});
 try{
  const response=await fetch(`${URL}/rest/v1/minisites?select=id,title,slug,status,updated_at,created_at&order=updated_at.desc.nullslast,created_at.desc`,{headers:{apikey:SERVICE_KEY,Authorization:`Bearer ${SERVICE_KEY}`,Accept:"application/json"}});
  const raw=await response.text();let data=[];try{data=raw?JSON.parse(raw):[]}catch{}
  if(!response.ok)return res.status(response.status).json({error:data?.message||"Gagal memuat daftar landing page."});
  return res.status(200).json({items:Array.isArray(data)?data:[]});
 }catch(error){console.error("List minisites error",error);return res.status(500).json({error:"Terjadi kesalahan saat memuat landing page."});}
}