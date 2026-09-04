import { getSupabaseClient } from '@/lib/supabase';
import { requirePlatformOwner } from './ownerAuthorization';

export async function getOwnerOperationsSnapshot(){
  const client=getSupabaseClient();
  const end=new Date(),start=new Date(end.getTime()-86400000);
  const [overview,integrity,ingestion,push,nativePush,resources,activity]=await Promise.all([
    client.rpc('admin_get_overview'),
    client.rpc('admin_data_integrity_summary'),
    client.rpc('admin_national_ingestion_status'),
    client.rpc('admin_notification_push_delivery_summary',{p_from:start.toISOString(),p_to:end.toISOString()}),
    client.rpc('admin_notification_native_push_delivery_health',{p_from:start.toISOString(),p_to:end.toISOString()}),
    client.rpc('admin_backend_resource_catalog'),
    client.rpc('admin_list_activity_events',{p_limit:100})
  ]);
  for(const result of [overview,integrity,ingestion,push,nativePush,resources,activity])if(result.error)throw new Error(result.error.message);
  return {overview:overview.data,integrity:integrity.data,ingestion:ingestion.data,push:push.data,nativePush:nativePush.data,resources:resources.data,activity:activity.data};
}

export async function setIngestionResumeAuthorization(authorized:boolean){
  await requirePlatformOwner();
  const {data,error}=await getSupabaseClient().rpc('admin_set_national_ingestion_resume_authorization',{p_authorized:authorized});
  if(error)throw new Error(error.message);return data;
}
