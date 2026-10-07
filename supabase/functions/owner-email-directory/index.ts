import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
function namedKey(plural:string,legacy:string){
  try{const parsed=JSON.parse(Deno.env.get(plural)??"{}");if(parsed?.default)return String(parsed.default)}catch{}
  return Deno.env.get(legacy)??"";
}
const SUPABASE_PUBLISHABLE_KEY=namedKey("SUPABASE_PUBLISHABLE_KEYS","SUPABASE_ANON_KEY");
const SUPABASE_SECRET_KEY=namedKey("SUPABASE_SECRET_KEYS","SUPABASE_SERVICE_ROLE_KEY");

function json(body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{
    "content-type":"application/json; charset=utf-8","cache-control":"no-store",
    "access-control-allow-origin":"*","access-control-allow-headers":"authorization,apikey,content-type,x-client-info",
    "access-control-allow-methods":"POST,OPTIONS",
  }});
}
function adminClient(){
  if(!SUPABASE_SECRET_KEY)throw new Error("Supabase server credential is unavailable.");
  return createClient(SUPABASE_URL,SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}
async function authorize(req:Request){
  const authorizationHeader=req.headers.get("authorization")||"";
  if(!authorizationHeader.startsWith("Bearer "))throw Object.assign(new Error("Owner sign-in is required."),{status:401});
  const jwt=authorizationHeader.slice("Bearer ".length).trim();
  const client=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
    auth:{persistSession:false,autoRefreshToken:false},
    global:{headers:{Authorization:`Bearer ${jwt}`}},
  });
  const[{data:userData,error:userError},{data,error}]=await Promise.all([
    client.auth.getUser(jwt),client.rpc("admin_authorization_v1"),
  ]);
  if(userError||!userData.user)throw Object.assign(new Error("Owner sign-in is required."),{status:401});
  if(error)throw Object.assign(new Error(error.message),{status:403});
  const authorization=(data&&typeof data==="object"?data:{}) as Record<string,unknown>;
  if(!authorization.authorized&&!authorization.is_admin&&!authorization.is_platform_owner){
    throw Object.assign(new Error("Owner/admin authority is required for email access."),{status:403});
  }
  return{userId:userData.user.id,authorization};
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return json({ok:true});
  if(req.method!=="POST")return json({error:"POST required."},405);
  try{
    const{userId,authorization}=await authorize(req);
    const body=await req.json().catch(()=>({}));
    if(String(body?.action||"")!=="list_mailboxes")return json({error:"Unsupported email directory action."},400);

    const admin=adminClient();
    const[mailboxesResult,membershipResult]=await Promise.all([
      admin.from("owner_email_mailboxes")
        .select("id,address,display_name,mailbox_type,send_enabled,active,owner_user_id")
        .eq("active",true).neq("mailbox_type","system")
        .order("mailbox_type",{ascending:true}).order("address",{ascending:true}),
      admin.from("owner_email_mailbox_members")
        .select("mailbox_id,access_role,can_send").eq("user_id",userId),
    ]);
    if(mailboxesResult.error)throw mailboxesResult.error;
    if(membershipResult.error)throw membershipResult.error;

    const memberships=new Map((membershipResult.data||[]).map((row:any)=>[String(row.mailbox_id),row]));
    const platformOwner=Boolean(authorization.is_platform_owner);
    const isAdmin=Boolean(authorization.authorized||authorization.is_admin||authorization.is_platform_owner);

    const mailboxes=(mailboxesResult.data||[])
      .filter((mailbox:any)=>{
        const owns=String(mailbox.owner_user_id||"")===userId;
        const member=memberships.has(String(mailbox.id));
        if(mailbox.mailbox_type==="personal")return platformOwner||owns||member;
        return isAdmin||member;
      })
      .map((mailbox:any)=>{
        const member:any=memberships.get(String(mailbox.id));
        const owns=String(mailbox.owner_user_id||"")===userId;
        const canSend=Boolean(mailbox.send_enabled)&&(platformOwner||owns||Boolean(member?.can_send)||(isAdmin&&mailbox.mailbox_type!=="personal"));
        return{
          id:String(mailbox.id),address:String(mailbox.address||"").toLowerCase(),
          display_name:String(mailbox.display_name||mailbox.address||"Kleenest"),
          mailbox_type:String(mailbox.mailbox_type||"shared"),
          send_enabled:canSend,active:Boolean(mailbox.active),
        };
      });
    return json({mailboxes,isAdmin});
  }catch(error:any){
    return json({error:String(error?.message||error||"Email directory request failed.")},Number(error?.status)||500);
  }
});
