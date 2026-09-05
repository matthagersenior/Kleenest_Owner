import { getSupabaseClient } from '@/lib/supabase';
import { getOwnerAuthorization } from './ownerAuthorization';

function rows(value:unknown):any[]{if(Array.isArray(value))return value;if(value&&typeof value==='object'){const v=value as Record<string,unknown>;for(const key of ['items','reports','rows','results'])if(Array.isArray(v[key]))return v[key] as any[];}return [];}
async function requireOwner(){const authorization=await getOwnerAuthorization();if(!authorization.authorized)throw new Error('Owner administration authority required.');return authorization;}

export async function getOwnerModerationQueues(){
  await requireOwner();
  const client=getSupabaseClient();
  const [reviewReports,userReports,aiReports,pendingBusinesses]=await Promise.all([
    client.rpc('admin_list_review_reports',{p_status:'pending'}),
    client.rpc('admin_list_user_safety_reports',{p_status:'open'}),
    client.rpc('admin_list_ai_response_reports',{p_status:'open'}),
    client.rpc('admin_list_pending_businesses')
  ]);
  if(reviewReports.error)throw new Error(reviewReports.error.message);
  if(userReports.error)throw new Error(userReports.error.message);
  if(aiReports.error)throw new Error(aiReports.error.message);
  if(pendingBusinesses.error)throw new Error(pendingBusinesses.error.message);
  return {reviewReports:rows(reviewReports.data),userReports:rows(userReports.data),aiReports:rows(aiReports.data),pendingBusinesses:rows(pendingBusinesses.data)};
}

export async function resolveOwnerReviewReport(input:{reportId:string;resolution:'dismiss'|'hide'|'restore';reason:string;reviewStatus?:string|null}){
  const authorization=await requireOwner();
  if(!authorization.is_admin&&!authorization.is_platform_owner)throw new Error('Administrator authority required.');
  const {data,error}=await getSupabaseClient().rpc('admin_resolve_review_report',{
    p_report_id:input.reportId,p_resolution:input.resolution,p_reason:input.reason.trim(),p_review_status:input.reviewStatus??null
  });
  if(error)throw new Error(error.message);return data;
}

export async function resolveOwnerUserSafetyReport(input:{reportId:string;status:'reviewing'|'resolved'|'dismissed'}){
  await requireOwner();
  const{data,error}=await getSupabaseClient().rpc('admin_resolve_user_safety_report',{p_report_id:input.reportId,p_status:input.status});
  if(error)throw new Error(error.message);return data;
}

export async function resolveOwnerAiResponseReport(input:{reportId:string;status:'reviewing'|'resolved'|'dismissed';resolution?:string}){
  await requireOwner();
  const{data,error}=await getSupabaseClient().rpc('admin_resolve_ai_response_report',{p_report_id:input.reportId,p_status:input.status,p_resolution:input.resolution?.trim()||null});
  if(error)throw new Error(error.message);return data;
}
