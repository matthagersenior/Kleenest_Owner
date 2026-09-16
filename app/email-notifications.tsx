import { useCallback,useEffect,useMemo,useState } from 'react';
import { ActivityIndicator,Alert,Pressable,RefreshControl,ScrollView,Switch,Text,TextInput,View } from 'react-native';
import { ActionSheetCard,EntityRow,HealthCard,OSHero,PrimaryAction,SectionHeader,StatusPill,osCard,osColors } from '@/components/KleenestOS';
import {
  configureOwnerEmailProvider,deleteOwnerEmailNotificationRule,getOwnerEmailNotificationSnapshot,getOwnerEmailProviderStatus,
  saveOwnerEmailNotificationRule,sendOwnerEmailTest,updateOwnerEmailNotificationSettings,
  type OwnerEmailCadence,type OwnerEmailRule,type OwnerEmailSeverity,type OwnerEmailSnapshot
} from '@/services/ownerEmailNotifications';

const sources=[
  ['security_access','Security & access','Security'],
  ['data_integrity','Data integrity','Data'],
  ['ingestion_storage','Ingestion & storage','Operations'],
  ['automation_delivery','Automation & delivery','Delivery'],
  ['moderation_safety','Moderation & safety','Trust'],
  ['tasks','Owner work queue','Tasks'],
  ['audits','Audits','Audit'],
  ['owner_activity','Owner activity','Governance'],
  ['business_network','Business network','Business'],
  ['economy_anomalies','Economy anomalies','Economy'],
] as const;
const cadences:OwnerEmailCadence[]=['immediate','hourly','daily','weekly'];
const severities:OwnerEmailSeverity[]=['info','warning','critical'];
const weekdays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const inputStyle={backgroundColor:'white',borderWidth:1,borderColor:osColors.border,borderRadius:12,paddingHorizontal:12,paddingVertical:10,color:osColors.ink} as const;

function Choice<T extends string>({value,current,onPress}:{value:T;current:T;onPress:(value:T)=>void}){
 const active=value===current;
 return <Pressable onPress={()=>onPress(value)} style={{borderRadius:999,paddingHorizontal:10,paddingVertical:7,borderWidth:1,borderColor:active?osColors.green:osColors.border,backgroundColor:active?osColors.mint:'white'}}>
  <Text style={{fontWeight:'800',color:active?osColors.green:osColors.muted,textTransform:'capitalize'}}>{value}</Text>
 </Pressable>
}

function RuleCard({rule,onSave,onDelete,busy}:{rule:OwnerEmailRule;onSave:(next:OwnerEmailRule)=>void;onDelete:()=>void;busy:boolean}){
 const[draft,setDraft]=useState(rule);
 useEffect(()=>setDraft(rule),[rule]);
 return <View style={{...osCard,gap:10}}>
  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12}}>
   <View style={{flex:1,gap:3}}><Text style={{fontSize:17,fontWeight:'900',color:osColors.ink}}>{draft.name}</Text><Text style={{color:osColors.muted}}>{draft.description}</Text></View>
   <Switch value={draft.enabled} onValueChange={enabled=>setDraft({...draft,enabled})} disabled={busy}/>
  </View>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}><StatusPill label={draft.category}/><StatusPill label={draft.source_key.replaceAll('_',' ')}/></View>
  <Text style={{fontWeight:'900',color:osColors.ink}}>Cadence</Text>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{cadences.map(value=><Choice key={value} value={value} current={draft.cadence} onPress={cadence=>setDraft({...draft,cadence})}/>)}</View>
  <Text style={{fontWeight:'900',color:osColors.ink}}>Minimum severity</Text>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{severities.map(value=><Choice key={value} value={value} current={draft.severity_floor} onPress={severity_floor=>setDraft({...draft,severity_floor})}/>)}</View>
  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12}}>
   <View style={{flex:1}}><Text style={{fontWeight:'900',color:osColors.ink}}>Break out noteworthy findings</Text><Text style={{color:osColors.muted}}>Warning/critical findings can bypass the digest and email immediately.</Text></View>
   <Switch value={draft.noteworthy_immediate} onValueChange={noteworthy_immediate=>setDraft({...draft,noteworthy_immediate})} disabled={busy}/>
  </View>
  <View style={{flexDirection:'row',gap:12}}>
   <View style={{flex:1,gap:5}}><Text style={{fontWeight:'800',color:osColors.ink}}>Dedupe minutes</Text><TextInput keyboardType="number-pad" value={String(draft.dedupe_window_minutes)} onChangeText={v=>setDraft({...draft,dedupe_window_minutes:Math.max(1,Number(v)||1)})} style={inputStyle}/></View>
   <View style={{flex:1,gap:5}}><Text style={{fontWeight:'800',color:osColors.ink}}>Max / digest</Text><TextInput keyboardType="number-pad" value={String(draft.max_per_digest)} onChangeText={v=>setDraft({...draft,max_per_digest:Math.max(1,Number(v)||1)})} style={inputStyle}/></View>
  </View>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:9}}><PrimaryAction label={busy?'Saving…':'Save rule'} onPress={()=>onSave(draft)} disabled={busy}/><Pressable onPress={onDelete} disabled={busy} style={{padding:10}}><Text style={{color:osColors.danger,fontWeight:'900'}}>Delete rule</Text></Pressable></View>
 </View>
}

