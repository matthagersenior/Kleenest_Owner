import { Link } from 'expo-router';
import { useEffect,useMemo,useState } from 'react';
import { ActivityIndicator,Pressable,ScrollView,Text,TextInput,View } from 'react-native';
import { OSHero,SectionHeader,StatusPill,osCard,osColors } from '@/components/KleenestOS';
import { searchOwnerBusinesses,searchOwnerUsers } from '@/services/ownerSearch';

type SearchTarget = {
  href:string;
  title:string;
  description:string;
  keywords:string[];
  section:string;
};

const targets:SearchTarget[]=[
  {href:'/email-notifications',title:'Email Notifications',description:'Owner operational email, immediate alerts, digests, audit cadence, dedupe, delivery history and test sends.',keywords:['email','notification','notifications','alerts','digest','weekly','audit email','resend','delivery'],section:'Owner controls'},
  {href:'/operations',title:'Operations',description:'Ingestion, storage guard, delivery health, scheduler, integrity and backend operations.',keywords:['operations','ingestion','storage','push','firebase','scheduler','cron','health','integrity'],section:'Owner controls'},
  {href:'/access',title:'People & Access',description:'Search users and control roles, subscriptions and owner/admin authority.',keywords:['people','user','users','access','role','roles','admin','owner','subscription'],section:'Owner controls'},
  {href:'/businesses',title:'Businesses & Network',description:'Manage businesses, memberships, locations and Fleet/Enterprise entitlements.',keywords:['business','businesses','network','location','locations','fleet','enterprise','membership'],section:'Owner controls'},
  {href:'/progression',title:'Economy & Progression',description:'XP, evidence tiers, levels, objectives, rewards, themes and progression policy.',keywords:['progression','xp','reward','rewards','theme','themes','badge','badges','level','economy','objective'],section:'Owner controls'},
  {href:'/creator-missions',title:'Creator Missions',description:'Creator assignments, mission activation, tracking links and mission QR codes.',keywords:['creator','creators','mission','missions','tracking','qr','campaign'],section:'Owner controls'},
  {href:'/moderation',title:'Trust & Moderation',description:'Reports, pending trust queues and safety review.',keywords:['moderation','trust','report','reports','safety','review'],section:'Owner controls'},
  {href:'/reports',title:'Reporting',description:'Build and inspect platform reporting.',keywords:['reporting','reports','metrics','analytics'],section:'Governance'},
  {href:'/audit',title:'System Audit',description:'Capability and owner activity audits.',keywords:['audit','audits','governance','activity'],section:'Governance'},
  {href:'/capabilities',title:'System Capabilities',description:'Canonical capability registry and retirement state.',keywords:['capability','capabilities','registry','retirement'],section:'Governance'},
  {href:'/intelligence',title:'Intelligence Lab',description:'Platform intelligence, recommendations and advanced operating signals.',keywords:['intelligence','recommendation','signals','ai'],section:'Governance'},
  {href:'/data',title:'System Data Workbench',description:'Audited CRUD gateway for advanced platform data work.',keywords:['data','crud','database','workbench'],section:'Governance'},
];

function textValue(row:any,keys:string[]){
  for(const key of keys){
    const value=row?.[key];
    if(value!==null&&value!==undefined&&String(value).trim())return String(value).trim();
  }
  return '';
}

function ResultLink({href,title,description,meta}:{href:string;title:string;description:string;meta?:string}){
  return <Link href={href as any} asChild>
    <Pressable style={{...osCard,gap:4}}>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10}}>
        <View style={{flex:1,gap:3}}>
          <Text style={{fontSize:17,fontWeight:'900',color:osColors.ink}}>{title}</Text>
          {meta?<Text style={{fontSize:11,fontWeight:'900',letterSpacing:.5,color:osColors.green,textTransform:'uppercase'}}>{meta}</Text>:null}
          <Text style={{color:osColors.muted,lineHeight:19}}>{description}</Text>
        </View>
        <Text style={{fontSize:22,color:osColors.green}}>›</Text>
      </View>
    </Pressable>
  </Link>;
}

