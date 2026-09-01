import { useState } from 'react';
import { Pressable,ScrollView,Text,TextInput,View } from 'react-native';
import { getBusinessAccess,setBusinessAccess } from '@/services/controlPlane';

const tiers=['standard','growth','enterprise','fleet'] as const;
export default function AccessConsole(){
 const [businessId,setBusinessId]=useState('');const [access,setAccess]=useState<Record<string,unknown>|null>(null);const [tier,setTier]=useState<(typeof tiers)[number]>('standard');const [fleetEnabled,setFleetEnabled]=useState(false);const [enterpriseEnabled,setEnterpriseEnabled]=useState(false);const [reason,setReason]=useState('Owner control-plane update');const [busy,setBusy]=useState(false);const [error,setError]=useState<string|null>(null);
 async function inspect(){if(!businessId.trim())return;setBusy(true);setError(null);try{const next=await getBusinessAccess(businessId.trim()) as Record<string,unknown>;setAccess(next);const nextTier=String(next.business_tier??next.tier??'standard');if(tiers.includes(nextTier as any))setTier(nextTier as (typeof tiers)[number]);setFleetEnabled(Boolean(next.fleet_enabled));setEnterpriseEnabled(Boolean(next.enterprise_enabled));}catch(c){setError(c instanceof Error?c.message:String(c));}finally{setBusy(false);}}
 async function apply(){if(!businessId.trim())return;setBusy(true);setError(null);try{await setBusinessAccess({businessId:businessId.trim(),tier,fleetEnabled,enterpriseEnabled,reason});await inspect();}catch(c){setError(c instanceof Error?c.message:String(c));setBusy(false);}}
 return <ScrollView contentContainerStyle={{padding:16,gap:14,paddingBottom:50}}>
  <View style={{backgroundColor:'#132b21',borderRadius:20,padding:18,gap:6}}><Text style={{color:'#bde4cf',fontSize:12,fontWeight:'800'}}>OWNER AUTHORITY</Text><Text style={{color:'white',fontSize:24,fontWeight:'800'}}>Product access console</Text><Text style={{color:'#dce8e1',lineHeight:20}}>Inspect and change Business tier, Fleet service and Enterprise capability through the canonical admin RPCs. Backend authorization and audit remain authoritative.</Text></View>
  {error?<View style={{backgroundColor:'#fff0f0',borderRadius:14,padding:12}}><Text style={{color:'#8b2d2d'}}>{error}</Text></View>:null}
  <TextInput value={businessId} onChangeText={setBusinessId} autoCapitalize="none" placeholder="Business UUID" style={{backgroundColor:'white',borderRadius:14,padding:14,fontSize:16}}/>
  <Pressable disabled={busy} onPress={inspect} style={{alignSelf:'flex-start',backgroundColor:'#173f2d',borderRadius:999,paddingHorizontal:15,paddingVertical:10,opacity:busy?0.5:1}}><Text style={{color:'white',fontWeight:'800'}}>{busy?'Working…':'Inspect access'}</Text></Pressable>
  {access?<>
   <View style={{backgroundColor:'white',borderRadius:16,padding:14,gap:8}}><Text style={{fontSize:18,fontWeight:'800'}}>Tier</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{tiers.map(item=><Toggle key={item} label={item} active={tier===item} onPress={()=>setTier(item)}/>)}</View></View>
   <View style={{backgroundColor:'white',borderRadius:16,padding:14,gap:8}}><Text style={{fontSize:18,fontWeight:'800'}}>Capabilities</Text><Toggle label="Fleet enabled" active={fleetEnabled} onPress={()=>setFleetEnabled(v=>!v)}/><Toggle label="Enterprise enabled" active={enterpriseEnabled} onPress={()=>setEnterpriseEnabled(v=>!v)}/></View>
   <TextInput value={reason} onChangeText={setReason} placeholder="Audit reason" style={{backgroundColor:'white',borderRadius:14,padding:14}}/>
   <Pressable disabled={busy} onPress={apply} style={{alignSelf:'flex-start',backgroundColor:'#173f2d',borderRadius:999,paddingHorizontal:15,paddingVertical:10,opacity:busy?0.5:1}}><Text style={{color:'white',fontWeight:'800'}}>Apply authoritative access</Text></Pressable>
   <View style={{backgroundColor:'white',borderRadius:16,padding:14,gap:6}}><Text style={{fontSize:17,fontWeight:'800'}}>Current server state</Text><Text selectable style={{color:'#607168',lineHeight:19}}>{JSON.stringify(access,null,2)}</Text></View>
  </>:null}
 </ScrollView>;
}
function Toggle({label,active,onPress}:{label:string;active:boolean;onPress:()=>void}){return <Pressable onPress={onPress} style={{borderRadius:999,paddingHorizontal:13,paddingVertical:9,backgroundColor:active?'#173f2d':'#eef2ef'}}><Text style={{fontWeight:'800',color:active?'white':'#33463c'}}>{label}</Text></Pressable>}
