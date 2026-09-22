import { useCallback,useEffect,useMemo,useState } from 'react';
import { ActivityIndicator,Pressable,RefreshControl,ScrollView,Text,TextInput,View } from 'react-native';
import { OSHero,SectionHeader,StatusPill,osCard } from '@/components/KleenestOS';
import {
  archiveOwnerSponsoredCampaign,getOwnerSponsorshipSnapshot,reviewOwnerSponsoredCampaign,
  saveOwnerAdPlacement,saveOwnerSponsoredCampaign,setOwnerSponsoredServing,
  type OwnerAdPlacement,type OwnerSponsoredCampaign,type OwnerSponsorshipSnapshot
} from '@/services/ownerSponsorship';
import { useOwnerTheme } from '@/services/theme';

const csv=(v:string)=>v.split(',').map(x=>x.trim()).filter(Boolean);
const human=(v:string)=>v.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const num=(v:string,fallback=0)=>{const n=Number(v);return Number.isFinite(n)?n:fallback};

function Action({label,onPress,disabled=false}:{label:string;onPress:()=>void;disabled?:boolean}){
  const theme=useOwnerTheme();
  return <Pressable disabled={disabled} onPress={onPress} style={{backgroundColor:disabled?theme.surfaceRaised:theme.accent,borderRadius:999,paddingHorizontal:12,paddingVertical:10,opacity:disabled?.55:1}}>
    <Text style={{fontWeight:'900',color:disabled?theme.muted:theme.accentText}}>{label}</Text>
  </Pressable>;
}
function Field({label,value,set,placeholder,multiline=false}:{label:string;value:string;set:(v:string)=>void;placeholder?:string;multiline?:boolean}){
  const theme=useOwnerTheme();
  return <View style={{gap:4}}><Text style={{fontSize:11,fontWeight:'800',color:theme.muted}}>{label}</Text><TextInput value={value} onChangeText={set} placeholder={placeholder} placeholderTextColor={theme.muted} multiline={multiline} style={{borderWidth:1,borderColor:theme.line,borderRadius:12,paddingHorizontal:12,paddingVertical:10,color:theme.ink,backgroundColor:theme.surfaceRaised,minHeight:multiline?72:undefined,textAlignVertical:multiline?'top':'center'}}/></View>
}

