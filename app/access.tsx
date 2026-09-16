import { useEffect,useMemo,useState } from 'react';
import { ActivityIndicator,Pressable,ScrollView,Text,TextInput,View } from 'react-native';
import { ActionSheetCard,EntityRow,OSHero,PrimaryAction,SectionHeader,StatusPill,osColors } from '@/components/KleenestOS';
import { getOwnerAuthorization,type OwnerAuthorization } from '@/services/ownerAuthorization';
import { getOwnerUserProgressionRewards,grantOwnerProgressionReward,revokeOwnerProgressionReward,searchOwnerUsers,setOwnerUserAccess } from '@/services/ownerPeople';

const roles=['customer','business','admin'];
const tiers=['free','premium','family','fleet','enterprise'];
const kindOrder=['theme','title','profile_frame','profile_background','map_flair','checkin_animation','reaction_pack','badge_showcase','map_filter','collection_slot','mission_reroll','quest_slot','streak_shield','community_challenge','community_vote','beta_access','stats_pack','verification_privilege'];

function titleCase(value:string){return value.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
function rewardState(reward:any){
 if(reward?.active_grant&&reward?.grant_source==='owner')return{label:'OWNER GRANT',tone:'good' as const};
 if(reward?.active_grant&&reward?.grant_source==='progression')return{label:'PROGRESSION EARNED',tone:'good' as const};
 if(reward?.progression_eligible)return{label:'PROGRESSION ELIGIBLE',tone:'good' as const};
 if(reward?.owner_only)return{label:'OWNER ONLY',tone:'warning' as const};
 return{label:'LOCKED',tone:'neutral' as const};
}

export default function AccessConsole(){
 const[authorization,setAuthorization]=useState<OwnerAuthorization|null>(null),[query,setQuery]=useState(''),[rows,setRows]=useState<any[]>([]),[selected,setSelected]=useState<any|null>(null),[role,setRole]=useState('customer'),[tier,setTier]=useState('free'),[isAdmin,setIsAdmin]=useState(false),[isBusinessUser,setIsBusinessUser]=useState(false),[reason,setReason]=useState('KleenestOS access update'),[busy,setBusy]=useState(false),[rewardBusy,setRewardBusy]=useState<string|null>(null),[rewards,setRewards]=useState<any[]>([]),[rewardsLoading,setRewardsLoading]=useState(false),[error,setError]=useState<string|null>(null),[message,setMessage]=useState<string|null>(null);
 useEffect(()=>{getOwnerAuthorization().then(setAuthorization).catch(c=>setError(c instanceof Error?c.message:String(c)))},[]);

 async function search(){setBusy(true);setError(null);try{setRows(await searchOwnerUsers(query));}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}}
 function populateAccess(user:any){setSelected(user);setRole(String(user.role??'customer'));setTier(String(user.subscription_tier??'free'));setIsAdmin(Boolean(user.is_admin));setIsBusinessUser(Boolean(user.is_business_user));setMessage(null)}
 async function loadRewards(userId:string){setRewardsLoading(true);try{setRewards(await getOwnerUserProgressionRewards(userId))}catch(c){setError(c instanceof Error?c.message:String(c));setRewards([])}finally{setRewardsLoading(false)}}
 async function choose(user:any){populateAccess(user);await loadRewards(String(user.id))}
 async function save(){if(!selected)return;setBusy(true);setError(null);setMessage(null);try{await setOwnerUserAccess({userId:String(selected.id),role,subscriptionTier:tier,isAdmin,isBusinessUser,reason});const refreshed=await searchOwnerUsers(String(selected.email??selected.username??selected.id));const next=refreshed.find((x:any)=>String(x.id)===String(selected.id))??selected;populateAccess(next);setRows(refreshed);setMessage('Authoritative account access updated and audited.')}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}}
 async function grantReward(reward:any){if(!selected)return;setRewardBusy(String(reward.code));setError(null);setMessage(null);try{await grantOwnerProgressionReward(String(selected.id),String(reward.code),reason||`Grant ${reward.name}`);await loadRewards(String(selected.id));setMessage(`${reward.name} granted to this account.`)}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setRewardBusy(null)}}
 async function revokeReward(reward:any){if(!selected)return;setRewardBusy(String(reward.code));setError(null);setMessage(null);try{await revokeOwnerProgressionReward(String(selected.id),String(reward.code),reason||`Revoke ${reward.name}`);await loadRewards(String(selected.id));setMessage(`${reward.name} Owner grant revoked.`)}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setRewardBusy(null)}}

 const canMutate=Boolean(authorization?.is_platform_owner);
 const rewardGroups=useMemo(()=>kindOrder.map(kind=>({kind,items:rewards.filter(item=>String(item.reward_kind)===kind)})).filter(group=>group.items.length),[rewards]);

 return <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:16,gap:16,paddingBottom:60}}>
  <OSHero eyebrow="KLEENESTOS · PEOPLE & ACCESS" title="People & Access" body="Search real accounts first, inspect their authority, then make audited platform-owner changes.">{authorization?<StatusPill label={authorization.is_platform_owner?'PLATFORM OWNER':'ADMIN READ-ONLY'} tone={authorization.is_platform_owner?'good':'warning'}/>:null}</OSHero>
  {error?<Text style={{color:osColors.danger,fontWeight:'800'}}>{error}</Text>:null}{message?<Text style={{color:osColors.good,fontWeight:'800'}}>{message}</Text>:null}

  <ActionSheetCard title="Find an account" body="Search display name, username, email or paste a UUID as an advanced fallback."><View style={{flexDirection:'row',gap:8}}><TextInput value={query} onChangeText={setQuery} onSubmitEditing={search} placeholder="Name, username, email or UUID" autoCapitalize="none" style={input}/><PrimaryAction label={busy?'…':'Search'} onPress={search} disabled={busy||!query.trim()}/></View></ActionSheetCard>
  {busy&&!rows.length?<ActivityIndicator/>:null}
  <View style={{gap:9}}><SectionHeader title="Accounts" body={`${rows.length} matching account${rows.length===1?'':'s'}`}/>{rows.map(user=><EntityRow key={String(user.id)} title={String(user.display_name??user.username??user.email??'Unnamed account')} subtitle={String(user.email??user.username??'')} meta={`${String(user.role??'customer')} · ${String(user.subscription_tier??'free')}`} onPress={()=>void choose(user)}><View style={{flexDirection:'row',gap:6,flexWrap:'wrap'}}>{user.is_admin?<StatusPill label="ADMIN" tone="warning"/>:null}{user.is_business_user?<StatusPill label="BUSINESS"/>:null}</View></EntityRow>)}</View>

  {selected?<>
   <ActionSheetCard title={`Control ${String(selected.display_name??selected.username??selected.email??'account')}`} body={canMutate?'These controls call canonical platform-owner RPC authority and are audited.':'This session can inspect accounts but platform-owner authority is required to mutate them.'}>
    <Text style={label}>Role</Text><View style={chips}>{roles.map(value=><Chip key={value} label={value} active={role===value} onPress={()=>setRole(value)}/>)}</View>
    <Text style={label}>Subscription tier</Text><View style={chips}>{tiers.map(value=><Chip key={value} label={value} active={tier===value} onPress={()=>setTier(value)}/>)}</View>
    <View style={chips}><Chip label="Admin" active={isAdmin} onPress={()=>setIsAdmin(v=>!v)}/><Chip label="Business user" active={isBusinessUser} onPress={()=>setIsBusinessUser(v=>!v)}/></View>
    <Text style={label}>Audit reason</Text><TextInput value={reason} onChangeText={setReason} style={input}/>
    <PrimaryAction label={busy?'Applying…':'Apply authoritative access'} onPress={save} disabled={!canMutate||busy||!reason.trim()}/>
   </ActionSheetCard>

   <View style={{gap:10}}>
    <SectionHeader title="Themes & Progression Rewards" body="Grant an individual reward early without changing its normal progression path. Earned progression grants stay visibly distinct from Owner grants; platform-owner consumer sessions automatically have access to the full catalog."/>
    {rewardsLoading?<ActivityIndicator/>:rewardGroups.map(group=><View key={group.kind} style={{gap:7}}>
     <Text style={label}>{titleCase(group.kind)}</Text>
     {group.items.map(reward=>{const state=rewardState(reward);const ownerGrant=reward.active_grant&&reward.grant_source==='owner';const earned=reward.active_grant&&reward.grant_source==='progression';return <View key={String(reward.code)} style={{borderWidth:1,borderColor:osColors.border,borderRadius:14,padding:12,gap:7,backgroundColor:'white'}}>
      <View style={{flexDirection:'row',alignItems:'flex-start',gap:8}}><View style={{flex:1,gap:3}}><Text style={{fontWeight:'900',color:osColors.ink}}>{String(reward.name)}</Text><Text style={{color:osColors.muted,fontSize:12,lineHeight:17}}>{String(reward.description??'')}</Text></View><StatusPill label={state.label} tone={state.tone}/></View>
      <Text style={{color:osColors.muted,fontSize:11}}>{reward.owner_only?'Owner controlled':`Level ${Number(reward.min_global_level||1)} · Trust ${Number(reward.min_trust_score||0)} · ${Number(reward.min_lifetime_xp||0).toLocaleString()} XP · ${Number(reward.min_badges||0)} badges`}</Text>
      {earned?<Text style={{color:osColors.good,fontSize:11,fontWeight:'800'}}>This reward was earned through progression. Owner controls do not replace that achievement.</Text>:null}
      <View style={chips}>{ownerGrant?<PrimaryAction label={rewardBusy===String(reward.code)?'Revoking…':'Revoke grant'} onPress={()=>void revokeReward(reward)} disabled={!canMutate||Boolean(rewardBusy)}/>:<PrimaryAction label={rewardBusy===String(reward.code)?'Granting…':'Grant reward'} onPress={()=>void grantReward(reward)} disabled={!canMutate||Boolean(rewardBusy)||earned}/>}</View>
     </View>})}
    </View>)}
   </View>
  </>:null}
 </ScrollView>
}

const input={flex:1,backgroundColor:'white',borderRadius:12,paddingHorizontal:12,paddingVertical:11,borderWidth:1,borderColor:osColors.border,color:osColors.ink} as const;
const label={fontWeight:'900',color:osColors.ink,fontSize:12} as const;
const chips={flexDirection:'row',flexWrap:'wrap',gap:7} as const;
function Chip({label,active,onPress}:{label:string;active:boolean;onPress:()=>void}){return <Pressable onPress={onPress} style={{borderRadius:999,paddingHorizontal:10,paddingVertical:8,backgroundColor:active?osColors.green:'#eef2ef'}}><Text style={{fontWeight:'900',color:active?'white':osColors.muted,textTransform:'capitalize'}}>{label}</Text></Pressable>}
