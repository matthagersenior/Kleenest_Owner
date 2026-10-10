import { useCallback,useEffect,useMemo,useState } from 'react';
import { ActivityIndicator,Pressable,RefreshControl,ScrollView,Text,View } from 'react-native';
import { DiagnosticDisclosure,HealthCard,OSHero,PrimaryAction,SectionHeader,StatusPill,useOSCardStyle } from '@/components/KleenestOS';
import { getOwnerIngestionControl,repairStalledIngestion,runBoundedIngestionCycle,setCoverageMarketEnabled,setGlobalIngestionPaused,setIngestionSourceEnabled,setIdleDemandIngestionEnabled,updateTileIngestionPolicy } from '@/services/ownerIngestion';
import { useOwnerTheme } from '@/services/theme';

type Snapshot=Record<string,unknown>;
type Row=Record<string,unknown>;

const SOURCE_LABELS:Record<string,string>={
  osm:'OpenStreetMap / Overpass',
  overture:'Overture Places',
  data_gov:'Government & civic data',
};

function object(value:unknown):Row{return value&&typeof value==='object'&&!Array.isArray(value)?value as Row:{}}
function array(value:unknown):Row[]{return Array.isArray(value)?value.filter(v=>v&&typeof v==='object') as Row[]:[]}
function bool(value:unknown){return value===true||value==='true'}
function num(value:unknown){const n=Number(value??0);return Number.isFinite(n)?n:0}
function text(value:unknown){return value==null?'':String(value)}
function pct(value:unknown){return `${Math.round(num(value)*100)}%`}

