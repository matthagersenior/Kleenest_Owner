import { getSupabaseClient } from '@/lib/supabase';
import { requirePlatformOwner } from './ownerAuthorization';
import { searchOwnerBusinesses } from './ownerSearch';

export { searchOwnerBusinesses };

export async function getOwnerBusinessDetail(businessId:string){
  const client=getSupabaseClient();
  const [access,members,locations]=await Promise.all([
    client.rpc('admin_get_business_access',{p_business_id:businessId}),
    client.rpc('admin_list_business_members',{p_business_id:businessId}),
    client.from('locations').select('id,name,address,city,state,verification_status,business_id,claimed_business_id').or(`business_id.eq.${businessId},claimed_business_id.eq.${businessId}`).order('name').limit(200)
  ]);
  for(const result of [access,members,locations])if(result.error)throw new Error(result.error.message);
  return {access:access.data,members:Array.isArray(members.data)?members.data:[],locations:locations.data??[]};
}

export async function setOwnerBusinessAccess(input:{businessId:string;tier:string;fleetEnabled:boolean;enterpriseEnabled:boolean;reason:string}){
  await requirePlatformOwner();
  const {data,error}=await getSupabaseClient().rpc('admin_set_business_access',{
    p_business_id:input.businessId,p_tier:input.tier,p_fleet_enabled:input.fleetEnabled,p_enterprise_enabled:input.enterpriseEnabled,p_reason:input.reason.trim()||'KleenestOS business access update'
  });
  if(error)throw new Error(error.message);
  return data;
}

export async function assignOwnerBusinessMember(businessId:string,userId:string,role:string){
  await requirePlatformOwner();
  const {data,error}=await getSupabaseClient().rpc('admin_assign_business_member',{p_business_id:businessId,p_user_id:userId,p_role:role});
  if(error)throw new Error(error.message);return data;
}

export async function removeOwnerBusinessMember(businessId:string,userId:string){
  await requirePlatformOwner();
  const {data,error}=await getSupabaseClient().rpc('admin_remove_business_member',{p_business_id:businessId,p_user_id:userId});
  if(error)throw new Error(error.message);return data;
}
