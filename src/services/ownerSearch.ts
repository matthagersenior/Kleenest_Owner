import { getSupabaseClient } from '@/lib/supabase';

function asRows(data:unknown):any[]{if(Array.isArray(data))return data; if(data&&typeof data==='object'){const value=data as Record<string,unknown>;for(const key of ['items','rows','users','results'])if(Array.isArray(value[key]))return value[key] as any[];}return [];}

export async function searchOwnerUsers(query:string){
  const q=query.trim();
  if(!q)return [];
  const {data,error}=await getSupabaseClient().rpc('admin_user_search',{p_query:q});
  if(error)throw new Error(error.message);
  return asRows(data);
}

export async function searchOwnerBusinesses(query:string){
  const q=query.trim();
  if(!q)return [];
  const client=getSupabaseClient();
  let request=client.from('businesses').select('id,name,business_tier,verification_status,email,phone,website,updated_at').order('name').limit(30);
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(q);
  request=uuid?request.eq('id',q):request.ilike('name',`%${q.replace(/[%_]/g,'')}%`);
  const {data,error}=await request;
  if(error)throw new Error(error.message);
  return data??[];
}
