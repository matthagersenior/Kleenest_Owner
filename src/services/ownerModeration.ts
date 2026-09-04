import { getSupabaseClient } from '@/lib/supabase';
import { getOwnerAuthorization } from './ownerAuthorization';

function rows(value:unknown):any[]{if(Array.isArray(value))return value;if(value&&typeof value==='object'){const v=value as Record<string,unknown>;for(const key of ['items','reports','rows','results'])if(Array.isArray(v[key]))return v[key] as any[];}return [];}

export async function getOwnerModerationQueues(){
  const authorization=await getOwnerAuthorization();
  if(!authorization.authorized)throw new Error('Owner administration authority required.');
  const client=getSupabaseClient();
  const [reviewReports,pendingBusinesses]=await Promise.all([
    client.rpc('admin_list_review_reports',{p_status:'pending'}),
    client.rpc('admin_list_pending_businesses')
  ]);
  if(reviewReports.error)throw new Error(reviewReports.error.message);
  if(pendingBusinesses.error)throw new Error(pendingBusinesses.error.message);
  return {reviewReports:rows(reviewReports.data),pendingBusinesses:rows(pendingBusinesses.data)};
}

export async function resolveOwnerReviewReport(input:{reportId:string;resolution:'dismiss'|'hide'|'restore';reason:string;reviewStatus?:string|null}){
  const authorization=await getOwnerAuthorization();
  if(!authorization.is_admin&&!authorization.is_platform_owner)throw new Error('Administrator authority required.');
  const {data,error}=await getSupabaseClient().rpc('admin_resolve_review_report',{
    p_report_id:input.reportId,p_resolution:input.resolution,p_reason:input.reason.trim(),p_review_status:input.reviewStatus??null
  });
  if(error)throw new Error(error.message);return data;
}
