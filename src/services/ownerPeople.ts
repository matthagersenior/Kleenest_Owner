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

export async function sendOwnerPasswordReset(input:{userId:string;email:string;reason?:string}){
  await requirePlatformOwner();
  const email=input.email.trim().toLowerCase();
  if(!email||!email.includes('@'))throw new Error('A valid account email is required.');
  const client=getSupabaseClient();
  const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:'https://kleenest.us/profile/'});
  if(error)throw new Error(error.message);
  const audit=await client.rpc('admin_record_password_reset_request',{
    p_target_user_id:input.userId,
    p_reason:input.reason?.trim()||'Password reset requested from KleenestOS'
  });
  if(audit.error)throw new Error(audit.error.message);
  return{sent:true,email};
}

export async function getOwnerUserCapabilityHistory(userId:string){
  const {data,error}=await getSupabaseClient().from('admin_capability_audit').select('id,admin_user_id,target_user_id,previous_state,new_state,reason,created_at').eq('target_user_id',userId).order('created_at',{ascending:false}).limit(50);
  if(error)throw new Error(error.message);
  return data??[];
}


export async function getOwnerUserProgressionRewards(userId:string){
  await requirePlatformOwner();
  const {data,error}=await getSupabaseClient().rpc('owner_user_progression_rewards',{p_target_user_id:userId});
  if(error)throw new Error(error.message);
  return Array.isArray(data)?data:[];
}

export async function grantOwnerProgressionReward(userId:string,rewardCode:string,reason:string){
  await requirePlatformOwner();
  const {data,error}=await getSupabaseClient().rpc('owner_grant_progression_reward',{
    p_target_user_id:userId,
    p_reward_code:rewardCode,
    p_reason:reason.trim()||'Owner progression reward grant'
  });
  if(error)throw new Error(error.message);
  return data;
}

export async function revokeOwnerProgressionReward(userId:string,rewardCode:string,reason:string){
  await requirePlatformOwner();
  const {data,error}=await getSupabaseClient().rpc('owner_revoke_progression_reward',{
    p_target_user_id:userId,
    p_reward_code:rewardCode,
    p_reason:reason.trim()||'Owner progression reward revoke'
  });
  if(error)throw new Error(error.message);
  return data;
}
