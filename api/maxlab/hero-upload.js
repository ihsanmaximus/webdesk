import { isAdminAuthorized } from "../admin/auth.js";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
function json(res,status,body){res.setHeader("Content-Type","application/json; charset=utf-8");res.setHeader("Cache-Control","no-store");return res.status(status).json(body);}
export default async function handler(req,res){
 if(req.method!=="POST"){res.setHeader("Allow","POST");return json(res,405,{error:"Method not allowed."});}
 if(!isAdminAuthorized(req))return json(res,401,{error:"Sesi admin tidak valid. Silakan login kembali."});
 if(!SUPABASE_URL||!SERVICE_KEY)return json(res,503,{error:"Konfigurasi Supabase belum lengkap."});
 try{
  const body=typeof req.body==="string"?JSON.parse(req.body||"{}"):(req.body||{});
  const mime=String(body.mimeType||"");
  const allowed={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
  if(!allowed[mime])return json(res,400,{error:"Format gambar harus JPG, PNG, atau WebP."});
  const encoded=String(body.data||"");
  if(!encoded||encoded.length>14*1024*1024)return json(res,400,{error:"Ukuran gambar maksimal 10 MB."});
  const bytes=Buffer.from(encoded,"base64");
  if(!bytes.length||bytes.length>10*1024*1024)return json(res,400,{error:"Ukuran gambar maksimal 10 MB."});
  const section=String(body.section||"hero");
  if(!["hero","about"].includes(section))return json(res,400,{error:"Section upload tidak valid."});
  const path=`maxlab/${section}/${section==="hero"?"background":"image"}-${Date.now()}.${allowed[mime]}`;
  const response=await fetch(`${SUPABASE_URL}/storage/v1/object/minisite-assets/${path}`,{method:"POST",headers:{apikey:SERVICE_KEY,Authorization:`Bearer ${SERVICE_KEY}`,"Content-Type":mime,"x-upsert":"false"},body:bytes});
  const raw=await response.text();let result={};try{result=raw?JSON.parse(raw):{};}catch{}
  if(!response.ok)throw new Error(result.message||result.error||"Supabase Storage menolak upload.");
  return json(res,200,{success:true,path,publicUrl:`${SUPABASE_URL}/storage/v1/object/public/minisite-assets/${path}`});
 }catch(error){console.error("MaxLab Hero upload error",error);return json(res,500,{error:error.message||"Upload gagal."});}
}