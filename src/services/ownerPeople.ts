import { getSupabaseClient } from '@/lib/supabase';
import { requirePlatformOwner } from './ownerAuthorization';
import { searchOwnerUsers } from './ownerSearch';

export { searchOwnerUsers };

export type OwnerUserAccessInput={userId:string;isAdmin:boolean;role:string;subscriptionTier:string;isBusinessUser:boolean;reason:string};

export async function setOwnerUserAccess(input:OwnerUserAccessInput){
  await requirePlatformOwner();
  const {data,error}=await getSupabaseClient().rpc('admin_set_user_access',{
    p_target_user_id:input.userId,
    p_is_admin:input.isAdmin,
    p_role:input.role,
    p_subscription_tier:input.subscriptionTier,
    p_is_business_user:input.isBusinessUser,
    p_reason:input.reason.trim()||'KleenestOS access update'
  });
  if(error)throw new Error(error.message);
  return data;
}

export async function getOwnerUserCapabilityHistory(userId:string){
  const {data,error}=await getSupabaseClient().from('admin_capability_audit').select('id,admin_user_id,target_user_id,previous_state,new_state,reason,created_at').eq('target_user_id',userId).order('created_at',{ascending:false}).limit(50);
  if(error)throw new Error(error.message);
  return data??[];
}
