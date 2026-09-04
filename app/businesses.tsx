import { useEffect,useState } from 'react';
import { ActivityIndicator,Pressable,ScrollView,Text,TextInput,View } from 'react-native';
import { ActionSheetCard,EntityRow,OSHero,PrimaryAction,SectionHeader,StatusPill,osColors } from '@/components/KleenestOS';
import { getOwnerAuthorization,type OwnerAuthorization } from '@/services/ownerAuthorization';
import { assignOwnerBusinessMember,getOwnerBusinessDetail,removeOwnerBusinessMember,searchOwnerBusinesses,setOwnerBusinessAccess } from '@/services/ownerBusinesses';
import { searchOwnerUsers } from '@/services/ownerPeople';

const tiers=['standard','growth','fleet','enterprise'];
const memberRoles=['owner','admin','manager','analyst','marketing','staff'];
function asObject(value:unknown){return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};}

export default function BusinessesConsole(){
 const[authorization,setAuthorization]=useState<OwnerAuthorization|null>(null),[query,setQuery]=useState(''),[rows,setRows]=useState<any[]>([]),[selected,setSelected]=useState<any|null>(null),[detail,setDetail]=useState<any|null>(null),[tier,setTier]=useState('standard'),[fleet,setFleet]=useState(false),[enterprise,setEnterprise]=useState(false),[reason,setReason]=useState('KleenestOS business access update'),[memberQuery,setMemberQuery]=useState(''),[people,setPeople]=useState<any[]>([]),[memberRole,setMemberRole]=useState('staff'),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[message,setMessage]=useState<string|null>(null);
 useEffect(()=>{getOwnerAuthorization().then(setAuthorization).catch(c=>setError(c instanceof Error?c.message:String(c)))},[]);
 async function search(){setBusy(true);setError(null);try{setRows(await searchOwnerBusinesses(query))}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}}
 async function choose(row:any){setSelected(row);setBusy(true);setError(null);try{const next=await getOwnerBusinessDetail(String(row.id));setDetail(next);const access=asObject(next.access);setTier(String(access.business_tier??row.business_tier??'standard'));setFleet(Boolean(access.fleet_enabled));setEnterprise(Boolean(access.enterprise_enabled));}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}}
 async function saveAccess(){if(!selected)return;setBusy(true);setError(null);setMessage(null);try{await setOwnerBusinessAccess({businessId:String(selected.id),tier,fleetEnabled:fleet,enterpriseEnabled:enterprise,reason});await choose(selected);setMessage('Business access changed through canonical owner authority.')}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}}
 async function searchPeople(){setBusy(true);setError(null);try{setPeople(await searchOwnerUsers(memberQuery))}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}}
 async function assign(user:any){if(!selected)return;setBusy(true);setError(null);try{await assignOwnerBusinessMember(String(selected.id),String(user.id),memberRole);await choose(selected);setPeople([]);setMemberQuery('');setMessage('Business membership updated.')}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}}
 async function remove(userId:string){if(!selected)return;setBusy(true);setError(null);try{await removeOwnerBusinessMember(String(selected.id),userId);await choose(selected);setMessage('Business membership removed.')}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}}
 const canMutate=Boolean(authorization?.is_platform_owner);
 return <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:16,gap:16,paddingBottom:60}}>
  <OSHero eyebrow="KLEENESTOS · BUSINESSES & NETWORK" title="Businesses & Network" body="Find a business by name, inspect its canonical network and control the entitlements that unlock Business, Fleet and Enterprise." >{authorization?<StatusPill label={authorization.is_platform_owner?'PLATFORM OWNER':'ADMIN READ-ONLY'} tone={authorization.is_platform_owner?'good':'warning'}/>:null}</OSHero>
  {error?<Text style={{color:osColors.danger,fontWeight:'800'}}>{error}</Text>:null}{message?<Text style={{color:osColors.good,fontWeight:'800'}}>{message}</Text>:null}
  <ActionSheetCard title="Find a business"><View style={{flexDirection:'row',gap:8}}><TextInput value={query} onChangeText={setQuery} onSubmitEditing={search} placeholder="Business name or UUID" style={input}/><PrimaryAction label={busy?'…':'Search'} onPress={search} disabled={busy||!query.trim()}/></View></ActionSheetCard>
  <View style={{gap:9}}><SectionHeader title="Businesses" body={`${rows.length} result${rows.length===1?'':'s'}`}/>{rows.map(row=><EntityRow key={String(row.id)} title={String(row.name??'Unnamed business')} subtitle={`${String(row.business_tier??'standard')} · ${String(row.verification_status??'unverified')}`} meta={`${Number(row.location_count??0)} locations · ${Number(row.member_count??0)} members`} onPress={()=>choose(row)}/>)}</View>
  {busy&&selected&&!detail?<ActivityIndicator/>:null}
  {selected&&detail?<>
   <ActionSheetCard title={`${String(selected.name)} access`} body={canMutate?'Server-authoritative entitlements. Fleet and Enterprise are not local switches.':'Platform-owner authority is required to change entitlements.'}>
    <Text style={label}>Business tier</Text><View style={chips}>{tiers.map(value=><Chip key={value} label={value} active={tier===value} onPress={()=>setTier(value)}/>)}</View>
    <View style={chips}><Chip label="Fleet enabled" active={fleet} onPress={()=>setFleet(v=>!v)}/><Chip label="Enterprise enabled" active={enterprise} onPress={()=>setEnterprise(v=>!v)}/></View>
    <Text style={label}>Audit reason</Text><TextInput value={reason} onChangeText={setReason} style={input}/><PrimaryAction label={busy?'Applying…':'Apply business access'} onPress={saveAccess} disabled={!canMutate||busy||!reason.trim()}/>
   </ActionSheetCard>
   <View style={{gap:9}}><SectionHeader title="Canonical locations" body="Locations linked to this business or approved claim."/>{(detail.locations??[]).map((location:any)=><EntityRow key={String(location.id)} title={String(location.name??'Unnamed location')} subtitle={[location.address,location.city,location.state].filter(Boolean).join(', ')} meta={`Verification: ${String(location.verification_status??'unknown')}`}/>)}</View>
   <View style={{gap:9}}><SectionHeader title="Members" body="Business membership is separate from commercial entitlement."/>{(detail.members??[]).map((member:any)=><EntityRow key={String(member.user_id??member.id)} title={String(member.display_name??member.email??member.user_id??'Member')} subtitle={String(member.role??'member')}>{canMutate?<PrimaryAction label="Remove member" danger onPress={()=>remove(String(member.user_id??member.id))} disabled={busy}/>:null}</EntityRow>)}</View>
   <ActionSheetCard title="Assign a member" body="Search a real account instead of pasting a user UUID."><View style={chips}>{memberRoles.map(value=><Chip key={value} label={value} active={memberRole===value} onPress={()=>setMemberRole(value)}/>)}</View><View style={{flexDirection:'row',gap:8}}><TextInput value={memberQuery} onChangeText={setMemberQuery} onSubmitEditing={searchPeople} placeholder="Name, username or email" style={input}/><PrimaryAction label="Find" onPress={searchPeople} disabled={busy||!memberQuery.trim()}/></View>{people.map(user=><EntityRow key={String(user.id)} title={String(user.display_name??user.username??user.email??'Account')} subtitle={String(user.email??user.username??'')} onPress={()=>canMutate?assign(user):undefined}/>)}</ActionSheetCard>
  </>:null}
 </ScrollView>
}

const input={flex:1,backgroundColor:'white',borderRadius:12,paddingHorizontal:12,paddingVertical:11,borderWidth:1,borderColor:osColors.border,color:osColors.ink} as const;
const label={fontWeight:'900',color:osColors.ink,fontSize:12} as const;
const chips={flexDirection:'row',flexWrap:'wrap',gap:7} as const;
function Chip({label,active,onPress}:{label:string;active:boolean;onPress:()=>void}){return <Pressable onPress={onPress} style={{borderRadius:999,paddingHorizontal:10,paddingVertical:8,backgroundColor:active?osColors.green:'#eef2ef'}}><Text style={{fontWeight:'900',color:active?'white':osColors.muted,textTransform:'capitalize'}}>{label}</Text></Pressable>}
