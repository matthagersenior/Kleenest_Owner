import { getSupabaseClient } from '@/lib/supabase';

export type OwnerEmailCadence='immediate'|'hourly'|'daily'|'weekly';
export type OwnerEmailSeverity='info'|'warning'|'critical';

export type OwnerEmailSettings={
  owner_user_id:string;enabled:boolean;recipient_email:string|null;timezone:string;
  daily_digest_hour:number;weekly_digest_dow:number;weekly_digest_hour:number;
  max_immediate_per_hour:number;created_at:string;updated_at:string;
};

export type OwnerEmailRule={
  id:string;owner_user_id:string;code:string;name:string;description:string|null;
  source_key:string;category:string;enabled:boolean;cadence:OwnerEmailCadence;
  severity_floor:OwnerEmailSeverity;noteworthy_immediate:boolean;
  dedupe_window_minutes:number;max_per_digest:number;created_at:string;updated_at:string;
};

export type OwnerEmailEvent={
  id:string;source_key:string;category:string;severity:OwnerEmailSeverity;noteworthy:boolean;
  title:string;reason:string;body:string|null;occurrences:number;effective_cadence:OwnerEmailCadence;
  delivery_after:string;status:string;sent_at:string|null;last_error:string|null;created_at:string;
};

export type OwnerEmailDelivery={
  id:string;recipient_email:string;cadence:string;subject:string;status:string;provider_id:string|null;
  error:string|null;created_at:string;sent_at:string|null;event_ids:string[];
};

export type OwnerEmailSnapshot={
  settings:OwnerEmailSettings;
  rules:OwnerEmailRule[];
  recent_events:OwnerEmailEvent[];
  recent_deliveries:OwnerEmailDelivery[];
  queue:{queued:number;failed:number;sent_24h:number};
  generated_at:string;
};

function client(){return getSupabaseClient();}
function unwrap<T>(data:T|null,error:{message:string}|null):T{if(error)throw new Error(error.message);if(data==null)throw new Error('Owner email notification service returned no data.');return data;}

async function authHeaders(){
  const {data,error}=await client().auth.getSession();
  if(error)throw error;
  if(!data.session?.access_token)throw new Error('Platform Owner authentication required.');
  return {Authorization:`Bearer ${data.session.access_token}`};
}

export async function getOwnerEmailNotificationSnapshot(limit=50){
  const {data,error}=await client().rpc('owner_email_notification_snapshot',{p_limit:limit});
  return unwrap(data as OwnerEmailSnapshot|null,error);
}

export async function updateOwnerEmailNotificationSettings(input:Partial<Pick<OwnerEmailSettings,
  'enabled'|'recipient_email'|'timezone'|'daily_digest_hour'|'weekly_digest_dow'|'weekly_digest_hour'|'max_immediate_per_hour'
>>,reason='Updated in Owner Email Notification Center'){
  const {data,error}=await client().rpc('owner_update_email_notification_settings',{p_settings:input,p_reason:reason});
  return unwrap(data as OwnerEmailSettings|null,error);
}

export async function saveOwnerEmailNotificationRule(rule:Partial<OwnerEmailRule>&Pick<OwnerEmailRule,'code'|'name'|'source_key'|'category'|'cadence'|'severity_floor'>,reason='Updated in Owner Email Notification Center'){
  const payload={
    ...rule,
    description:rule.description??'',
    enabled:rule.enabled??true,
    noteworthy_immediate:rule.noteworthy_immediate??true,
    dedupe_window_minutes:rule.dedupe_window_minutes??360,
    max_per_digest:rule.max_per_digest??50
  };
  const {data,error}=await client().rpc('owner_upsert_email_notification_rule',{p_rule:payload,p_reason:reason});
  return unwrap(data as OwnerEmailRule|null,error);
}

export async function deleteOwnerEmailNotificationRule(id:string,reason='Deleted in Owner Email Notification Center'){
  const {data,error}=await client().rpc('owner_delete_email_notification_rule',{p_rule_id:id,p_reason:reason});
  if(error)throw new Error(error.message);
  return Boolean(data);
}

export async function getOwnerEmailProviderStatus(){
  const headers=await authHeaders();
  const {data,error}=await client().functions.invoke('owner-email-notifications',{body:{mode:'status'},headers});
  if(error)throw error;
  if(data?.error)throw new Error(String(data.error));
  return data as {provider_configured:boolean;from_address:string;snapshot:OwnerEmailSnapshot};
}

export async function configureOwnerEmailProvider(apiKey:string,fromAddress:string){
  const {data,error}=await client().rpc('owner_configure_email_provider',{
    p_api_key:apiKey.trim(),p_from_address:fromAddress.trim()||null,p_reason:'Configured in Owner Email Notification Center'
  });
  if(error)throw new Error(error.message);
  return data as {provider:string;configured:boolean;from_address:string};
}

export async function sendOwnerEmailTest(){
  const headers=await authHeaders();
  const {data,error}=await client().functions.invoke('owner-email-notifications',{body:{mode:'test'},headers});
  if(error){
    const context=(error as any)?.context;
    if(context?.json)try{const detail=await context.json();if(detail?.error)throw new Error(String(detail.error));}catch(cause){if(cause instanceof Error)throw cause;}
    throw error;
  }
  if(data?.error)throw new Error(String(data.error));
  return data as {provider_configured:boolean;event_id:string;result?:unknown};
}
