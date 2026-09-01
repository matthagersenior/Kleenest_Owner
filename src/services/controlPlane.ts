import { getSupabaseClient } from '@/lib/supabase';

function client(){return getSupabaseClient();}
function unwrap<T>(data:T|null,error:{message:string}|null):T{if(error)throw new Error(error.message);if(data==null)throw new Error('Owner control-plane service returned no data.');return data;}

export async function getSession(){const {data,error}=await client().auth.getSession();if(error)throw error;return data.session;}
export async function getPlatformSnapshot(){const {data,error}=await client().rpc('admin_control_plane_snapshot');return unwrap(data as Record<string,unknown>|null,error);}
export async function getPlatformHistory(limit=50){const {data,error}=await client().rpc('admin_control_plane_history',{p_limit:limit});return unwrap(data as Record<string,unknown>|null,error);}
export async function listPendingBusinesses(){const {data,error}=await client().rpc('admin_list_pending_businesses');return unwrap(data??[],error);}
export async function getBusinessAccess(businessId:string){const {data,error}=await client().rpc('admin_get_business_access',{p_business_id:businessId});return unwrap(data,error);}
export async function setBusinessAccess(input:{businessId:string;tier:string;fleetEnabled:boolean;enterpriseEnabled:boolean;reason:string}){const {data,error}=await client().rpc('admin_set_business_access',{p_business_id:input.businessId,p_tier:input.tier,p_fleet_enabled:input.fleetEnabled,p_enterprise_enabled:input.enterpriseEnabled,p_reason:input.reason});return unwrap(data,error);}
export async function listBusinessMembers(businessId:string){const {data,error}=await client().rpc('admin_list_business_members',{p_business_id:businessId});return unwrap(data,error);}
export async function assignBusinessMember(businessId:string,userId:string,role:string){const {data,error}=await client().rpc('admin_assign_business_member',{p_business_id:businessId,p_user_id:userId,p_role:role});return unwrap(data,error);}
export async function removeBusinessMember(businessId:string,userId:string){const {data,error}=await client().rpc('admin_remove_business_member',{p_business_id:businessId,p_user_id:userId});return unwrap(data,error);}

export async function getCapabilityClassificationSummary(){const {data,error}=await client().rpc('capability_classification_summary');return unwrap(data??[],error);}
export async function getCapabilityRetirementAudit(limit=100){const {data,error}=await client().rpc('capability_retirement_audit',{p_limit:limit});return unwrap(data??[],error);}
export async function getSingleCapabilityDomainIssues(){const {data,error}=await client().rpc('check_single_capability_per_domain');return unwrap(data??[],error);}
export async function getRawSchemaCapabilityAudit(){const {data,error}=await client().rpc('admin_raw_schema_capability_audit');return unwrap(data,error);}
export async function getOperationalCapabilityCatalog(){const {data,error}=await client().rpc('admin_operational_capability_catalog');return unwrap(data,error);}
export async function getCrudCapabilityCatalog(){const {data,error}=await client().rpc('admin_crud_capability_catalog');return unwrap(data,error);}
export async function runCapabilityAudit(source='owner_app'){const {data,error}=await client().rpc('run_capability_audit',{p_source:source});return unwrap(data,error);}

export async function getOwnerControlPlaneBundle(){
 const [snapshot,history,pending,classifications,retirement,domainIssues,raw,operational,crud]=await Promise.all([
  getPlatformSnapshot(),getPlatformHistory(),listPendingBusinesses(),getCapabilityClassificationSummary(),getCapabilityRetirementAudit(),getSingleCapabilityDomainIssues(),getRawSchemaCapabilityAudit(),getOperationalCapabilityCatalog(),getCrudCapabilityCatalog()
 ]);
 return{snapshot,history,pending,classifications,retirement,domainIssues,raw,operational,crud};
}
