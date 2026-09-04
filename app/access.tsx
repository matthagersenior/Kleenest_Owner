import { useEffect,useState } from 'react';
import { ActivityIndicator,Pressable,ScrollView,Text,TextInput,View } from 'react-native';
import { ActionSheetCard,EntityRow,OSHero,PrimaryAction,SectionHeader,StatusPill,osCard,osColors } from '@/components/KleenestOS';
import { getOwnerAuthorization,type OwnerAuthorization } from '@/services/ownerAuthorization';
import { searchOwnerUsers,setOwnerUserAccess } from '@/services/ownerPeople';

const roles=['customer','business','admin'];
const tiers=['free','premium','family','fleet','enterprise'];

export default function AccessConsole(){
 const[authorization,setAuthorization]=useState<OwnerAuthorization|null>(null),[query,setQuery]=useState(''),[rows,setRows]=useState<any[]>([]),[selected,setSelected]=useState<any|null>(null),[role,setRole]=useState('customer'),[tier,setTier]=useState('free'),[isAdmin,setIsAdmin]=useState(false),[isBusinessUser,setIsBusinessUser]=useState(false),[reason,setReason]=useState('KleenestOS access update'),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[message,setMessage]=useState<string|null>(null);
 useEffect(()=>{getOwnerAuthorization().then(setAuthorization).catch(c=>setError(c instanceof Error?c.message:String(c)))},[]);
 async function search(){setBusy(true);setError(null);try{setRows(await searchOwnerUsers(query));}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}}
 function choose(user:any){setSelected(user);setRole(String(user.role??'customer'));setTier(String(user.subscription_tier??'free'));setIsAdmin(Boolean(user.is_admin));setIsBusinessUser(Boolean(user.is_business_user));setMessage(null)}
 async function save(){if(!selected)return;setBusy(true);setError(null);setMessage(null);try{await setOwnerUserAccess({userId:String(selected.id),role,subscriptionTier:tier,isAdmin,isBusinessUser,reason});const refreshed=await searchOwnerUsers(String(selected.email??selected.username??selected.id));const next=refreshed.find((x:any)=>String(x.id)===String(selected.id))??selected;choose(next);setRows(refreshed);setMessage('Authoritative account access updated and audited.')}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}}
 const canMutate=Boolean(authorization?.is_platform_owner);
 return <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:16,gap:16,paddingBottom:60}}>
  <OSHero eyebrow="KLEENESTOS · PEOPLE & ACCESS" title="People & Access" body="Search real accounts first, inspect their authority, then make audited platform-owner changes." >{authorization?<StatusPill label={authorization.is_platform_owner?'PLATFORM OWNER':'ADMIN READ-ONLY'} tone={authorization.is_platform_owner?'good':'warning'}/>:null}</OSHero>
  {error?<Text style={{color:osColors.danger,fontWeight:'800'}}>{error}</Text>:null}{message?<Text style={{color:osColors.good,fontWeight:'800'}}>{message}</Text>:null}
  <ActionSheetCard title="Find an account" body="Search display name, username, email or paste a UUID as an advanced fallback."><View style={{flexDirection:'row',gap:8}}><TextInput value={query} onChangeText={setQuery} onSubmitEditing={search} placeholder="Name, username, email or UUID" autoCapitalize="none" style={input}/><PrimaryAction label={busy?'…':'Search'} onPress={search} disabled={busy||!query.trim()}/></View></ActionSheetCard>
  {busy&&!rows.length?<ActivityIndicator/>:null}
  <View style={{gap:9}}><SectionHeader title="Accounts" body={`${rows.length} matching account${rows.length===1?'':'s'}`}/>{rows.map(user=><EntityRow key={String(user.id)} title={String(user.display_name??user.username??user.email??'Unnamed account')} subtitle={String(user.email??user.username??'')} meta={`${String(user.role??'customer')} · ${String(user.subscription_tier??'free')}`} onPress={()=>choose(user)}><View style={{flexDirection:'row',gap:6,flexWrap:'wrap'}}>{user.is_admin?<StatusPill label="ADMIN" tone="warning"/>:null}{user.is_business_user?<StatusPill label="BUSINESS"/>:null}</View></EntityRow>)}</View>
  {selected?<ActionSheetCard title={`Control ${String(selected.display_name??selected.username??selected.email??'account')}`} body={canMutate?'These controls call canonical platform-owner RPC authority and are audited.':'This session can inspect accounts but platform-owner authority is required to mutate them.'}>
    <Text style={label}>Role</Text><View style={chips}>{roles.map(value=><Chip key={value} label={value} active={role===value} onPress={()=>setRole(value)}/>)}</View>
    <Text style={label}>Subscription tier</Text><View style={chips}>{tiers.map(value=><Chip key={value} label={value} active={tier===value} onPress={()=>setTier(value)}/>)}</View>
    <View style={chips}><Chip label="Admin" active={isAdmin} onPress={()=>setIsAdmin(v=>!v)}/><Chip label="Business user" active={isBusinessUser} onPress={()=>setIsBusinessUser(v=>!v)}/></View>
    <Text style={label}>Audit reason</Text><TextInput value={reason} onChangeText={setReason} style={input}/>
    <PrimaryAction label={busy?'Applying…':'Apply authoritative access'} onPress={save} disabled={!canMutate||busy||!reason.trim()}/>
  </ActionSheetCard>:null}
 </ScrollView>
}

const input={flex:1,backgroundColor:'white',borderRadius:12,paddingHorizontal:12,paddingVertical:11,borderWidth:1,borderColor:osColors.border,color:osColors.ink} as const;
const label={fontWeight:'900',color:osColors.ink,fontSize:12} as const;
const chips={flexDirection:'row',flexWrap:'wrap',gap:7} as const;
function Chip({label,active,onPress}:{label:string;active:boolean;onPress:()=>void}){return <Pressable onPress={onPress} style={{borderRadius:999,paddingHorizontal:10,paddingVertical:8,backgroundColor:active?osColors.green:'#eef2ef'}}><Text style={{fontWeight:'900',color:active?'white':osColors.muted,textTransform:'capitalize'}}>{label}</Text></Pressable>}
