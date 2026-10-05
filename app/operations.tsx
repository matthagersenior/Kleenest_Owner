import { useCallback,useEffect,useState } from 'react';
import { ActivityIndicator,RefreshControl,ScrollView,Text,View } from 'react-native';
import { DiagnosticDisclosure,HealthCard,OSHero,SectionHeader,osColors } from '@/components/KleenestOS';
import { getOwnerOperationsSnapshot } from '@/services/ownerOperations';
import { useOwnerTheme } from '@/services/theme';

type Ops=Awaited<ReturnType<typeof getOwnerOperationsSnapshot>>;
function count(v:unknown){return Array.isArray(v)?v.length:v&&typeof v==='object'?Object.keys(v as object).length:0;}
function object(v:unknown){return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};}

export default function Operations(){
 const theme=useOwnerTheme();
 const[data,setData]=useState<Ops|null>(null),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[error,setError]=useState<string|null>(null);
 const load=useCallback(async()=>{setError(null);setData(await getOwnerOperationsSnapshot())},[]);
 useEffect(()=>{load().catch(c=>setError(c instanceof Error?c.message:String(c))).finally(()=>setLoading(false))},[load]);
 async function refresh(){setRefreshing(true);try{await load()}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setRefreshing(false)}}
 if(loading)return <View style={{flex:1,justifyContent:'center',backgroundColor:theme.canvas}}><ActivityIndicator size="large" color={theme.accent}/></View>;
 const overview=object(data?.overview);const integrity=object(data?.integrity);
 return <ScrollView style={{backgroundColor:theme.canvas}} contentInsetAdjustmentBehavior="automatic" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[theme.accent]} tintColor={theme.accent}/>} contentContainerStyle={{padding:16,gap:16,paddingBottom:64,backgroundColor:theme.canvas}}>
  <OSHero eyebrow="KLEENESTOS · PLATFORM HEALTH" title="Platform Health" body="Monitor integrity, delivery, backend resources and recent platform activity. Interactive Discovery is the canonical acquisition path; operational ingestion controls now live in the dedicated Ingestion Control center."/>
  {error?<Text style={{color:osColors.danger,fontWeight:'800'}}>{error}</Text>:null}
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}><HealthCard label="Integrity" value={count(integrity)} detail="Live integrity summary fields"/><HealthCard label="Activity" value={count(data?.activity)} detail="Recent platform events"/><HealthCard label="Resources" value={count(data?.resources)} detail="Backend catalog entries"/></View>
  <View style={{gap:9}}><SectionHeader title="Platform health" body="Authoritative overview and integrity signals."/><DiagnosticDisclosure title="system overview diagnostics" value={overview}/><DiagnosticDisclosure title="data integrity diagnostics" value={integrity}/></View>
  <View style={{gap:9}}><SectionHeader title="Delivery health" body="Web/native notification delivery in the last 24 hours."/><DiagnosticDisclosure title="push delivery diagnostics" value={data?.push}/><DiagnosticDisclosure title="native push diagnostics" value={data?.nativePush}/></View>
  <View style={{gap:9}}><SectionHeader title="Backend resources" body="Canonical resource and recent activity diagnostics."/><DiagnosticDisclosure title="backend resource catalog" value={data?.resources}/><DiagnosticDisclosure title="recent platform activity" value={data?.activity}/></View>
 </ScrollView>
}
