import { getSupabaseClient } from '@/lib/supabase';

export type OwnerProgressionPlatformSnapshot={
 users_with_xp:number;xp_awarded:number;discoveries:number;on_site_discoveries:number;discovery_photos:number;active_objectives:number;
 objective_kinds:Record<string,number>;
 awards_by_action:Array<{action:string;events:number;xp:number}>;
 recent_discoveries:Array<{location_id:string;method:string;tier:number;state:string;created_at:string}>;
};
export async function getOwnerProgressionPlatformSnapshot():Promise<OwnerProgressionPlatformSnapshot>{const{data,error}=await getSupabaseClient().rpc('owner_progression_platform_snapshot');if(error)throw new Error(error.message);return(data||{users_with_xp:0,xp_awarded:0,discoveries:0,on_site_discoveries:0,discovery_photos:0,active_objectives:0,objective_kinds:{},awards_by_action:[],recent_discoveries:[]}) as OwnerProgressionPlatformSnapshot;}
