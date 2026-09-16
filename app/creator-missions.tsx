import { useCallback,useEffect,useMemo,useState } from 'react';
import { ActivityIndicator,Image,Linking,Pressable,RefreshControl,ScrollView,Share,Text,TextInput,View } from 'react-native';
import { ActionSheetCard,EntityRow,HealthCard,OSHero,PrimaryAction,SectionHeader,StatusPill,osColors } from '@/components/KleenestOS';
import { deleteOwnerCreatorMission,listOwnerCreatorMissions,saveOwnerCreatorMission,setOwnerCreatorMissionStatus,type OwnerCreatorMission } from '@/services/creatorMissions';
import { searchOwnerUsers } from '@/services/ownerPeople';

const statuses=['draft','scheduled','active','paused','ended','archived'] as const;
const actions=['verify_location','reverify_stale','add_amenity','add_accessibility','add_photo','substantive_review','helpful_contribution','discover_gps','discover_onsite_live'];
function titleCase(value:string){return value.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
function slugify(value:string){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}
function parseOptionalIso(value:string,label:string){const text=value.trim();if(!text)return null;const date=new Date(text);if(Number.isNaN(date.getTime()))throw new Error(`${label} must be a valid date/time.`);return date.toISOString();}
function stringValue(value:unknown,fallback=''){return value==null?fallback:String(value)}
function numberValue(value:unknown,fallback=0){const parsed=Number(value);return Number.isFinite(parsed)?parsed:fallback}
function stepsFromMission(mission:OwnerCreatorMission|null){const value=mission?.rules?.steps;return Array.isArray(value)?value.map(String).join('\n'):''}

export default function CreatorMissions(){
 const[missions,setMissions]=useState<OwnerCreatorMission[]>([]),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[message,setMessage]=useState<string|null>(null);
 const[editing,setEditing]=useState<OwnerCreatorMission|null|undefined>(undefined);
 const[creatorName,setCreatorName]=useState(''),[creatorHandle,setCreatorHandle]=useState(''),[creatorSlug,setCreatorSlug]=useState(''),[trackingSlug,setTrackingSlug]=useState(''),[creatorUserId,setCreatorUserId]=useState<string|null>(null);
 const[campaignCode,setCampaignCode]=useState('kleenest-stl-creators-2026'),[defaultChannel,setDefaultChannel]=useState('social');
 const[code,setCode]=useState(''),[title,setTitle]=useState(''),[description,setDescription]=useState(''),[status,setStatus]=useState<OwnerCreatorMission['status']>('draft'),[action,setAction]=useState('verify_location'),[target,setTarget]=useState('1'),[xpReward,setXpReward]=useState('175'),[audience,setAudience]=useState('consumer'),[steps,setSteps]=useState(''),[cta,setCta]=useState(''),[startsAt,setStartsAt]=useState(''),[endsAt,setEndsAt]=useState(''),[reason,setReason]=useState('Creator mission update');
 const[userQuery,setUserQuery]=useState(''),[userResults,setUserResults]=useState<any[]>([]),[userSearching,setUserSearching]=useState(false);

 const load=useCallback(async()=>{setError(null);setMissions(await listOwnerCreatorMissions())},[]);
 useEffect(()=>{load().catch(c=>setError(c instanceof Error?c.message:String(c))).finally(()=>setLoading(false))},[load]);
 async function refresh(){setRefreshing(true);try{await load()}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setRefreshing(false)}}

 function beginCreate(){
  setEditing(null);setCreatorName('');setCreatorHandle('');setCreatorSlug('');setTrackingSlug('');setCreatorUserId(null);setCampaignCode('kleenest-stl-creators-2026');setDefaultChannel('social');
  setCode(`creator-${Date.now()}`);setTitle('');setDescription('');setStatus('draft');setAction('verify_location');setTarget('1');setXpReward('175');setAudience('consumer');setSteps('');setCta('');setStartsAt('');setEndsAt('');setReason('Create creator mission');setUserResults([]);setUserQuery('');setMessage(null);
 }
 function beginEdit(item:OwnerCreatorMission){
  setEditing(item);setCreatorName(item.creator_name);setCreatorHandle(item.creator_handle??'');setCreatorSlug(item.creator_slug);setTrackingSlug(item.tracking_slug);setCreatorUserId(item.creator_user_id);setCampaignCode(item.campaign_code);setDefaultChannel(item.default_channel);
  setCode(item.code);setTitle(item.title);setDescription(item.description);setStatus(item.status);setAction(stringValue(item.rules?.action,'verify_location'));setTarget(stringValue(item.rules?.target,'1'));setXpReward(stringValue(item.rewards?.xp,'0'));setAudience(stringValue(item.scope?.audience,'consumer'));setSteps(stepsFromMission(item));setCta(stringValue(item.rules?.cta,''));setStartsAt(item.starts_at??'');setEndsAt(item.ends_at??'');setReason(`Update ${item.title}`);setUserResults([]);setUserQuery('');setMessage(null);
 }
 function autoSlugs(nextName:string){
  setCreatorName(nextName);
  if(editing===null&&!creatorSlug)setCreatorSlug(slugify(nextName));
  if(editing===null&&!trackingSlug)setTrackingSlug(slugify(nextName));
 }

 async function searchUsers(){setUserSearching(true);setError(null);try{setUserResults(await searchOwnerUsers(userQuery))}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setUserSearching(false)}}
 async function save(){
  const parsedTarget=Number(target),parsedXp=Number(xpReward);
  if(!Number.isFinite(parsedTarget)||parsedTarget<1){setError('Target must be at least 1.');return}
  if(!Number.isFinite(parsedXp)||parsedXp<0){setError('XP reward must be zero or greater.');return}
  setBusy(true);setError(null);setMessage(null);
  try{
   await saveOwnerCreatorMission({
    assignmentId:editing?.assignment_id??null,objectiveId:editing?.objective_id??null,code,title,description,status,
    startsAt:parseOptionalIso(startsAt,'Start'),endsAt:parseOptionalIso(endsAt,'End'),action,target:Math.round(parsedTarget),xpReward:Math.round(parsedXp),audience,
    steps:steps.split('\n').map(value=>value.trim()).filter(Boolean),cta,creatorUserId,creatorName,creatorHandle,creatorSlug,trackingSlug,campaignCode,defaultChannel,reason
   });
   await load();setEditing(undefined);setMessage(editing?'Creator mission updated and audited.':'Creator mission created as configured.');
  }catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}
 }
 async function changeStatus(item:OwnerCreatorMission,next:OwnerCreatorMission['status']){
  setBusy(true);setError(null);setMessage(null);try{await setOwnerCreatorMissionStatus(item.assignment_id,next,`${titleCase(next)} ${item.title}`);await load();setEditing(undefined);setMessage(`${item.title} is now ${next}.`)}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}
 }
 async function remove(item:OwnerCreatorMission){
  setBusy(true);setError(null);setMessage(null);try{await deleteOwnerCreatorMission(item.assignment_id,`Delete unused ${item.title}`);await load();setEditing(undefined);setMessage('Unused creator mission deleted.')}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}
 }

 const summary=useMemo(()=>({
  active:missions.filter(item=>item.status==='active').length,
  draft:missions.filter(item=>item.status==='draft').length,
  views:missions.reduce((sum,item)=>sum+numberValue(item.landing_views),0),
  opens:missions.reduce((sum,item)=>sum+numberValue(item.open_apps),0)
 }),[missions]);

 if(loading)return <View style={{flex:1,justifyContent:'center'}}><ActivityIndicator size="large"/></View>;
 return <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh}/>} contentContainerStyle={{padding:16,gap:16,paddingBottom:72}}>
  <OSHero eyebrow="KLEENESTOS · CREATOR MISSIONS" title="Creator Missions" body="Create creator-specific missions, control activation, assign optional Kleenest accounts, and manage one attributed tracking link + QR per creator mission."/>
  {error?<Text style={{color:osColors.danger,fontWeight:'800'}}>{error}</Text>:null}{message?<Text style={{color:osColors.good,fontWeight:'800'}}>{message}</Text>:null}
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>
   <HealthCard label="Active" value={summary.active} tone={summary.active?'good':'neutral'} detail="Public creator links resolving now"/>
   <HealthCard label="Draft" value={summary.draft} tone={summary.draft?'warning':'neutral'} detail="Not public until you activate them"/>
   <HealthCard label="Landing views" value={summary.views.toLocaleString()} detail="Attributed unique session views"/>
   <HealthCard label="Open app" value={summary.opens.toLocaleString()} detail="Attributed app-open intent"/>
  </View>

  <View style={{gap:10}}><SectionHeader title="Mission control" body="Draft is the safe default. Activation changes both the creator assignment and canonical mission objective together."/><PrimaryAction label="Create creator mission" onPress={beginCreate} disabled={busy}/></View>

  <View style={{gap:9}}><SectionHeader title="Creator missions" body={`${missions.length} configured · tap one to edit, activate, pause, archive or inspect its QR`}/>
   {missions.map(item=><EntityRow key={item.assignment_id} title={item.title} subtitle={`${item.creator_name}${item.creator_handle?` · ${item.creator_handle}`:''}`} meta={`${titleCase(item.status)} · ${item.landing_views} views · ${item.open_apps} opens · ${item.install_intents} installs`} onPress={()=>beginEdit(item)}>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}><StatusPill label={item.status.toUpperCase()} tone={item.status==='active'?'good':item.status==='draft'||item.status==='paused'?'warning':'neutral'}/><StatusPill label={item.tracking_slug}/></View>
   </EntityRow>)}
  </View>

  {editing!==undefined?<ActionSheetCard title={editing?`Edit ${editing.title}`:'Create creator mission'} body="Creator identity and attribution are separate from mission progress. Leave the mission in Draft until you are ready for the public creator link to resolve.">
   <Text style={label}>Creator name</Text><TextInput value={creatorName} onChangeText={autoSlugs} placeholder="Creator or publication name" style={input}/>
   <Text style={label}>Creator handle</Text><TextInput value={creatorHandle} onChangeText={setCreatorHandle} autoCapitalize="none" placeholder="@handle" style={input}/>
   <Text style={label}>Creator slug</Text><TextInput value={creatorSlug} onChangeText={value=>setCreatorSlug(slugify(value))} autoCapitalize="none" placeholder="creator-name" style={input}/>
   <Text style={label}>Tracking slug</Text><TextInput value={trackingSlug} onChangeText={value=>setTrackingSlug(slugify(value))} autoCapitalize="none" placeholder="creator-mission" style={input}/>
   <Text style={label}>Optional Kleenest account</Text>
   <View style={{flexDirection:'row',gap:8}}><TextInput value={userQuery} onChangeText={setUserQuery} onSubmitEditing={searchUsers} placeholder="Search account" autoCapitalize="none" style={input}/><PrimaryAction label={userSearching?'…':'Search'} onPress={searchUsers} disabled={userSearching||!userQuery.trim()}/></View>
   {creatorUserId?<Pressable onPress={()=>setCreatorUserId(null)}><StatusPill label="ACCOUNT ASSIGNED · TAP TO CLEAR" tone="good"/></Pressable>:null}
   {userResults.slice(0,6).map(user=><EntityRow key={String(user.id)} title={String(user.display_name??user.username??user.email??'Unnamed account')} subtitle={String(user.email??user.username??'')} onPress={()=>{setCreatorUserId(String(user.id));if(!creatorName.trim())setCreatorName(String(user.display_name??user.username??''));setUserResults([])}}/>)}

   <Text style={label}>Mission title</Text><TextInput value={title} onChangeText={setTitle} placeholder="Mission title" style={input}/>
   <Text style={label}>Stable mission code</Text><TextInput value={code} onChangeText={setCode} autoCapitalize="none" placeholder="creator-mission-code" style={input}/>
   <Text style={label}>Summary</Text><TextInput value={description} onChangeText={setDescription} multiline placeholder="What the creator should accomplish" style={[input,{minHeight:82,textAlignVertical:'top'}]}/>
   <Text style={label}>Steps · one per line</Text><TextInput value={steps} onChangeText={setSteps} multiline placeholder={'Open Kleenest\nCompare nearby options\nContribute a legitimate update'} style={[input,{minHeight:130,textAlignVertical:'top'}]}/>
   <Text style={label}>Creator CTA</Text><TextInput value={cta} onChangeText={setCta} placeholder="Save Kleenest before your next outing." style={input}/>
   <Text style={label}>Progress action</Text><TextInput value={action} onChangeText={setAction} autoCapitalize="none" style={input}/><View style={chips}>{actions.map(value=><Chip key={value} label={titleCase(value)} active={action===value} onPress={()=>setAction(value)}/>)}</View>
   <Text style={label}>Target</Text><TextInput value={target} onChangeText={setTarget} keyboardType="number-pad" style={input}/>
   <Text style={label}>XP reward</Text><TextInput value={xpReward} onChangeText={setXpReward} keyboardType="number-pad" style={input}/>
   <Text style={label}>Audience</Text><TextInput value={audience} onChangeText={setAudience} autoCapitalize="none" style={input}/>
   <Text style={label}>Campaign code</Text><TextInput value={campaignCode} onChangeText={setCampaignCode} autoCapitalize="none" style={input}/>
   <Text style={label}>Default tracking channel</Text><TextInput value={defaultChannel} onChangeText={setDefaultChannel} autoCapitalize="none" style={input}/>
   <Text style={label}>Lifecycle</Text><View style={chips}>{statuses.map(value=><Chip key={value} label={titleCase(value)} active={status===value} onPress={()=>setStatus(value)}/>)}</View>
   <Text style={label}>Starts at (optional)</Text><TextInput value={startsAt} onChangeText={setStartsAt} autoCapitalize="none" placeholder="2026-09-20T12:00:00Z" style={input}/>
   <Text style={label}>Ends at (optional)</Text><TextInput value={endsAt} onChangeText={setEndsAt} autoCapitalize="none" placeholder="2026-10-20T12:00:00Z" style={input}/>
   <Text style={label}>Audit reason</Text><TextInput value={reason} onChangeText={setReason} style={input}/>
   <View style={chips}><PrimaryAction label={busy?'Saving…':editing?'Save creator mission':'Create creator mission'} onPress={save} disabled={busy||!creatorName.trim()||!creatorSlug.trim()||!trackingSlug.trim()||!title.trim()||!code.trim()||!reason.trim()}/><PrimaryAction label="Cancel" onPress={()=>setEditing(undefined)} disabled={busy}/></View>

   {editing?<>
    <View style={{borderTopWidth:1,borderTopColor:osColors.border,paddingTop:12,gap:9}}>
     <Text style={label}>Branded tracking link + QR</Text>
     <Text selectable style={{color:osColors.green,fontWeight:'800'}}>{editing.tracking_url}</Text>
     <View style={{alignSelf:'flex-start',backgroundColor:'white',borderWidth:1,borderColor:osColors.border,borderRadius:18,padding:12,gap:8}}>
      <Text style={{fontWeight:'900',color:osColors.ink}}>KLEENEST · {editing.creator_name}</Text>
      <Image source={{uri:`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(editing.tracking_url)}`}} style={{width:220,height:220,borderRadius:8}} accessibilityLabel={`QR code for ${editing.title}`}/>
      <Text style={{color:osColors.muted,fontSize:11,maxWidth:220}}>{editing.status==='active'?'This QR resolves to the live mission landing page.':'This QR is ready, but the landing stays unavailable until the mission is Active.'}</Text>
     </View>
     <View style={chips}><PrimaryAction label="Open link" onPress={()=>void Linking.openURL(editing.tracking_url)} /><PrimaryAction label="Share mission link" onPress={()=>void Share.share({title:`${editing.creator_name} × Kleenest`,message:`${editing.title}\n${editing.tracking_url}`})}/></View>
    </View>
    <Text style={label}>Lifecycle commands</Text>
    <View style={chips}>
     {editing.status!=='active'?<PrimaryAction label="Activate mission" onPress={()=>void changeStatus(editing,'active')} disabled={busy}/>:<PrimaryAction label="Pause mission" onPress={()=>void changeStatus(editing,'paused')} disabled={busy}/>}
     <PrimaryAction label="Archive mission" onPress={()=>void changeStatus(editing,'archived')} disabled={busy}/>
     <PrimaryAction label="Delete unused mission" onPress={()=>void remove(editing)} disabled={busy} danger/>
    </View>
   </>:null}
  </ActionSheetCard>:null}
 </ScrollView>
}

const input={flex:1,backgroundColor:'white',borderRadius:12,paddingHorizontal:12,paddingVertical:11,borderWidth:1,borderColor:osColors.border,color:osColors.ink} as const;
const label={fontWeight:'900',color:osColors.ink,fontSize:12} as const;
const chips={flexDirection:'row',flexWrap:'wrap',gap:8} as const;
function Chip({label:chipLabel,active,onPress}:{label:string;active:boolean;onPress:()=>void}){return <Pressable onPress={onPress} style={{borderRadius:999,paddingHorizontal:11,paddingVertical:8,backgroundColor:active?osColors.ink:'#edf3ef',borderWidth:1,borderColor:active?osColors.ink:osColors.border}}><Text style={{fontWeight:'900',fontSize:12,color:active?'white':osColors.ink}}>{chipLabel}</Text></Pressable>}
