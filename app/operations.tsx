import { useCallback,useEffect,useState } from 'react';
import { ActivityIndicator,RefreshControl,ScrollView,Text,View } from 'react-native';
import { ActionSheetCard,DiagnosticDisclosure,HealthCard,OSHero,PrimaryAction,SectionHeader,StatusPill,osColors } from '@/components/KleenestOS';
import { getOwnerOperationsSnapshot,setIngestionResumeAuthorization } from '@/services/ownerOperations';
import { useOwnerTheme } from '@/services/theme';

type Ops=Awaited<ReturnType<typeof getOwnerOperationsSnapshot>>;
function count(v:unknown){return Array.isArray(v)?v.length:v&&typeof v==='object'?Object.keys(v as object).length:0;}
function object(v:unknown){return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};}
function storageGuardSummary(value:unknown){if(value==null)return'see diagnostics';if(typeof value!=='object')return String(value);const row=object(value);const parts=[typeof row.status==='string'?row.status:null,row.may_ingest===false?'PAUSED':row.may_ingest===true?'READY':null,Number.isFinite(Number(row.used_fraction))?`${Math.round(Number(row.used_fraction)*100)}% used`:null,Number.isFinite(Number(row.usage_fraction))?`${Math.round(Number(row.usage_fraction)*100)}% used`:null].filter(Boolean);return parts.length?parts.join(' · '):'configured';}

export default function Operations(){
 const theme=useOwnerTheme();
 const[data,setData]=useState<Ops|null>(null),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[busy,setBusy]=useState(false),[armed,setArmed]=useState(false),[error,setError]=useState<string|null>(null),[message,setMessage]=useState<string|null>(null);
 const load=useCallback(async()=>{setError(null);setData(await getOwnerOperationsSnapshot())},[]);
 useEffect(()=>{load().catch(c=>setError(c instanceof Error?c.message:String(c))).finally(()=>setLoading(false))},[load]);
 async function refresh(){setRefreshing(true);try{await load()}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setRefreshing(false)}}
 async function resume(){if(!armed){setArmed(true);return}setBusy(true);setError(null);setMessage(null);try{await setIngestionResumeAuthorization(true);await load();setMessage('National ingestion resume authorization applied by platform-owner authority.');setArmed(false)}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}}
 if(loading)return <View style={{flex:1,justifyContent:'center',backgroundColor:theme.canvas}}><ActivityIndicator size="large" color={theme.accent}/></View>;
 const ingestion=object(data?.ingestion);const paused=Boolean(ingestion.paused);const overview=object(data?.overview);const integrity=object(data?.integrity);
 return <ScrollView style={{backgroundColor:theme.canvas}} contentInsetAdjustmentBehavior="automatic" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[theme.accent]} tintColor={theme.accent}/>} contentContainerStyle={{padding:16,gap:16,paddingBottom:64,backgroundColor:theme.canvas}}>
  <OSHero eyebrow="KLEENESTOS · OPERATIONS" title="Operations" body="Operate ingestion, data integrity, delivery health and backend resources from canonical admin authorities."/>
  {error?<Text style={{color:osColors.danger,fontWeight:'800'}}>{error}</Text>:null}{message?<Text style={{color:osColors.good,fontWeight:'800'}}>{message}</Text>:null}
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}><HealthCard label="Ingestion" value={paused?'PAUSED':'RUNNING'} tone={paused?'warning':'good'} detail={String(ingestion.pause_reason??ingestion.status??'National ingestion state')}/><HealthCard label="Integrity" value={count(integrity)} detail="Live integrity summary fields"/><HealthCard label="Activity" value={count(data?.activity)} detail="Recent platform events"/><HealthCard label="Resources" value={count(data?.resources)} detail="Backend catalog entries"/></View>
  <ActionSheetCard title="National ingestion control" body="Resume authorization is an owner-only operational command. The second press is the confirmation boundary."><StatusPill label={paused?'PAUSED':'RUNNING'} tone={paused?'warning':'good'}/><Text style={{color:osColors.muted,lineHeight:19}}>Storage guard: {storageGuardSummary(ingestion.storage_status??ingestion.storage_guard)}</Text>{paused?<PrimaryAction label={busy?'Applying…':armed?'CONFIRM RESUME AUTHORIZATION':'Authorize ingestion resume'} onPress={resume} disabled={busy}/>:<Text style={{color:osColors.good,fontWeight:'800'}}>No resume command is needed while ingestion is running.</Text>}{armed?<Text style={{color:osColors.warning,fontWeight:'800'}}>Confirming will clear the paused guard through `admin_set_national_ingestion_resume_authorization`.</Text>:null}</ActionSheetCard>
  <View style={{gap:9}}><SectionHeader title="Platform health" body="Authoritative overview and integrity signals."/><DiagnosticDisclosure title="system overview diagnostics" value={overview}/><DiagnosticDisclosure title="data integrity diagnostics" value={integrity}/></View>
  <View style={{gap:9}}><SectionHeader title="Delivery health" body="Web/native notification delivery in the last 24 hours."/><DiagnosticDisclosure title="push delivery diagnostics" value={data?.push}/><DiagnosticDisclosure title="native push diagnostics" value={data?.nativePush}/></View>
  <View style={{gap:9}}><SectionHeader title="Backend resources" body="Canonical resource and recent activity diagnostics."/><DiagnosticDisclosure title="backend resource catalog" value={data?.resources}/><DiagnosticDisclosure title="recent platform activity" value={data?.activity}/></View>
 </ScrollView>
}