export default function SponsoredAds(){
  const theme=useOwnerTheme();
  const[data,setData]=useState<OwnerSponsorshipSnapshot|null>(null),[busy,setBusy]=useState(true),[refreshing,setRefreshing]=useState(false),[message,setMessage]=useState('');
  const[reason,setReason]=useState('KleenestOS sponsored advertising control'),[reviewNote,setReviewNote]=useState('');

  const[editingCampaign,setEditingCampaign]=useState<string|null>(null),[name,setName]=useState(''),[sponsor,setSponsor]=useState('Kleenest'),[headline,setHeadline]=useState(''),[body,setBody]=useState(''),[cta,setCta]=useState('Learn more'),[url,setUrl]=useState('');
  const[status,setStatus]=useState<'draft'|'active'|'paused'|'ended'>('draft'),[startsAt,setStartsAt]=useState(''),[endsAt,setEndsAt]=useState(''),[placementCodes,setPlacementCodes]=useState('');
  const[region,setRegion]=useState(''),[route,setRoute]=useState(''),[amenities,setAmenities]=useState(''),[timeBucket,setTimeBucket]=useState(''),[interests,setInterests]=useState('');
  const[frequency,setFrequency]=useState('2'),[impressionCap,setImpressionCap]=useState(''),[priority,setPriority]=useState('0');

  const[placementCode,setPlacementCode]=useState(''),[surface,setSurface]=useState('explore'),[slot,setSlot]=useState('results_inline'),[placementActive,setPlacementActive]=useState(true),[ownerEnabled,setOwnerEnabled]=useState(true);
  const[placementPriority,setPlacementPriority]=useState('0'),[placementFrequency,setPlacementFrequency]=useState('3'),[format,setFormat]=useState('native_card'),[contextRules,setContextRules]=useState('{}');

  const load=useCallback(async()=>{
    const next=await getOwnerSponsorshipSnapshot();
    setData(next);setMessage('');
  },[]);
  useEffect(()=>{load().catch(e=>setMessage(e instanceof Error?e.message:String(e))).finally(()=>setBusy(false));},[load]);
  async function refresh(){setRefreshing(true);try{await load()}catch(e){setMessage(e instanceof Error?e.message:String(e))}finally{setRefreshing(false)}}

  const pending=useMemo(()=>data?.campaigns.filter(c=>c.submission_status==='submitted')??[],[data]);
  const campaigns=useMemo(()=>data?.campaigns??[],[data]);
  const placements=useMemo(()=>data?.placements??[],[data]);

  const targeting=useMemo(()=>{const t:Record<string,unknown>={};if(region.trim())t.coarse_region=region.trim();if(route.trim())t.route_context=route.trim();if(csv(amenities).length)t.amenities=csv(amenities);if(timeBucket.trim())t.time_bucket=timeBucket.trim();if(csv(interests).length)t.broad_interests=csv(interests);return t},[region,route,amenities,timeBucket,interests]);

  function resetCampaign(){setEditingCampaign(null);setName('');setSponsor('Kleenest');setHeadline('');setBody('');setCta('Learn more');setUrl('');setStatus('draft');setStartsAt('');setEndsAt('');setPlacementCodes('');setRegion('');setRoute('');setAmenities('');setTimeBucket('');setInterests('');setFrequency('2');setImpressionCap('');setPriority('0')}
  function editCampaign(c:OwnerSponsoredCampaign){setEditingCampaign(c.id);setName(c.name||'');setSponsor(c.sponsor_name||'');setHeadline(c.headline||'');setBody(c.body||'');setCta(c.cta_label||'Learn more');setUrl(c.destination_url||'');setStatus(c.status);setStartsAt(c.starts_at||'');setEndsAt(c.ends_at||'');setPlacementCodes((c.placements||[]).join(', '));const t=c.targeting||{};setRegion(String(t.coarse_region||''));setRoute(String(t.route_context||''));setAmenities(Array.isArray(t.amenities)?t.amenities.join(', '):'');setTimeBucket(String(t.time_bucket||''));setInterests(Array.isArray(t.broad_interests)?t.broad_interests.join(', '):'');setFrequency(String(c.frequency_cap_daily??2));setImpressionCap(c.impression_cap_total==null?'':String(c.impression_cap_total));setPriority(String(c.owner_priority??0))}
  async function saveCampaign(){
    if(!name.trim()||!sponsor.trim()||!headline.trim()||!url.trim()||!csv(placementCodes).length){setMessage('Campaign name, sponsor, headline, HTTPS destination and at least one placement are required.');return}
    setBusy(true);try{
      await saveOwnerSponsoredCampaign({id:editingCampaign,name:name.trim(),sponsorName:sponsor.trim(),headline:headline.trim(),body:body.trim(),ctaLabel:cta.trim()||'Learn more',destinationUrl:url.trim(),status,startsAt:startsAt.trim()||null,endsAt:endsAt.trim()||null,targeting,frequencyCapDaily:num(frequency,2),impressionCapTotal:impressionCap.trim()?num(impressionCap):null,ownerPriority:num(priority),placementCodes:csv(placementCodes),reason});
      setMessage(editingCampaign?'Campaign updated.':'Owner campaign created.');resetCampaign();await load();
    }catch(e){setMessage(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
  }
  async function lifecycle(c:OwnerSponsoredCampaign,next:'active'|'paused'|'ended'){
    setBusy(true);try{await saveOwnerSponsoredCampaign({id:c.id,name:c.name,sponsorName:c.sponsor_name,headline:c.headline,body:c.body||'',ctaLabel:c.cta_label,destinationUrl:c.destination_url,targetLocationId:c.target_location_id,status:next,startsAt:c.starts_at,endsAt:c.ends_at,targeting:c.targeting||{},frequencyCapDaily:c.frequency_cap_daily,impressionCapTotal:c.impression_cap_total,ownerPriority:c.owner_priority,placementCodes:c.placements||[],reason});setMessage(`Campaign ${next}.`);await load()}catch(e){setMessage(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
  }
  async function review(c:OwnerSponsoredCampaign,decision:'approve'|'reject'){
    setBusy(true);try{await reviewOwnerSponsoredCampaign(c.id,decision,reviewNote,reason);setMessage(decision==='approve'?'Campaign approved and activated.':'Campaign rejected for revision.');setReviewNote('');await load()}catch(e){setMessage(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
  }
  async function archive(c:OwnerSponsoredCampaign){
    setBusy(true);try{await archiveOwnerSponsoredCampaign(c.id,reason);setMessage('Campaign archived. Historical metrics were preserved.');await load()}catch(e){setMessage(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
  }
  async function toggleServing(){
    if(!data)return;setBusy(true);try{await setOwnerSponsoredServing(!data.sponsored_serving_enabled,reason);setMessage(data.sponsored_serving_enabled?'Kleenest Sponsored serving paused globally.':'Kleenest Sponsored serving enabled globally.');await load()}catch(e){setMessage(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
  }

  function editPlacement(p:OwnerAdPlacement){setPlacementCode(p.placement_code);setSurface(p.surface);setSlot(p.slot);setPlacementActive(p.active);setOwnerEnabled(p.owner_enabled);setPlacementPriority(String(p.priority??0));setPlacementFrequency(String(p.frequency_cap_daily??3));setFormat(p.format||'native_card');setContextRules(JSON.stringify(p.context_rules||{},null,2))}
  function resetPlacement(){setPlacementCode('');setSurface('explore');setSlot('results_inline');setPlacementActive(true);setOwnerEnabled(true);setPlacementPriority('0');setPlacementFrequency('3');setFormat('native_card');setContextRules('{}')}
  async function savePlacement(){
    let rules:Record<string,unknown>={};try{rules=JSON.parse(contextRules||'{}')}catch{setMessage('Placement context rules must be valid JSON.');return}
    if(!placementCode.trim()||!surface.trim()||!slot.trim()){setMessage('Placement code, surface and slot are required.');return}
    setBusy(true);try{await saveOwnerAdPlacement({placementCode:placementCode.trim(),surface:surface.trim(),slot:slot.trim(),active:placementActive,priority:num(placementPriority),frequencyCapDaily:num(placementFrequency,3),format:format.trim()||'native_card',contextRules:rules,ownerEnabled,reason});setMessage('Placement saved.');resetPlacement();await load()}catch(e){setMessage(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
  }

  if(busy&&!data)return <View style={{flex:1,justifyContent:'center',backgroundColor:theme.canvas}}><ActivityIndicator size="large"/></View>;
  return <ScrollView contentInsetAdjustmentBehavior="automatic" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh}/>} keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:16,gap:16,paddingBottom:96,backgroundColor:theme.canvas}}>
    <OSHero eyebrow="KLEENESTOS · MONETIZATION CONTROL" title="Sponsored Advertising" body="Govern every Kleenest Sponsored placement and campaign without allowing paid inventory to alter trust, freshness, verification, or organic ranking.">
      <StatusPill label={data?.sponsored_serving_enabled?'SERVING ENABLED':'GLOBAL PAUSE'} tone={data?.sponsored_serving_enabled?'good':'warning'}/>
      <StatusPill label={`${data?.pending_review_count??0} awaiting review`} tone={(data?.pending_review_count??0)>0?'warning':'good'}/>
    </OSHero>

    {message?<View style={{...osCard,borderColor:theme.warning,backgroundColor:theme.surfaceRaised}}><Text style={{fontWeight:'900',color:theme.ink}}>{message}</Text></View>:null}

    <View style={{...osCard,gap:9,backgroundColor:theme.surface}}>
      <SectionHeader title="Network serving" body="$5 Remove Ads disables AdMob/network inventory only. Kleenest Sponsored remains contextual platform inventory unless you pause it here."/>
      <Field label="Audit reason" value={reason} set={setReason} placeholder="Why this change is being made"/>
      <Action label={data?.sponsored_serving_enabled?'Pause Kleenest Sponsored globally':'Enable Kleenest Sponsored globally'} onPress={toggleServing} disabled={busy}/>
    </View>

    <View style={{gap:9}}>
      <SectionHeader title="Campaigns awaiting approval" body="Business-created sponsorship cannot serve until Owner approves it."/>
      {pending.length?<><Field label="Review note to business" value={reviewNote} set={setReviewNote} placeholder="Optional approval/rejection note" multiline/>{pending.map(c=><View key={c.id} style={{...osCard,gap:7,backgroundColor:theme.surface}}>
        <Text style={{fontSize:18,fontWeight:'900',color:theme.ink}}>{c.headline}</Text><Text style={{color:theme.muted}}>{c.business_name||c.sponsor_name} · {c.name}</Text>
        <Text style={{color:theme.ink}}>{c.body||'No body copy'}</Text><Text style={{color:theme.muted}}>{(c.placements||[]).join(' · ')||'No placement'} · cap {c.frequency_cap_daily}/day</Text>
        <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}><Action label="Approve + activate" onPress={()=>review(c,'approve')} disabled={busy}/><Action label="Reject for revision" onPress={()=>review(c,'reject')} disabled={busy}/><Action label="Edit as Owner" onPress={()=>editCampaign(c)} disabled={busy}/></View>
      </View>)}</>:<View style={{...osCard,backgroundColor:theme.surface}}><Text style={{color:theme.muted}}>No business campaigns are waiting for review.</Text></View>}
    </View>

    <View style={{...osCard,gap:10,backgroundColor:theme.surface}}>
      <SectionHeader title={editingCampaign?'Edit sponsored campaign':'Create Owner campaign'} body="Create Kleenest-managed inventory or override an existing campaign. Use archive instead of destructive deletion once a campaign has history."/>
      <Field label="Campaign name" value={name} set={setName}/><Field label="Sponsor name" value={sponsor} set={setSponsor}/><Field label="Headline" value={headline} set={setHeadline}/><Field label="Body" value={body} set={setBody} multiline/><Field label="CTA" value={cta} set={setCta}/><Field label="HTTPS destination URL" value={url} set={setUrl}/>
      <Text style={{fontWeight:'900',color:theme.ink}}>Status</Text><View style={{flexDirection:'row',gap:7,flexWrap:'wrap'}}>{(['draft','active','paused','ended'] as const).map(v=><Action key={v} label={status===v?`✓ ${human(v)}`:human(v)} onPress={()=>setStatus(v)}/>)}</View>
      <Field label="Start ISO timestamp (optional)" value={startsAt} set={setStartsAt} placeholder="2026-09-22T12:00:00-05:00"/><Field label="End ISO timestamp (optional)" value={endsAt} set={setEndsAt}/><Field label="Placement codes (comma-separated)" value={placementCodes} set={setPlacementCodes} placeholder="explore_results_inline, progress_inline"/>
      <Text style={{fontWeight:'900',color:theme.ink}}>Contextual targeting</Text><Field label="Coarse region" value={region} set={setRegion}/><Field label="Route context" value={route} set={setRoute}/><Field label="Amenities" value={amenities} set={setAmenities}/><Field label="Time bucket" value={timeBucket} set={setTimeBucket}/><Field label="Broad interests" value={interests} set={setInterests}/>
      <Field label="Frequency cap / day" value={frequency} set={setFrequency}/><Field label="Total impression cap (optional)" value={impressionCap} set={setImpressionCap}/><Field label="Owner priority" value={priority} set={setPriority}/>
      <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}><Action label={editingCampaign?'Save campaign changes':'Create Owner campaign'} onPress={saveCampaign} disabled={busy}/>{editingCampaign?<Action label="Cancel edit" onPress={resetCampaign}/>:null}</View>
    </View>

    <View style={{gap:9}}>
      <SectionHeader title="All active records" body="Owner can edit, pause, reactivate, end, or archive any campaign across the network."/>
      {campaigns.map(c=>{const ctr=c.impressions>0?((c.clicks/c.impressions)*100).toFixed(1):'0.0';return <View key={c.id} style={{...osCard,gap:6,backgroundColor:theme.surface}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',gap:10}}><View style={{flex:1}}><Text style={{fontSize:17,fontWeight:'900',color:theme.ink}}>{c.headline}</Text><Text style={{color:theme.muted}}>{c.business_name||c.sponsor_name} · {human(c.submission_status)} · {human(c.status)}</Text></View><StatusPill label={c.status.toUpperCase()} tone={c.status==='active'?'good':c.status==='paused'?'warning':undefined}/></View>
        <Text style={{color:theme.muted}}>{c.impressions||0} impressions · {c.clicks||0} clicks · {c.dismissals||0} dismissals · {ctr}% CTR</Text>
        {c.review_note?<Text style={{color:theme.muted}}>Review note: {c.review_note}</Text>:null}
        <View style={{flexDirection:'row',gap:7,flexWrap:'wrap'}}><Action label="Edit" onPress={()=>editCampaign(c)}/>{c.status!=='active'?<Action label="Activate" onPress={()=>lifecycle(c,'active')}/>:<Action label="Pause" onPress={()=>lifecycle(c,'paused')}/>}<Action label="End" onPress={()=>lifecycle(c,'ended')}/><Action label="Archive" onPress={()=>archive(c)}/></View>
      </View>})}
    </View>

    <View style={{...osCard,gap:10,backgroundColor:theme.surface}}>
      <SectionHeader title="Placement CRUD" body="Create or edit sponsored inventory. Disable a placement instead of deleting it so historical attribution stays intact. Hero inventory is protected from sponsorship."/>
      <Field label="Placement code" value={placementCode} set={setPlacementCode} placeholder="explore_results_inline"/><Field label="Surface" value={surface} set={setSurface} placeholder="explore"/><Field label="Slot" value={slot} set={setSlot} placeholder="results_inline"/><Field label="Format" value={format} set={setFormat}/><Field label="Priority" value={placementPriority} set={setPlacementPriority}/><Field label="Frequency cap / day" value={placementFrequency} set={setPlacementFrequency}/><Field label="Context rules JSON" value={contextRules} set={setContextRules} multiline/>
      <View style={{flexDirection:'row',gap:7,flexWrap:'wrap'}}><Action label={placementActive?'✓ Active':'Inactive'} onPress={()=>setPlacementActive(v=>!v)}/><Action label={ownerEnabled?'✓ Owner enabled':'Owner disabled'} onPress={()=>setOwnerEnabled(v=>!v)}/><Action label="Save placement" onPress={savePlacement} disabled={busy}/><Action label="Clear form" onPress={resetPlacement}/></View>
    </View>

    <View style={{gap:9}}>
      <SectionHeader title="Sponsored inventory" body="Every configured placement and its serving state."/>
      {placements.map(p=><Pressable key={p.placement_code} onPress={()=>editPlacement(p)} style={{...osCard,gap:4,backgroundColor:theme.surface}}>
        <Text style={{fontWeight:'900',fontSize:16,color:theme.ink}}>{human(p.placement_code)}</Text><Text style={{color:theme.muted}}>{p.surface} · {p.slot} · priority {p.priority} · cap {p.frequency_cap_daily}/day</Text><Text style={{color:p.active&&p.owner_enabled?theme.good:theme.warning,fontWeight:'900'}}>{p.active&&p.owner_enabled?'SERVING-ELIGIBLE':'DISABLED'} · tap to edit</Text>
      </Pressable>)}
    </View>
  </ScrollView>;
}
