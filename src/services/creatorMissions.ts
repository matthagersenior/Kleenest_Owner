import { getSupabaseClient } from '@/lib/supabase';
import { requirePlatformOwner } from './ownerAuthorization';

function rows(value:unknown){return Array.isArray(value)?value:[];}

export type OwnerCreatorMission={
  assignment_id:string;
  objective_id:string;
  code:string;
  title:string;
  description:string;
  status:'draft'|'scheduled'|'active'|'paused'|'ended'|'archived';
  starts_at:string|null;
  ends_at:string|null;
  rules:Record<string,unknown>;
  rewards:Record<string,unknown>;
  scope:Record<string,unknown>;
  creator_user_id:string|null;
  creator_name:string;
  creator_handle:string|null;
  creator_slug:string;
  tracking_slug:string;
  campaign_code:string;
  default_channel:string;
  tracking_url:string;
  landing_views:number;
  open_apps:number;
  install_intents:number;
  shares:number;
  created_at:string;
  updated_at:string;
};

export type OwnerCreatorMissionInput={
  assignmentId?:string|null;
  objectiveId?:string|null;
  code:string;
  title:string;
  description:string;
  status:OwnerCreatorMission['status'];
  startsAt:string|null;
  endsAt:string|null;
  action:string;
  target:number;
  xpReward:number;
  audience:string;
  steps:string[];
  cta:string;
  creatorUserId?:string|null;
  creatorName:string;
  creatorHandle:string;
  creatorSlug:string;
  trackingSlug:string;
  campaignCode:string;
  defaultChannel:string;
  reason:string;
};

export async function listOwnerCreatorMissions():Promise<OwnerCreatorMission[]>{
  await requirePlatformOwner();
  const{data,error}=await getSupabaseClient().rpc('owner_creator_mission_list');
  if(error)throw new Error(error.message);
  return rows(data) as OwnerCreatorMission[];
}

export async function saveOwnerCreatorMission(input:OwnerCreatorMissionInput){
  await requirePlatformOwner();
  const{data,error}=await getSupabaseClient().rpc('owner_creator_mission_upsert',{
    p_assignment_id:input.assignmentId??null,
    p_objective_id:input.objectiveId??null,
    p_code:input.code.trim(),
    p_title:input.title.trim(),
    p_description:input.description.trim(),
    p_status:input.status,
    p_starts_at:input.startsAt,
    p_ends_at:input.endsAt,
    p_action:input.action.trim(),
    p_target:input.target,
    p_xp_reward:input.xpReward,
    p_audience:input.audience.trim()||'consumer',
    p_steps:input.steps.map(step=>step.trim()).filter(Boolean),
    p_cta:input.cta.trim(),
    p_creator_user_id:input.creatorUserId??null,
    p_creator_name:input.creatorName.trim(),
    p_creator_handle:input.creatorHandle.trim(),
    p_creator_slug:input.creatorSlug.trim().toLowerCase(),
    p_tracking_slug:input.trackingSlug.trim().toLowerCase(),
    p_campaign_code:input.campaignCode.trim(),
    p_default_channel:input.defaultChannel.trim().toLowerCase()||'social',
    p_reason:input.reason.trim()
  });
  if(error)throw new Error(error.message);
  return data;
}

export async function setOwnerCreatorMissionStatus(assignmentId:string,status:OwnerCreatorMission['status'],reason:string){
  await requirePlatformOwner();
  const{data,error}=await getSupabaseClient().rpc('owner_creator_mission_set_status',{
    p_assignment_id:assignmentId,
    p_status:status,
    p_reason:reason.trim()
  });
  if(error)throw new Error(error.message);
  return data;
}

export async function deleteOwnerCreatorMission(assignmentId:string,reason:string){
  await requirePlatformOwner();
  const{data,error}=await getSupabaseClient().rpc('owner_creator_mission_delete',{
    p_assignment_id:assignmentId,
    p_reason:reason.trim()
  });
  if(error)throw new Error(error.message);
  return Boolean(data);
}
