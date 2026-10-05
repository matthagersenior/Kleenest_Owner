import { useState } from 'react';
import { ScrollView,Text,View } from 'react-native';
import { Action,ErrorBanner,Field,Hero,JsonPanel,colors } from '@/components/OwnerUI';
import { getSession,ownerCrudList } from '@/services/controlPlane';

const resources=['profiles','businesses','fleets','locations','support_requests','external_data_sources','external_data_datasets'] as const;
type Resource=(typeof resources)[number];

export default function DataWorkbench(){
  const[resource,setResource]=useState<Resource>('businesses');
  const[loadedResource,setLoadedResource]=useState<Resource|null>(null);
  const[data,setData]=useState<unknown>(null);
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState<string|null>(null);

  async function load(target:Resource=resource){
    setResource(target);
    setBusy(true);
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
      setBusy(false);
    }
  }

  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{padding:16,gap:14,paddingBottom:50}}>
    <Hero eyebrow="AUDITED ADMIN GATEWAY" title="Data workbench" body="Inspect approved canonical resources through owner-authorized operations with no direct security bypass."/>
    <ErrorBanner message={error}/>
    <Field
      value={resource}
      onChangeText={value=>setResource(value as Resource)}
      autoCapitalize="none"
      placeholder="Canonical resource"
      accessibilityLabel="Selected canonical resource"
    />
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
      {resources.map(value=><Action
        key={value}
        label={resource===value?`✓ ${value}`:value}
        disabled={busy}
        onPress={()=>{void load(value)}}
      />)}
    </View>
    <Action label={busy?'Loading…':data!==null?`Refresh ${resource}`:`Load ${resource}`} disabled={busy} onPress={()=>{void load()}}/>
    {data!==null
      ?<JsonPanel title={loadedResource??resource} value={data}/>
      :<Text selectable style={{color:colors.muted,lineHeight:20}}>Tap any resource button to load its current server state. Use the load button to refresh the selected resource.</Text>}
  </ScrollView>;
}