export default function OwnerSearch(){
  const[query,setQuery]=useState('');
  const[users,setUsers]=useState<any[]>([]);
  const[businesses,setBusinesses]=useState<any[]>([]);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState<string|null>(null);
  const q=query.trim().toLowerCase();

  const local=useMemo(()=>{
    if(!q)return targets;
    return targets.filter(item=>[item.title,item.description,...item.keywords].join(' ').toLowerCase().includes(q));
  },[q]);

  useEffect(()=>{
    let active=true;
    if(q.length<2){setUsers([]);setBusinesses([]);setLoading(false);setError(null);return;}
    setLoading(true);setError(null);
    const timer=setTimeout(async()=>{
      const results=await Promise.allSettled([searchOwnerUsers(query),searchOwnerBusinesses(query)]);
      if(!active)return;
      const nextErrors:string[]=[];
      if(results[0].status==='fulfilled')setUsers(results[0].value.slice(0,20));else nextErrors.push(results[0].reason instanceof Error?results[0].reason.message:String(results[0].reason));
      if(results[1].status==='fulfilled')setBusinesses(results[1].value.slice(0,20));else nextErrors.push(results[1].reason instanceof Error?results[1].reason.message:String(results[1].reason));
      setError(nextErrors.length?nextErrors.join(' · '):null);
      setLoading(false);
    },250);
    return()=>{active=false;clearTimeout(timer);};
  },[q,query]);

  const hasAny=local.length||users.length||businesses.length;

  return <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:16,gap:16,paddingBottom:64}}>
    <OSHero eyebrow="KLEENESTOS · UNIVERSAL SEARCH" title="Search" body="Find controls, settings, people, businesses and the Owner tools that act on them." />
    <TextInput
      autoFocus
      value={query}
      onChangeText={setQuery}
      placeholder="Search KleenestOS…"
      placeholderTextColor={osColors.muted}
      style={{backgroundColor:'white',borderWidth:1,borderColor:osColors.border,borderRadius:16,paddingHorizontal:14,paddingVertical:13,fontSize:18,color:osColors.ink}}
      autoCapitalize="none"
      autoCorrect={false}
      returnKeyType="search"
    />
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>
      <StatusPill label="screens & controls" />
      <StatusPill label="people" />
      <StatusPill label="businesses" />
      <StatusPill label="settings & operations" />
    </View>

    {loading?<View style={{paddingVertical:8}}><ActivityIndicator/></View>:null}
    {error?<View style={{...osCard,borderColor:'#efd9a5',backgroundColor:'#fffaf0'}}><Text style={{fontWeight:'900',color:osColors.warning}}>Some live results are unavailable</Text><Text style={{color:osColors.muted}}>{error}</Text></View>:null}

    {local.length?<View style={{gap:9}}>
      <SectionHeader title={q?'Controls & screens':'Browse KleenestOS'} body={q?'Matching Owner destinations and capabilities.':'Start typing, or open any Owner control directly.'}/>
      {local.map(item=><ResultLink key={item.href} href={item.href} title={item.title} description={item.description} meta={item.section}/>)}
    </View>:null}

    {users.length?<View style={{gap:9}}>
      <SectionHeader title="People" body="Live user matches. Open People & Access to act on the account."/>
      {users.map((row,index)=>{
        const title=textValue(row,['display_name','name','kleenest_name','email'])||'User';
        const detail=[textValue(row,['email']),textValue(row,['username','kleenest_name']),textValue(row,['role'])].filter(Boolean).join(' · ')||'User record';
        return <ResultLink key={String(row?.id??row?.user_id??index)} href="/access" title={title} description={detail} meta="People & Access"/>;
      })}
    </View>:null}

    {businesses.length?<View style={{gap:9}}>
      <SectionHeader title="Businesses" body="Live business/network matches. Open Businesses & Network to manage the record."/>
      {businesses.map((row,index)=>{
        const title=textValue(row,['name','business_name','legal_name'])||'Business';
        const detail=[textValue(row,['address','street_address']),textValue(row,['city']),textValue(row,['status'])].filter(Boolean).join(' · ')||'Business record';
        return <ResultLink key={String(row?.id??row?.business_id??index)} href="/businesses" title={title} description={detail} meta="Businesses & Network"/>;
      })}
    </View>:null}

    {q&&!loading&&!hasAny?<View style={{...osCard,gap:4}}>
      <Text style={{fontWeight:'900',color:osColors.ink}}>No matches yet</Text>
      <Text style={{color:osColors.muted}}>Try a feature name, person, business, setting, alert type, reward, audit, or operational term.</Text>
    </View>:null}
  </ScrollView>;
}
