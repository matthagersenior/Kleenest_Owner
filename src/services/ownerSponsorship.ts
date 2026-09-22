import { getSupabaseClient } from '@/lib/supabase';

const client=()=>getSupabaseClient();
async function rpc(name:string,args:Record<string,unknown>={}){
  const {data,error}=await client().rpc(name,args);
  if(error)throw new Error(error.message);
  return data;
}

export type OwnerAdPlacement={
  placement_code:string;
  surface:string;
  slot:string;
  active:boolean;
  owner_enabled:boolean;
  priority:number;
  frequency_cap_daily:number;
  format:string;
  context_rules:Record<string,unknown>;
};

export type OwnerSponsoredCampaign={
  id:string;
  business_id?:string|null;
  business_name?:string|null;
  name:string;
  sponsor_name:string;
  headline:string;
  body?:string|null;
  cta_label:string;
  destination_url:string;
  target_location_id?:string|null;
  status:'draft'|'active'|'paused'|'ended';
  submission_status:'owner_managed'|'draft'|'submitted'|'approved'|'rejected'|'withdrawn';
  review_note?:string|null;
  starts_at?:string|null;
  ends_at?:string|null;
  targeting:Record<string,unknown>;
  frequency_cap_daily:number;
  impression_cap_total?:number|null;
  owner_priority:number;
  placements:string[];
  impressions:number;
  clicks:number;
  dismissals:number;
};

export type OwnerSponsorshipSnapshot={
  sponsored_serving_enabled:boolean;
  pending_review_count:number;
  placements:OwnerAdPlacement[];
  campaigns:OwnerSponsoredCampaign[];
  rules:Record<string,unknown>;
};

export async function getOwnerSponsorshipSnapshot(){
  return await rpc('owner_relevance_sponsorship_snapshot') as OwnerSponsorshipSnapshot;
}

export function setOwnerSponsoredServing(enabled:boolean,reason:string){
  return rpc('owner_set_sponsorship_enabled',{p_enabled:enabled,p_reason:reason});
}

export function saveOwnerAdPlacement(input:{
  placementCode:string;surface:string;slot:string;active:boolean;priority:number;
  frequencyCapDaily:number;format:string;contextRules:Record<string,unknown>;ownerEnabled:boolean;reason:string;
}){
  return rpc('owner_upsert_ad_placement',{
    p_placement_code:input.placementCode,
    p_surface:input.surface,
    p_slot:input.slot,
    p_active:input.active,
    p_priority:input.priority,
    p_frequency_cap_daily:input.frequencyCapDaily,
    p_format:input.format,
    p_context_rules:input.contextRules,
    p_owner_enabled:input.ownerEnabled,
    p_reason:input.reason,
  });
}

export function saveOwnerSponsoredCampaign(input:{
  id?:string|null;name:string;sponsorName:string;headline:string;body?:string;ctaLabel?:string;
  destinationUrl:string;targetLocationId?:string|null;status:'draft'|'active'|'paused'|'ended';
  startsAt?:string|null;endsAt?:string|null;targeting:Record<string,unknown>;
  frequencyCapDaily:number;impressionCapTotal?:number|null;ownerPriority:number;placementCodes:string[];reason:string;
}){
  return rpc('owner_upsert_sponsored_campaign',{
    p_campaign_id:input.id??null,
    p_name:input.name,
    p_sponsor_name:input.sponsorName,
    p_headline:input.headline,
    p_body:input.body??'',
    p_cta_label:input.ctaLabel??'Learn more',
    p_destination_url:input.destinationUrl,
    p_target_location_id:input.targetLocationId??null,
    p_status:input.status,
    p_starts_at:input.startsAt??null,
    p_ends_at:input.endsAt??null,
    p_targeting:input.targeting,
    p_frequency_cap_daily:input.frequencyCapDaily,
    p_impression_cap_total:input.impressionCapTotal??null,
    p_owner_priority:input.ownerPriority,
    p_placement_codes:input.placementCodes,
    p_reason:input.reason,
  });
}

export function reviewOwnerSponsoredCampaign(campaignId:string,decision:'approve'|'reject',reviewNote:string,reason:string){
  return rpc('owner_review_sponsored_campaign',{
    p_campaign_id:campaignId,p_decision:decision,p_review_note:reviewNote,p_reason:reason,
  });
}

export function archiveOwnerSponsoredCampaign(campaignId:string,reason:string){
  return rpc('owner_archive_sponsored_campaign',{p_campaign_id:campaignId,p_reason:reason});
}
