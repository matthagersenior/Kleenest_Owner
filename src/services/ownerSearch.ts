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
  const {data,error}=await getSupabaseClient().rpc('admin_business_search',{p_query:q});
  if(error)throw new Error(error.message);
  return asRows(data);
}
