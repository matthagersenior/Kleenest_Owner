import { getSupabaseClient } from '@/lib/supabase';
import { requirePlatformOwner } from './ownerAuthorization';

function rows(value:unknown){return Array.isArray(value)?value:[];}
function object(value:unknown){return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};}

export type OwnerProgressionObjective={
  id:string;kind:'quest'|'mission'|'challenge'|'journey'|'campaign'|'contest';code:string;title:string;description:string;status:string;
  starts_at:string|null;ends_at:string|null;rules:Record<string,unknown>;rewards:Record<string,unknown>;scope:Record<string,unknown>;created_at:string;
  participants:number;completed:number;
};
export type OwnerProgressionSupplyStatus={
  active_by_kind:Record<string,number>;scheduled_by_kind:Record<string,number>;expiring_72h:Array<Record<string,unknown>>;
  templates:Array<Record<string,unknown>>;last_run:Record<string,unknown>|null;
};

export async function getOwnerEconomySnapshot(){
  await requirePlatformOwner();
  const client=getSupabaseClient();
  const [snapshot,catalog]=await Promise.all([
    client.rpc('owner_progression_platform_snapshot'),
    client.rpc('owner_progression_xp_action_catalog')
  ]);
  if(snapshot.error)throw new Error(snapshot.error.message);
  if(catalog.error)throw new Error(catalog.error.message);
  const s=object(snapshot.data);
  return {
    usersWithXp:Number(s.users_with_xp??0),
    xpAwarded:Number(s.xp_awarded??0),
    xpLast24h:Number(s.xp_last_24h??0),
    xpPrev24h:Number(s.xp_prev_24h??0),
    discoveries:Number(s.discoveries??0),
    onSiteDiscoveries:Number(s.on_site_discoveries??0),
    discoveryPhotos:Number(s.discovery_photos??0),
    activeObjectives:Number(s.active_objectives??0),
    objectiveKinds:object(s.objective_kinds),
    evidenceTiers:rows(s.evidence_tiers),
    awardsByAction:rows(s.awards_by_action),
    levelDistribution:rows(s.level_distribution),
    specialtyLevels:rows(s.specialty_levels),
    recentHighValueEvents:rows(s.recent_high_value_events),
    anomalyCandidates:rows(s.anomaly_candidates),
    recentDiscoveries:rows(s.recent_discoveries),
    xpActionCatalog:rows(catalog.data)
  };
}

export async function updateOwnerXpAction(input:{action:string;baseXp:number;cooldownSeconds:number;maxPerDay:number|null;enabled:boolean;reason:string}){
  await requirePlatformOwner();
  const {data,error}=await getSupabaseClient().rpc('owner_update_progression_xp_action',{
    p_action:input.action,p_base_xp:input.baseXp,p_cooldown_seconds:input.cooldownSeconds,p_max_per_day:input.maxPerDay,p_enabled:input.enabled,p_reason:input.reason.trim()
  });
  if(error)throw new Error(error.message);
  return data;
}

export async function listOwnerProgressionObjectives():Promise<OwnerProgressionObjective[]>{
  await requirePlatformOwner();
  const {data,error}=await getSupabaseClient().rpc('owner_progression_objective_list');
  if(error)throw new Error(error.message);
  return (Array.isArray(data)?data:[]) as OwnerProgressionObjective[];
}

export async function saveOwnerProgressionObjective(input:{
  id?:string|null;kind:OwnerProgressionObjective['kind'];code:string;title:string;description:string;status:string;
  startsAt:string|null;endsAt:string|null;action:string;target:number;xpReward:number;audience?:string|null;reason:string;
}){
  await requirePlatformOwner();
  const scope=input.audience?.trim()?{audience:input.audience.trim()}:{};
  const {data,error}=await getSupabaseClient().rpc('owner_progression_objective_upsert',{
    p_id:input.id??null,p_kind:input.kind,p_code:input.code.trim(),p_title:input.title.trim(),p_description:input.description.trim(),p_status:input.status,
    p_starts_at:input.startsAt,p_ends_at:input.endsAt,p_rules:{action:input.action.trim(),target:input.target},p_rewards:{xp:input.xpReward},p_scope:scope,p_reason:input.reason.trim()
  });
  if(error)throw new Error(error.message);
  return data as OwnerProgressionObjective;
}

export async function setOwnerProgressionObjectiveStatus(id:string,status:string,reason:string){
  await requirePlatformOwner();
  const {data,error}=await getSupabaseClient().rpc('owner_progression_objective_set_status',{p_id:id,p_status:status,p_reason:reason.trim()});
  if(error)throw new Error(error.message);
  return data as OwnerProgressionObjective;
}

export async function deleteOwnerProgressionObjective(id:string,reason:string){
  await requirePlatformOwner();
  const {data,error}=await getSupabaseClient().rpc('owner_progression_objective_delete',{p_id:id,p_reason:reason.trim()});
  if(error)throw new Error(error.message);
  return Boolean(data);
}

export async function getOwnerProgressionSupplyStatus():Promise<OwnerProgressionSupplyStatus>{
  await requirePlatformOwner();
  const {data,error}=await getSupabaseClient().rpc('owner_progression_supply_status');
  if(error)throw new Error(error.message);
  const value=object(data);
  return {
    active_by_kind:object(value.active_by_kind) as Record<string,number>,
    scheduled_by_kind:object(value.scheduled_by_kind) as Record<string,number>,
    expiring_72h:rows(value.expiring_72h) as Array<Record<string,unknown>>,
    templates:rows(value.templates) as Array<Record<string,unknown>>,
    last_run:value.last_run&&typeof value.last_run==='object'&&!Array.isArray(value.last_run)?value.last_run as Record<string,unknown>:null
  };
}

export async function maintainOwnerProgressionSupply(){
  await requirePlatformOwner();
  const {data,error}=await getSupabaseClient().rpc('owner_maintain_progression_supply');
  if(error)throw new Error(error.message);
  return data;
}
