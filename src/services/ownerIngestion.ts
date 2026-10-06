import { getSupabaseClient } from '@/lib/supabase';

function unwrap<T>(data:T|null,error:{message:string}|null):T{
  if(error) throw new Error(error.message);
  if(data==null) throw new Error('Owner ingestion control returned no data.');
  return data;
}

export async function getOwnerIngestionControl(limit=80){
  const {data,error}=await getSupabaseClient().rpc('owner_ingestion_control_snapshot',{p_limit:Math.min(Math.max(limit,1),200)});
  return unwrap(data as Record<string,unknown>|null,error);
}

export async function setGlobalIngestionPaused(paused:boolean){
  const {data,error}=await getSupabaseClient().rpc('owner_set_ingestion_global_pause',{
    p_paused:paused,
    p_reason:paused?'Paused from KleenestOS Ingestion Control':'Resumed from KleenestOS Ingestion Control',
  });
  return unwrap(data,error);
}

export async function runBoundedIngestionCycle(){
  const {data,error}=await getSupabaseClient().rpc('owner_run_ingestion_cycle',{
    p_reason:'Manual bounded cycle from KleenestOS Ingestion Control',
  });
  return unwrap(data,error);
}

export async function repairStalledIngestion(){
  const {data,error}=await getSupabaseClient().rpc('owner_repair_ingestion_cells',{
    p_reason:'Repair requested from KleenestOS Ingestion Control',
  });
  return unwrap(data,error);
}

export async function setIngestionSourceEnabled(sourceKey:string,enabled:boolean){
  const {data,error}=await getSupabaseClient().rpc('owner_update_ingestion_source_policy',{
    p_source_key:sourceKey,
    p_patch:{enabled},
    p_reason:`${enabled?'Enabled':'Paused'} ${sourceKey} from KleenestOS Ingestion Control`,
  });
  return unwrap(data,error);
}

export async function setCoverageMarketEnabled(input:{marketId:string;priority:number;enabled:boolean;name?:string}){
  const {data,error}=await getSupabaseClient().rpc('owner_update_ingestion_market',{
    p_market_id:input.marketId,
    p_priority:input.priority,
    p_enabled:input.enabled,
    p_reason:`${input.enabled?'Enabled':'Paused'} coverage priority${input.name?' for '+input.name:''} from KleenestOS Ingestion Control`,
  });
  return unwrap(data,error);
}


export async function setIdleDemandIngestionEnabled(enabled:boolean){
  const {data,error}=await getSupabaseClient().rpc('owner_update_ingestion_capacity_policy',{
    p_patch:{idle_demand_enabled:enabled},
    p_reason:`${enabled?'Enabled':'Disabled'} idle-demand acceleration from KleenestOS Ingestion Control`,
  });
  return unwrap(data,error);
}

export async function updateTileIngestionPolicy(patch:{tile_step_degrees?:number;max_tile_subdivision_level?:number;max_parallel_tiles?:number;canonical_batch_size?:number;major_markets_enabled?:boolean}){
  const {data,error}=await getSupabaseClient().rpc('owner_update_ingestion_capacity_policy',{
    p_patch:patch,
    p_reason:'Updated bounded tile ingestion policy from KleenestOS Ingestion Control',
  });
  return unwrap(data,error);
}