export default function EmailNotifications(){
 const[data,setData]=useState<OwnerEmailSnapshot|null>(null),[provider,setProvider]=useState<{provider_configured:boolean;from_address:string}|null>(null);
 const[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 const[recipient,setRecipient]=useState(''),[timezone,setTimezone]=useState('America/Chicago'),[dailyHour,setDailyHour]=useState('8'),[weeklyHour,setWeeklyHour]=useState('8'),[weeklyDow,setWeeklyDow]=useState(1),[maxImmediate,setMaxImmediate]=useState('6');
 const[providerKey,setProviderKey]=useState(''),[fromAddress,setFromAddress]=useState('Kleenest Owner <onboarding@resend.dev>');
 const[newSource,setNewSource]=useState<string>(''),[newName,setNewName]=useState(''),[newCode,setNewCode]=useState('');

 const load=useCallback(async()=>{
  setError(null);
  const [snapshot,status]=await Promise.all([getOwnerEmailNotificationSnapshot(),getOwnerEmailProviderStatus()]);
  setData(snapshot);setProvider({provider_configured:status.provider_configured,from_address:status.from_address});setFromAddress(status.from_address||'Kleenest Owner <onboarding@resend.dev>');
  setRecipient(snapshot.settings.recipient_email??'');setTimezone(snapshot.settings.timezone);setDailyHour(String(snapshot.settings.daily_digest_hour));setWeeklyHour(String(snapshot.settings.weekly_digest_hour));setWeeklyDow(snapshot.settings.weekly_digest_dow);setMaxImmediate(String(snapshot.settings.max_immediate_per_hour));
 },[]);
 useEffect(()=>{load().catch(c=>setError(c instanceof Error?c.message:String(c))).finally(()=>setLoading(false))},[load]);

 const availableSources=useMemo(()=>sources.filter(([key])=>!data?.rules.some(rule=>draft.source_key===key)),[data?.rules]);
 useEffect(()=>{if(!newSource&&availableSources.length){setNewSource(availableSources[0][0]);setNewName(availableSources[0][1]);setNewCode(availableSources[0][0].replaceAll('_','-'));}},[availableSources,newSource]);

 async function refresh(){setRefreshing(true);try{await load()}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setRefreshing(false)}}
 async function saveSettings(){
  if(!data)return;setBusy(true);setError(null);
  try{
   await updateOwnerEmailNotificationSettings({enabled:data.settings.enabled,recipient_email:recipient,timezone,daily_digest_hour:Number(dailyHour),weekly_digest_dow:weeklyDow,weekly_digest_hour:Number(weeklyHour),max_immediate_per_hour:Number(maxImmediate)});
   await load();
  }catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}
 }
 async function setGlobal(enabled:boolean){if(!data)return;setData({...data,settings:{...data.settings,enabled}})}
 async function saveRule(next:OwnerEmailRule){
  setBusy(true);setError(null);
  try{await saveOwnerEmailNotificationRule(next);await load()}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}
 }
 function removeRule(rule:OwnerEmailRule){
  Alert.alert('Delete email rule?',`${draft.name} will stop producing owner email until the category is added again.`,[
   {text:'Cancel',style:'cancel'},
   {text:'Delete',style:'destructive',onPress:async()=>{setBusy(true);try{await deleteOwnerEmailNotificationRule(rule.id);await load()}catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}}}
  ]);
 }
 async function addRule(){
  if(!newSource||!newName.trim()||!newCode.trim())return;
  const meta=sources.find(([key])=>key===newSource);
  setBusy(true);setError(null);
  try{
   await saveOwnerEmailNotificationRule({code:newCode.trim(),name:newName.trim(),source_key:newSource,category:meta?.[2]??'Owner',cadence:newSource==='audits'?'weekly':'daily',severity_floor:['security_access','data_integrity','ingestion_storage','economy_anomalies'].includes(newSource)?'warning':'info',enabled:true,noteworthy_immediate:true,dedupe_window_minutes:newSource==='audits'?10080:360,max_per_digest:50});
   setNewSource('');setNewName('');setNewCode('');await load();
  }catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}
 }
 async function configureProvider(){
  if(!providerKey.trim()){setError('Paste a Resend API key to finish email delivery setup.');return;}
  setBusy(true);setError(null);
  try{await configureOwnerEmailProvider(providerKey,fromAddress);setProviderKey('');await load();Alert.alert('Email provider connected','Owner operational email delivery is now enabled. You can send a test email from this screen.')}
  catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}
 }
 async function testEmail(){
  setBusy(true);setError(null);
  try{const result=await sendOwnerEmailTest();Alert.alert('Test email',result.provider_configured?'Test sent through the configured email provider.':'Email provider is not configured yet. The test remains queued.');await load()}
  catch(c){setError(c instanceof Error?c.message:String(c))}finally{setBusy(false)}
 }

 if(loading)return <View style={{flex:1,justifyContent:'center'}}><ActivityIndicator size="large"/></View>;
 if(!data)return <View style={{padding:16}}><Text style={{color:osColors.danger}}>{error??'Email notification settings could not be loaded.'}</Text></View>;

 return <ScrollView contentInsetAdjustmentBehavior="automatic" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh}/>} contentContainerStyle={{padding:16,gap:16,paddingBottom:64}}>
  <OSHero eyebrow="KLEENESTOS · OWNER SIGNALS" title="Email Notifications" body="High-signal operational email with a reason on every alert, digest controls, duplicate suppression, and auditable owner CRUD.">
   <StatusPill label={data.settings.enabled?'EMAIL POLICY ON':'EMAIL POLICY OFF'} tone={data.settings.enabled?'good':'warning'}/>
  </OSHero>

  {error?<View style={{...osCard,borderColor:'#e8bbbb',backgroundColor:'#fff6f6'}}><Text style={{color:osColors.danger,fontWeight:'900'}}>Email notification issue</Text><Text style={{color:osColors.danger}}>{error}</Text></View>:null}

  <View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>
   <HealthCard label="Provider" value={provider?.provider_configured?'READY':'SETUP'} tone={provider?.provider_configured?'good':'warning'} detail={provider?.provider_configured?provider.from_address:'RESEND_API_KEY required for delivery'}/>
   <HealthCard label="Queued" value={data.queue.queued} tone={data.queue.queued?'warning':'good'} detail="Waiting for cadence/provider"/>
   <HealthCard label="Sent · 24h" value={data.queue.sent_24h} tone="good" detail="Owner operational emails"/>
   <HealthCard label="Failed" value={data.queue.failed} tone={data.queue.failed?'danger':'good'} detail="Terminal delivery failures"/>
  </View>

  {!provider?.provider_configured?<ActionSheetCard title="Finish email delivery" body="Signal collection is active and safely queued. Connect a Resend API key here; the key is stored in Supabase Vault and is never returned to the app.">
   <Text style={{fontWeight:'800',color:osColors.ink}}>Resend API key</Text><TextInput secureTextEntry autoCapitalize="none" value={providerKey} onChangeText={setProviderKey} placeholder="re_…" style={inputStyle}/>
   <Text style={{fontWeight:'800',color:osColors.ink}}>From address</Text><TextInput autoCapitalize="none" value={fromAddress} onChangeText={setFromAddress} style={inputStyle}/>
   <PrimaryAction label={busy?'Connecting…':'Connect email provider'} onPress={configureProvider} disabled={busy||!providerKey.trim()}/>
  </ActionSheetCard>:null}

  <ActionSheetCard title="Owner email policy" body="This is separate from consumer/business marketing notifications. It is only for owner operational signals.">
   <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}><Text style={{fontWeight:'900',color:osColors.ink}}>Email notifications enabled</Text><Switch value={data.settings.enabled} onValueChange={setGlobal}/></View>
   <Text style={{fontWeight:'800',color:osColors.ink}}>Recipient</Text><TextInput autoCapitalize="none" keyboardType="email-address" value={recipient} onChangeText={setRecipient} style={inputStyle}/>
   <Text style={{fontWeight:'800',color:osColors.ink}}>Timezone</Text><TextInput autoCapitalize="none" value={timezone} onChangeText={setTimezone} style={inputStyle}/>
   <View style={{flexDirection:'row',gap:12}}>
    <View style={{flex:1,gap:5}}><Text style={{fontWeight:'800',color:osColors.ink}}>Daily digest hour</Text><TextInput keyboardType="number-pad" value={dailyHour} onChangeText={setDailyHour} style={inputStyle}/></View>
    <View style={{flex:1,gap:5}}><Text style={{fontWeight:'800',color:osColors.ink}}>Weekly hour</Text><TextInput keyboardType="number-pad" value={weeklyHour} onChangeText={setWeeklyHour} style={inputStyle}/></View>
   </View>
   <Text style={{fontWeight:'800',color:osColors.ink}}>Weekly digest day</Text>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{weekdays.map((day,index)=><Pressable key={day} onPress={()=>setWeeklyDow(index)} style={{borderRadius:999,paddingHorizontal:10,paddingVertical:7,borderWidth:1,borderColor:weeklyDow===index?osColors.green:osColors.border,backgroundColor:weeklyDow===index?osColors.mint:'white'}}><Text style={{fontWeight:'800',color:weeklyDow===index?osColors.green:osColors.muted}}>{day}</Text></Pressable>)}</View>
   <Text style={{fontWeight:'800',color:osColors.ink}}>Maximum immediate signals per hour</Text><TextInput keyboardType="number-pad" value={maxImmediate} onChangeText={setMaxImmediate} style={inputStyle}/>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:9}}><PrimaryAction label={busy?'Saving…':'Save email policy'} onPress={saveSettings} disabled={busy}/><PrimaryAction label="Send test email" onPress={testEmail} disabled={busy}/></View>
  </ActionSheetCard>

  <View style={{gap:9}}>
   <SectionHeader title="Notification rules" body="Everything starts enabled. Routine signals digest; meaningful warning/critical findings can break out immediately. Changes save as you make them."/>
   {data.rules.map(rule=><RuleCard key={rule.id} rule={rule} busy={busy} onSave={saveRule} onDelete={()=>removeRule(rule)}/>)}
  </View>

  {availableSources.length?<ActionSheetCard title="Add a notification rule" body="Create a rule for any supported owner signal source that is not currently configured.">
   <Text style={{fontWeight:'800',color:osColors.ink}}>Signal source</Text>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{availableSources.map(([key,label])=><Pressable key={key} onPress={()=>{setNewSource(key);setNewName(label);setNewCode(key.replaceAll('_','-'))}} style={{borderRadius:999,paddingHorizontal:10,paddingVertical:7,borderWidth:1,borderColor:newSource===key?osColors.green:osColors.border,backgroundColor:newSource===key?osColors.mint:'white'}}><Text style={{fontWeight:'800',color:newSource===key?osColors.green:osColors.muted}}>{label}</Text></Pressable>)}</View>
   <Text style={{fontWeight:'800',color:osColors.ink}}>Rule name</Text><TextInput value={newName} onChangeText={setNewName} style={inputStyle}/>
   <Text style={{fontWeight:'800',color:osColors.ink}}>Rule code</Text><TextInput autoCapitalize="none" value={newCode} onChangeText={setNewCode} style={inputStyle}/>
   <PrimaryAction label="Create rule" onPress={addRule} disabled={busy||!newSource}/>
  </ActionSheetCard>:null}

  <View style={{gap:9}}>
   <SectionHeader title="Recent email reasons" body="What qualified for email, whether it was grouped, and its current delivery state."/>
   {data.recent_events.slice(0,12).map(event=><EntityRow key={event.id} title={event.title} subtitle={`Reason: ${event.reason}`} meta={`${event.severity.toUpperCase()} · ${event.effective_cadence} · ${event.status}${event.occurrences>1?` · grouped ×${event.occurrences}`:''}`}/>)}
   {!data.recent_events.length?<Text style={{color:osColors.muted}}>No owner email events yet.</Text>:null}
  </View>

  <View style={{gap:9}}>
   <SectionHeader title="Delivery history" body="Provider outcomes are retained so missing or failed email cannot disappear silently."/>
   {data.recent_deliveries.slice(0,10).map(delivery=><EntityRow key={delivery.id} title={delivery.subject} subtitle={delivery.error??delivery.recipient_email} meta={`${delivery.cadence} · ${delivery.status} · ${new Date(delivery.created_at).toLocaleString()}`}/>)}
   {!data.recent_deliveries.length?<Text style={{color:osColors.muted}}>No delivery attempts yet.</Text>:null}
  </View>
 </ScrollView>
}
