import { getSupabaseClient } from '@/lib/supabase';
import { requirePlatformOwner } from './ownerAuthorization';

function rows(value:unknown){return Array.isArray(value)?value:[];}
function object(value:unknown){return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};}

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
