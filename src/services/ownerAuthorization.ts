import { getSupabaseClient } from '@/lib/supabase';

export type OwnerAuthorization={authorized:boolean;role:string|null;is_admin:boolean;is_platform_owner:boolean;tier:'platform_owner'|'admin'|'none'};

export async function getOwnerAuthorization():Promise<OwnerAuthorization>{
  const {data,error}=await getSupabaseClient().rpc('admin_authorization_v1');
  if(error)throw new Error(error.message);
  const value=(data??{}) as Record<string,unknown>;
  const isPlatformOwner=Boolean(value.is_platform_owner);
  const isAdmin=Boolean(value.is_admin);
  const authorized=Boolean(value.authorized)||isPlatformOwner||isAdmin;
  return {authorized,role:typeof value.role==='string'?value.role:null,is_admin:isAdmin,is_platform_owner:isPlatformOwner,tier:isPlatformOwner?'platform_owner':isAdmin?'admin':'none'};
}

export async function requirePlatformOwner(){
  const authorization=await getOwnerAuthorization();
  if(!authorization.is_platform_owner)throw new Error('Platform owner authority is required for this command.');
  return authorization;
}