export default function IngestionControl(){
  const theme=useOwnerTheme();
  const card=useOSCardStyle();
  const[data,setData]=useState<Snapshot|null>(null),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[busy,setBusy]=useState<string|null>(null),[error,setError]=useState<string|null>(null),[errorHeading,setErrorHeading]=useState('Telemetry unavailable'),[notice,setNotice]=useState<string|null>(null);

  const load=useCallback(async()=>{setData(await getOwnerIngestionControl())},[]);
  useEffect(()=>{load().catch(c=>setError(c instanceof Error?c.message:String(c))).finally(()=>setLoading(false))},[load]);

  async function refresh(){setRefreshing(true);setError(null);try{await load();setNotice(null)}catch(c){setErrorHeading('Telemetry refresh failed');setError(c instanceof Error?c.message:String(c))}finally{setRefreshing(false)}}
  async function act(key:string,fn:()=>Promise<unknown>){setBusy(key);setError(null);setNotice(null);try{await fn()}catch(c){setErrorHeading('Control action failed');setError(c instanceof Error?c.message:String(c));setBusy(null);return}try{await load();setNotice('Control action completed.')}catch(c){setErrorHeading('Action completed; telemetry refresh failed');setError(c instanceof Error?c.message:String(c));setNotice('The control action succeeded. Pull to refresh its displayed status.')}finally{setBusy(null)}}

  const hasSnapshot=data!==null;
  const status=object(data?.status);
  const storage=object(data?.storage_guard ?? status.storage_guard);
  const capacity=object(data?.capacity);
  const canonical=object(data?.canonical);
  const capacityPolicy=object(data?.capacity_policy);
  const background=object(data?.background);
  const pipeline=object(data?.pipeline);
  const marketStatus=object(status.markets);
  const sources=array(data?.sources);
  const markets=array(data?.markets);
  const history=array(data?.history);
  const paused=bool(storage.paused);
  const currentSources=useMemo(()=>sources.filter(row=>Object.hasOwn(SOURCE_LABELS,text(row.source_key))),[sources]);
  const sourceByKey=useMemo(()=>Object.fromEntries(currentSources.map(row=>[text(row.source_key),row])),[currentSources]);
  const coverageEnabled=bool(sourceByKey.overture?.enabled);
  const enrichmentEnabled=bool(sourceByKey.data_gov?.enabled);
  const visibleMarkets=useMemo(()=>markets.filter(row=>text(row.status)!=='complete').slice(0,12),[markets]);
  const runningMarkets=num(marketStatus.running);
  const pendingMarkets=num(marketStatus.pending);
  const failedMarkets=num(marketStatus.failed);
  const completedMarkets=num(marketStatus.completed ?? marketStatus.complete);
  const backgroundAllowed=bool(capacity.allow_background_ingestion);
  const idleDemandEnabled=bool(capacityPolicy.idle_demand_enabled ?? capacity.idle_demand_enabled);
  const capacityMode=text(capacity.mode)||'unknown';
  const backgroundPercent=num(capacity.background_percent);
  const backgroundReason=text(capacity.reason)||'live capacity unavailable';
  const enabledBackgroundSources=num(background.enabled_sources);
  const dueBackgroundSources=num(background.due_sources);
  const pressure=storage.pressure_fraction ?? storage.observed_fraction;
  const capacityDetail=backgroundAllowed
    ? 'Spare capacity available for background work'
    : backgroundReason==='active_discovery'
      ? 'Yielding to active Discovery traffic'
      : backgroundReason==='production_busy'
        ? 'Yielding to production traffic'
        : backgroundReason==='long_running_query'
          ? 'Yielding to a long-running database task'
          : backgroundReason==='storage_guard'
            ? 'Storage guard is holding background work'
            : `Waiting: ${backgroundReason.replace(/_/g,' ')}`;

  if(loading)return <View style={{flex:1,justifyContent:'center',backgroundColor:theme.canvas}}><ActivityIndicator size="large" color={theme.accent}/></View>;

  return <ScrollView style={{backgroundColor:theme.canvas}} contentInsetAdjustmentBehavior="automatic" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[theme.accent]} tintColor={theme.accent}/>} contentContainerStyle={{padding:16,gap:16,paddingBottom:84,backgroundColor:theme.canvas}}>
    <OSHero eyebrow="KLEENESTOS · INGESTION" title="Ingestion Control" body="One operating surface for Discovery, coverage expansion, refresh/verification, and enrichment. Retired implementation generations stay out of the daily Owner workflow.">
      <StatusPill label={!hasSnapshot?'INGESTION STATUS UNAVAILABLE':paused?'BACKGROUND INGESTION PAUSED':backgroundAllowed?'BACKGROUND INGESTION ALLOWED':'BACKGROUND INGESTION YIELDING'} tone={!hasSnapshot?'neutral':paused?'warning':backgroundAllowed?'good':'warning'}/>
    </OSHero>

    {error?<View style={{...card,borderColor:theme.danger}}><Text style={{color:theme.danger,fontWeight:'900'}}>{errorHeading}</Text><Text selectable style={{color:theme.danger}}>{error}</Text></View>:null}
    {notice?<View style={card}><Text style={{color:theme.ink}}>{notice}</Text></View>:null}

    <View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>
      <HealthCard label="Canonical locations" value={canonical.total==null?'—':num(canonical.total).toLocaleString()} tone={canonical.total==null?'warning':'good'} detail={canonical.total==null?'Telemetry unavailable — pull to retry':`+${num(canonical.added_1h).toLocaleString()} last hour · +${num(canonical.added_24h).toLocaleString()} last 24h · refreshed ${text(canonical.generated_at)||'recently'}`}/>
      <HealthCard label="Global" value={!hasSnapshot?'Unavailable':paused?'Paused':backgroundAllowed?'Allowed':'Yielding'} tone={!hasSnapshot?'warning':paused?'warning':backgroundAllowed?'good':'neutral'} detail={!hasSnapshot?'Live status could not be loaded':paused?text(storage.pause_reason)||'Owner/storage guard pause':capacityDetail}/>
      <HealthCard label="Coverage" value={coverageEnabled?'Ready':'Off'} tone={coverageEnabled?'good':'warning'} detail="Overture-backed expansion"/>
      <HealthCard label="Pipeline backlog" value={!hasSnapshot?'—':`${num(pipeline.pending_rows).toLocaleString()} rows`} tone={!hasSnapshot||num(pipeline.failed_batches)?'warning':'good'} detail={!hasSnapshot?'Live pipeline unavailable':`${num(pipeline.pending_batches)} staged batches · ${num(pipeline.completed_1h)} completed last hour`}/>
      <HealthCard label="Background" value={!hasSnapshot?'Unavailable':enabledBackgroundSources? `${enabledBackgroundSources} sources` : 'Idle'} tone={hasSnapshot&&dueBackgroundSources&&backgroundAllowed?'good':'neutral'} detail={!hasSnapshot?'Live background status unavailable':`${dueBackgroundSources} due now · ${capacityMode} mode · ${backgroundPercent}% background capacity`}/>
      <HealthCard label="Storage use" value={pressure==null?'—':pct(pressure)} tone={paused?'warning':'neutral'} detail={pressure==null?'Live storage telemetry unavailable':`Pause at ${pct(storage.pause_fraction)} · hard stop ${pct(storage.hard_stop_fraction)}`}/>
    </View>

    <View style={{...card,gap:10}}>
      <SectionHeader title="Master controls" body="These controls act on the real ingestion scheduler and safety guard. Discovery search itself remains usable while background work is paused."/>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
        <PrimaryAction label={busy==='idle-demand'?'Working…':idleDemandEnabled?'Idle-demand acceleration ON':'Enable idle-demand acceleration'} danger={idleDemandEnabled} disabled={!!busy||!hasSnapshot} onPress={()=>act('idle-demand',()=>setIdleDemandIngestionEnabled(!idleDemandEnabled))}/>
        <PrimaryAction label={busy==='global'?'Working…':paused?'Resume background ingestion':'Pause background ingestion'} danger={!paused} disabled={!!busy||!hasSnapshot} onPress={()=>act('global',()=>setGlobalIngestionPaused(!paused))}/>
        <PrimaryAction label={busy==='cycle'?'Starting…':backgroundAllowed?'Run one bounded cycle':'Waiting for spare capacity'} disabled={!!busy||!hasSnapshot||paused||!backgroundAllowed} onPress={()=>act('cycle',runBoundedIngestionCycle)}/>
        <PrimaryAction label={busy==='repair'?'Repairing…':'Repair stalled cells'} disabled={!!busy} onPress={()=>act('repair',repairStalledIngestion)}/>
      </View>
    </View>

    <View style={{gap:9}}>
      <SectionHeader title="Four ingestion lanes" body="The Owner view is organized by purpose instead of old function/version names."/>
      <View style={{...card}}>
        <StatusPill label="DISCOVERY" tone="good"/><Text style={{fontSize:18,fontWeight:'900',color:theme.ink}}>Interactive discovery</Text><Text style={{color:theme.muted,lineHeight:19}}>User searches query canonical places first; low-coverage areas can queue bounded external hydration and persist through canonical identity matching.</Text>
      </View>
      <View style={{...card}}>
        <StatusPill label="COVERAGE EXPANSION" tone={coverageEnabled&&!paused?'good':'warning'}/><Text style={{fontSize:18,fontWeight:'900',color:theme.ink}}>Fill geographic gaps</Text><Text style={{color:theme.muted,lineHeight:19}}>Overture and coverage priorities expand underserved markets without competing with active Discovery traffic.</Text>
      </View>
      <View style={{...card}}>
        <StatusPill label="REFRESH & VERIFY" tone={failedMarkets?'warning':'good'}/><Text style={{fontSize:18,fontWeight:'900',color:theme.ink}}>Keep canonical places healthy</Text><Text style={{color:theme.muted,lineHeight:19}}>Retry stalled cells, revisit incomplete coverage, and keep source identity attached to the existing canonical location instead of creating another pin.</Text>
      </View>
      <View style={{...card}}>
        <StatusPill label="CORRECTIONS & ENRICHMENT" tone={enrichmentEnabled?'good':'neutral'}/><Text style={{fontSize:18,fontWeight:'900',color:theme.ink}}>Improve what already exists</Text><Text style={{color:theme.muted,lineHeight:19}}>Government/civic feeds and trusted observations add evidence, amenities, verification and corrections without becoming separate map truth.</Text>
      </View>
    </View>

    <View style={{gap:9}}>
      <SectionHeader title="Current data sources" body="Only current ingestion authorities are exposed here. Retired v2/v3/v4/v5 implementation channels are intentionally hidden."/>
      {currentSources.length?currentSources.map(row=>{
        const key=text(row.source_key),enabled=bool(row.enabled),actionKey=`source:${key}`;
        return <View key={key} style={{...card}}>
          <View style={{flexDirection:'row',justifyContent:'space-between',gap:10,alignItems:'center'}}>
            <View style={{flex:1,gap:4}}><Text style={{fontSize:17,fontWeight:'900',color:theme.ink}}>{SOURCE_LABELS[key]??key}</Text><Text style={{color:theme.muted}}>Priority {num(row.priority)} · {text(row.quota_mode)||'managed'} · max {num(row.max_requests_per_cycle)||1}/cycle</Text></View>
            <StatusPill label={enabled?'ON':'OFF'} tone={enabled?'good':'neutral'}/>
          </View>
          <PrimaryAction label={busy===actionKey?'Working…':enabled?'Pause source':'Enable source'} danger={enabled} disabled={!!busy} onPress={()=>act(actionKey,()=>setIngestionSourceEnabled(key,!enabled))}/>
        </View>
      }):<View style={card}><Text style={{color:theme.muted}}>No current source policies were returned.</Text></View>}
    </View>

    <View style={{gap:9}}>
      <SectionHeader title="Coverage priorities" body="Top incomplete markets only. Completed markets and retired source-channel details stay out of the way."/>
      {visibleMarkets.length?visibleMarkets.map(row=>{
        const id=text(row.id),name=text(row.name)||text(row.market_key),state=text(row.state_code),statusText=text(row.status)||'pending',enabled=statusText!=='blocked',priority=Math.max(1,num(row.priority)||100),actionKey=`market:${id}`;
        return <View key={id} style={{...card}}>
          <View style={{flexDirection:'row',justifyContent:'space-between',gap:10,alignItems:'center'}}>
            <View style={{flex:1,gap:3}}><Text style={{fontWeight:'900',fontSize:16,color:theme.ink}}>{name}{state?`, ${state}`:''}</Text><Text style={{color:theme.muted}}>Priority {priority} · {statusText}{row.current_source?` · ${text(row.current_source)}`:''}</Text></View>
            <StatusPill label={enabled?statusText.toUpperCase():'PAUSED'} tone={statusText==='failed'?'danger':statusText==='running'?'good':enabled?'neutral':'warning'}/>
          </View>
          <Pressable disabled={!!busy||statusText==='running'} onPress={()=>act(actionKey,()=>setCoverageMarketEnabled({marketId:id,priority,enabled:!enabled,name}))} style={{alignSelf:'flex-start',paddingVertical:8,paddingHorizontal:11,borderRadius:10,borderWidth:1,borderColor:theme.line,opacity:busy||statusText==='running'?.5:1}}><Text style={{fontWeight:'900',color:theme.accent}}>{busy===actionKey?'Working…':enabled?'Pause priority':'Resume priority'}</Text></Pressable>
        </View>
      }):<View style={card}><Text style={{color:theme.muted}}>No incomplete coverage priorities are waiting.</Text></View>}
    </View>

    <View style={{gap:9}}>
      <SectionHeader title="Audit & diagnostics" body="Raw control-plane state stays available when you need it, but it no longer dominates the Owner experience."/>
      <DiagnosticDisclosure title="ingestion control snapshot" value={data}/>
      <DiagnosticDisclosure title="recent ingestion control history" value={history}/>
    </View>
  </ScrollView>
}
