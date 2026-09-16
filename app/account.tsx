import { Link,router } from 'expo-router';
import { useEffect,useState } from 'react';
import { Pressable,ScrollView,Text,View } from 'react-native';
import { OSHero,SectionHeader,StatusPill,useOSCardStyle } from '@/components/KleenestOS';
import { getSupabaseClient } from '@/lib/supabase';
import { getOwnerAuthorization } from '@/services/ownerAuthorization';
import { OWNER_THEME_OPTIONS,getOwnerThemeMode,setOwnerThemeMode,type OwnerThemeMode,useOwnerTheme } from '@/services/theme';

export default function OwnerAccount(){
  const theme=useOwnerTheme();const card=useOSCardStyle();
  const[email,setEmail]=useState(''),[name,setName]=useState(''),[authority,setAuthority]=useState(''),[mode,setMode]=useState<OwnerThemeMode>(getOwnerThemeMode()),[message,setMessage]=useState('');
  useEffect(()=>setMode(theme.mode),[theme.mode]);
  useEffect(()=>{let active=true;(async()=>{const client=getSupabaseClient();const{data}=await client.auth.getUser();if(!active)return;setEmail(data.user?.email||'');setName(String(data.user?.user_metadata?.full_name||data.user?.user_metadata?.name||data.user?.user_metadata?.kleenest_name||''));try{const a=await getOwnerAuthorization();if(active)setAuthority(a.is_platform_owner?'Platform Owner':a.is_admin?'Administrator':'Unauthorized')}catch{if(active)setAuthority('Unauthorized')}})();return()=>{active=false}},[]);
  async function choose(next:OwnerThemeMode){setMode(next);await setOwnerThemeMode(next);setMessage((OWNER_THEME_OPTIONS.find(x=>x.value===next)?.label??next)+' applied.')}
  async function signOut(){await getSupabaseClient().auth.signOut({scope:'local'});router.replace('/auth')}
  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{padding:16,gap:16,paddingBottom:84,backgroundColor:theme.canvas}}>
    <OSHero eyebrow="KLEENESTOS · OWNER PROFILE" title="Profile & Themes" body="Your Owner identity, appearance and personal workspace settings stay reachable regardless of which operating screen you are using.">
      <StatusPill label={authority||'OWNER ACCOUNT'} tone={authority==='Unauthorized'?'warning':'good'}/>
    </OSHero>

    <View style={card}>
      <Text style={{fontSize:20,fontWeight:'900',color:theme.ink}}>{name||'Kleenest Owner'}</Text>
      <Text style={{color:theme.muted}}>{email||'Signed-in Owner account'}</Text>
      <Text style={{color:theme.muted}}>Authority: {authority||'Checking…'}</Text>
    </View>

    <View style={{gap:9}}>
      <SectionHeader title="Themes" body="Owner override keeps every Kleenest theme available here. Selection persists on this device."/>
      <View style={{...card,gap:10}}>
        {OWNER_THEME_OPTIONS.map(option=>{
          const selected=mode===option.value;
          return <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{selected}} onPress={()=>void choose(option.value)} style={{padding:12,borderRadius:14,borderWidth:1,borderColor:selected?theme.accent:theme.line,backgroundColor:selected?theme.accentSoft:theme.surfaceRaised,gap:3}}>
            <View style={{flexDirection:'row',justifyContent:'space-between',gap:10}}>
              <Text style={{fontWeight:'900',color:selected?theme.accent:theme.ink,flex:1}}>{option.label}</Text>
              {selected?<Text style={{fontWeight:'900',color:theme.accent}}>Equipped</Text>:null}
            </View>
            <Text style={{color:theme.muted,lineHeight:18}}>{option.description}</Text>
          </Pressable>
        })}
      </View>
    </View>

    <View style={{gap:9}}>
      <SectionHeader title="Owner shortcuts"/>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
        <Link href="/email-notifications" asChild><Pressable style={{...card,padding:12}}><Text style={{fontWeight:'900',color:theme.accent}}>Email Notifications</Text></Pressable></Link>
        <Link href="/search" asChild><Pressable style={{...card,padding:12}}><Text style={{fontWeight:'900',color:theme.accent}}>Search</Text></Pressable></Link>
        <Link href="/progression" asChild><Pressable style={{...card,padding:12}}><Text style={{fontWeight:'900',color:theme.accent}}>Progression</Text></Pressable></Link>
      </View>
    </View>

    {message?<Text accessibilityLiveRegion="polite" style={{color:theme.success,fontWeight:'800'}}>{message}</Text>:null}
    <Pressable onPress={signOut} style={{...card,alignSelf:'stretch',alignItems:'center'}}><Text style={{fontWeight:'900',color:theme.danger}}>Sign out</Text></Pressable>
  </ScrollView>;
}
