import * as ImagePicker from 'expo-image-picker';
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
  creative_mode:'text_only'|'image_text'|'image_only';
  image_url?:string|null;
  image_alt?:string|null;
  logo_url?:string|null;
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
  creativeMode?:'text_only'|'image_text'|'image_only';imageUrl?:string|null;imageAlt?:string|null;logoUrl?:string|null;
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
    p_creative_mode:input.creativeMode??'text_only',
    p_image_url:input.imageUrl??null,
    p_image_alt:input.imageAlt??null,
    p_logo_url:input.logoUrl??null,
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


export type OwnerSponsoredCreativeDraft={uri:string;fileName:string|null;mimeType:string|null;fileSize:number|null;width:number|null;height:number|null};
const MAX_SPONSORED_CREATIVE_BYTES=5*1024*1024;
function extensionForCreative(asset:OwnerSponsoredCreativeDraft){
  const ext=asset.fileName?.split('.').pop()?.toLowerCase();
  if(ext&&['jpg','jpeg','png','webp'].includes(ext))return ext==='jpeg'?'jpg':ext;
  if(asset.mimeType==='image/png')return'png';
  if(asset.mimeType==='image/webp')return'webp';
  return'jpg';
}
export async function chooseOwnerSponsoredCreative():Promise<OwnerSponsoredCreativeDraft|null>{
  const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[16,9],quality:.86});
  if(result.canceled||!result.assets?.length)return null;
  const asset=result.assets[0];
  return {uri:asset.uri,fileName:asset.fileName||null,mimeType:asset.mimeType||null,fileSize:asset.fileSize??null,width:Number.isFinite(asset.width)?asset.width:null,height:Number.isFinite(asset.height)?asset.height:null};
}
export async function uploadOwnerSponsoredCreative(asset:OwnerSponsoredCreativeDraft){
  if(asset.fileSize!=null&&asset.fileSize>MAX_SPONSORED_CREATIVE_BYTES)throw new Error('Sponsored images must be 5 MB or smaller.');
  const response=await fetch(asset.uri);if(!response.ok)throw new Error('The selected sponsored image could not be read.');
  const bytes=await response.arrayBuffer();if(bytes.byteLength>MAX_SPONSORED_CREATIVE_BYTES)throw new Error('Sponsored images must be 5 MB or smaller.');
  const {data:auth,error:authError}=await client().auth.getUser();if(authError)throw authError;if(!auth.user)throw new Error('Sign in to upload sponsored creative.');
  const ext=extensionForCreative(asset);
  const contentType=asset.mimeType||(ext==='png'?'image/png':ext==='webp'?'image/webp':'image/jpeg');
  const path=`owner/${auth.user.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const {error}=await client().storage.from('sponsored-ad-creatives').upload(path,bytes,{contentType,upsert:false});if(error)throw error;
  return client().storage.from('sponsored-ad-creatives').getPublicUrl(path).data.publicUrl;
}
