import { Link } from 'expo-router';
import { useCallback,useEffect,useState } from 'react';
import { ActivityIndicator,Pressable,RefreshControl,ScrollView,Text,View } from 'react-native';
import { DiagnosticDisclosure,HealthCard,OSHero,SectionHeader,StatusPill,osCard,osColors } from '@/components/KleenestOS';
import { getOwnerAuthorization,type OwnerAuthorization } from '@/services/ownerAuthorization';
import { getOwnerEconomySnapshot } from '@/services/ownerEconomy';
import { getOwnerModerationQueues } from '@/services/ownerModeration';
import { getOwnerOperationsSnapshot } from '@/services/ownerOperations';
import { getPlatformHistory } from '@/services/controlPlane';

type State={authorization:OwnerAuthorization|null;economy:any|null;moderation:any|null;operations:any|null;history:any|null};
const empty:State={authorization:null,economy:null,moderation:null,operations:null,history:null};
const routes=[
 ['/access','People & Access','Search users and control roles, subscriptions and admin authority.'],
 ['/businesses','Businesses & Network','Search businesses, memberships, locations and Fleet/Enterprise entitlements.'],
 ['/progression','Economy','Operate XP issuance, evidence tiers, levels, objectives and reward policy.'],
 ['/moderation','Trust & Moderation','Resolve reports and pending trust queues.'],
 ['/operations','Operations','Control ingestion and inspect integrity, delivery and backend health.'],
 ['/audit','System Audit','Run capability and activity audits.'],
 ['/capabilities','System Capabilities','Inspect the canonical capability registry and retirement state.'],
 ['/data','System Data Workbench','Use the audited CRUD gateway for advanced platform data work.']
] as const;
function object(value:unknown){return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};}

export default function KleenestOSCommandCenter(){
 const[state,setState]=useState<State>(empty),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[errors,setErrors]=useState<string[]>([]);
 const load=useCallback(async()=>{
  const authorization=await getOwnerAuthorization();
  if(!authorization.authorized)throw new Error('KleenestOS authorization required.');
  const settled=await Promise.allSettled([getOwnerEconomySnapshot(),getOwnerModerationQueues(),getOwnerOperationsSnapshot(),getPlatformHistory(25)]);
  const nextErrors:string[]=[];const value=(index:number)=>{const result=settled[index];if(result.status==='fulfilled')return result.value;nextErrors.push(result.reason instanceof Error?result.reason.message:String(result.reason));return null};
  setState({authorization,economy:value(0),moderation:value(1),operations:value(2),history:value(3)});setErrors(nextErrors);
 },[]);
 useEffect(()=>{load().catch(c=>setErrors([c instanceof Error?c.message:String(c)])).finally(()=>setLoading(false))},[load]);
 async function refresh(){setRefreshing(true);try{await load()}finally{setRefreshing(false)}}
 if(loading)return <View style={{flex:1,justifyContent:'center'}}><ActivityIndicator size="large"/></View>;
 const ingestion=object(state.operations?.ingestion);const paused=Boolean(ingestion.paused);const reviewCount=state.moderation?.reviewReports?.length??0;const pendingBusinessCount=state.moderation?.pendingBusinesses?.length??0;const anomalyCount=state.economy?.anomalyCandidates?.length??0;
 return <ScrollView contentInsetAdjustmentBehavior="automatic" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh}/>} contentContainerStyle={{padding:16,gap:16,paddingBottom:64}}>
  <OSHero eyebrow="KLEENESTOS · PRIVATE PLATFORM OPERATING SYSTEM" title="COMMAND CENTER" body="What is happening, what needs attention, and what you can do about it across the Kleenest economy.">{state.authorization?<StatusPill label={state.authorization.is_platform_owner?'PLATFORM OWNER · FULL CONTROL':'ADMIN · RESTRICTED CONTROL'} tone={state.authorization.is_platform_owner?'good':'warning'}/>:null}</OSHero>
  {errors.map((message,index)=><View key={`${message}-${index}`} style={{...osCard,borderColor:'#e8bbbb',backgroundColor:'#fff6f6'}}><Text style={{color:osColors.danger,fontWeight:'900'}}>Subsystem degraded</Text><Text style={{color:osColors.danger}}>{message}</Text></View>)}
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>
   <HealthCard label="Ingestion" value={paused?'PAUSED':'RUNNING'} tone={paused?'warning':'good'} detail={paused?String(ingestion.pause_reason??'Requires owner review'):'National ingestion active'} />
   <HealthCard label="Moderation" value={reviewCount} tone={reviewCount?'warning':'good'} detail="Pending review reports" />
   <HealthCard label="Businesses" value={pendingBusinessCount} tone={pendingBusinessCount?'warning':'good'} detail="Pending administration" />
   <HealthCard label="Economy alerts" value={anomalyCount} tone={anomalyCount?'warning':'good'} detail="High-velocity XP candidates" />
  </View>
  <View style={{...osCard,backgroundColor:osColors.ink,gap:8}}><Text style={{color:'#bde4cf',fontWeight:'900',letterSpacing:1,fontSize:10}}>ECONOMY PULSE</Text><Text style={{color:'white',fontSize:22,fontWeight:'900'}}>{Number(state.economy?.xpLast24h??0).toLocaleString()} XP issued in the last 24 hours</Text><Text style={{color:'#dce8e1'}}>{Number(state.economy?.discoveries??0).toLocaleString()} canonical discoveries · {Number(state.economy?.onSiteDiscoveries??0).toLocaleString()} on-site live · {Number(state.economy?.activeObjectives??0).toLocaleString()} active objectives</Text><Link href="/progression" asChild><Pressable style={{alignSelf:'flex-start',backgroundColor:'#d9efe1',borderRadius:999,paddingHorizontal:12,paddingVertical:9}}><Text style={{fontWeight:'900',color:osColors.ink}}>Open Economy →</Text></Pressable></Link></View>
  <View style={{gap:9}}><SectionHeader title="Operating domains" body="Primary KleenestOS control surfaces. System diagnostics stay secondary."/>{routes.map(([href,title,body],index)=><Link key={href} href={href} asChild><Pressable style={{...osCard,backgroundColor:index<5?'white':'#f7f9f8'}}><View style={{flexDirection:'row',justifyContent:'space-between',gap:10}}><View style={{flex:1,gap:4}}><Text style={{fontSize:17,fontWeight:'900',color:osColors.ink}}>{title}</Text><Text style={{color:osColors.muted,lineHeight:19}}>{body}</Text></View><Text style={{fontSize:22,color:osColors.green}}>›</Text></View></Pressable></Link>)}</View>
  <View style={{gap:9}}><SectionHeader title="Recent control-plane activity" body="Audited platform changes and administrative history."/><DiagnosticDisclosure title="control-plane history" value={state.history}/></View>
 </ScrollView>
}
