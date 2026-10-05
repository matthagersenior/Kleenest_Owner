import { useEffect,useMemo,useState } from 'react';
import { ScrollView,Text,View } from 'react-native';
import { Action,ErrorBanner,Field,Hero,JsonPanel,colors } from '@/components/OwnerUI';
import { getCrudCapabilityCatalog,getSession,ownerCrudList } from '@/services/controlPlane';

type CrudCapability={resource:string};
type BusyState='catalog'|'load'|null;

export default function DataWorkbench(){
  const[catalog,setCatalog]=useState<CrudCapability[]>([]);
  const[resource,setResource]=useState('locations');
  const[loadedResource,setLoadedResource]=useState<string|null>(null);
  const[filter,setFilter]=useState('');
  const[data,setData]=useState<unknown>(null);
  const[busy,setBusy]=useState<BusyState>('catalog');
  const[error,setError]=useState<string|null>(null);

  const visibleResources=useMemo(()=>{
    const query=filter.trim().toLowerCase();
    return catalog
      .filter(item=>!query||item.resource.toLowerCase().includes(query))
      .slice(0,60);
  },[catalog,filter]);

  async function load(target=resource){
    if(!target)return;
    setResource(target);
    setBusy('load');
    setError(null);
    setData(null);
    try{
      if(!await getSession())throw new Error('Platform Owner authentication required.');
      const next=await ownerCrudList(target);
      setLoadedResource(target);
      setData(next);
    }catch(e){
      setLoadedResource(null);
      setError(e instanceof Error?e.message:String(e));
    }finally{
      setBusy(null);
    }
  }

  async function loadCatalog(){
    setBusy('catalog');
    setError(null);
    try{
      if(!await getSession())throw new Error('Platform Owner authentication required.');
      const raw=await getCrudCapabilityCatalog();
      const next=(Array.isArray(raw)?raw:[])
        .filter(item=>Boolean(item&&typeof item==='object'&&typeof (item as CrudCapability).resource==='string'))
        .map(item=>({resource:(item as CrudCapability).resource}));
      setCatalog(next);
      const preferred=next.find(item=>item.resource==='locations')??next[0];
      if(preferred)await load(preferred.resource);
      else setError('No approved canonical resources are currently exposed.');
    }catch(e){
      setCatalog([]);
      setError(e instanceof Error?e.message:String(e));
      setBusy(null);
    }
  }

  useEffect(()=>{void loadCatalog()},[]);

  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{padding:16,gap:14,paddingBottom:50}}>
    <Hero eyebrow="AUDITED ADMIN GATEWAY" title="Data workbench" body="Inspect approved canonical resources through owner-authorized operations with no direct security bypass."/>
    <ErrorBanner message={error}/>
    <Field
      value={filter}
      onChangeText={setFilter}
      autoCapitalize="none"
      placeholder={busy==='catalog'?'Loading approved resources…':'Filter approved resources'}
      accessibilityLabel="Filter approved canonical resources"
    />
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
      {visibleResources.map(item=><Action
        key={item.resource}
        label={resource===item.resource?`✓ ${item.resource}`:item.resource}
        disabled={busy!==null}
        onPress={()=>{void load(item.resource)}}
      />)}
    </View>
    {catalog.length===0&&busy==='catalog'
      ?<Text selectable style={{color:colors.muted,lineHeight:20}}>Loading the server-approved resource catalog…</Text>
      :null}
    {catalog.length>0&&visibleResources.length===0
      ?<Text selectable style={{color:colors.muted,lineHeight:20}}>No approved resources match that filter.</Text>
      :null}
    <Action
      label={busy==='load'?'Loading…':data!==null?`Refresh ${resource}`:`Load ${resource}`}
      disabled={busy!==null||!resource}
      onPress={()=>{void load()}}
    />
    {data!==null
      ?<JsonPanel title={loadedResource??resource} value={data}/>
      :busy===null&&!error
        ?<Text selectable style={{color:colors.muted,lineHeight:20}}>Tap any approved resource button to load its current server state. The selected resource is marked with a check.</Text>
        :null}
  </ScrollView>;
}
