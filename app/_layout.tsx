import { Redirect,Tabs,useRouter,useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect,useState } from 'react';
import { ActivityIndicator,Pressable,Text,View,type ColorValue } from 'react-native';
import { getSupabaseClient } from '@/lib/supabase';
import { useOwnerTheme } from '@/services/theme';

function TabIcon({symbol,color}:{symbol:string;color:ColorValue}){return <Text style={{fontSize:18,fontWeight:'900',color}}>{symbol}</Text>}

export default function RootLayout(){
 const theme=useOwnerTheme();
 const router=useRouter();
 const segments=useSegments();
 const[ready,setReady]=useState(false);
 const[signedIn,setSignedIn]=useState(false);
 const onAuth=segments[0]==='auth';
 const onSearch=segments[0]==='search';
 const onAccount=segments[0]==='account';

 useEffect(()=>{
  let mounted=true;
  const client=getSupabaseClient();
  client.auth.getSession().then(({data,error})=>{if(!mounted)return;setSignedIn(!error&&Boolean(data.session));setReady(true)}).catch(()=>{if(mounted){setSignedIn(false);setReady(true)}});
  const{data:listener}=client.auth.onAuthStateChange((_event,session)=>{if(mounted){setSignedIn(Boolean(session));setReady(true)}});
  return()=>{mounted=false;listener.subscription.unsubscribe()};
 },[]);

 if(!ready)return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:theme.canvas}}><ActivityIndicator size="large"/></View>;
 if(!signedIn&&!onAuth)return <Redirect href="/auth"/>;

 return <>
  <StatusBar style={theme.statusBar}/>
  <Tabs screenOptions={{
    headerStyle:{backgroundColor:theme.canvas},
    sceneStyle:{backgroundColor:theme.canvas},
    headerShadowVisible:false,
    headerTitleStyle:{color:theme.ink,fontWeight:'900'},
    tabBarActiveTintColor:theme.accent,
    tabBarInactiveTintColor:theme.muted,
    tabBarLabelStyle:{fontWeight:'800',fontSize:10},
    tabBarStyle:onAuth?{display:'none'}:{backgroundColor:theme.surface,borderTopColor:theme.line},
    headerRight:()=>onAuth?null:<View style={{flexDirection:'row',gap:7,marginRight:8}}>
      {!onSearch?<Pressable accessibilityRole="button" accessibilityLabel="Search KleenestOS" onPress={()=>router.push('/search')} style={{paddingHorizontal:10,paddingVertical:7,borderRadius:999,backgroundColor:theme.surfaceRaised,borderWidth:1,borderColor:theme.line}}><Text style={{fontWeight:'900',color:theme.accent}}>⌕ Search</Text></Pressable>:null}
      {!onAccount?<Pressable accessibilityRole="button" accessibilityLabel="Open Owner profile and themes" onPress={()=>router.push('/account')} style={{paddingHorizontal:10,paddingVertical:7,borderRadius:999,backgroundColor:theme.accentSoft,borderWidth:1,borderColor:theme.line}}><Text style={{fontWeight:'900',color:theme.accent}}>Profile</Text></Pressable>:null}
    </View>
  }}>
    <Tabs.Screen name="index" options={{title:'Home',tabBarIcon:({color})=><TabIcon symbol="⌂" color={color}/>}}/>
    <Tabs.Screen name="control" options={{title:'Control',tabBarIcon:({color})=><TabIcon symbol="◈" color={color}/>}}/>
    <Tabs.Screen name="pilots" options={{title:'Pilots',tabBarIcon:({color})=><TabIcon symbol="◆" color={color}/>}}/>
    <Tabs.Screen name="developer" options={{title:'Developer',tabBarIcon:({color})=><TabIcon symbol="⌘" color={color}/>}}/>
    <Tabs.Screen name="operations" options={{title:'Operations',tabBarIcon:({color})=><TabIcon symbol="⚙" color={color}/>}}/>

    <Tabs.Screen name="account" options={{href:null,title:'Profile & Themes'}}/>
    <Tabs.Screen name="search" options={{href:null,title:'Search'}}/>
    <Tabs.Screen name="auth" options={{href:null,title:'Owner Sign In',headerShown:false}}/>
    <Tabs.Screen name="access" options={{href:null,title:'People & Access'}}/>
    <Tabs.Screen name="businesses" options={{href:null,title:'Businesses & Network'}}/>
    <Tabs.Screen name="progression" options={{href:null,title:'Economy'}}/>
    <Tabs.Screen name="creator-missions" options={{href:null,title:'Creator Missions'}}/>
    <Tabs.Screen name="moderation" options={{href:null,title:'Trust & Moderation'}}/>
    <Tabs.Screen name="audit" options={{href:null,title:'System Audit'}}/>
    <Tabs.Screen name="capabilities" options={{href:null,title:'System Capabilities'}}/>
    <Tabs.Screen name="intelligence" options={{href:null,title:'Intelligence Lab'}}/>
    <Tabs.Screen name="reports" options={{href:null,title:'Reporting'}}/>
    <Tabs.Screen name="email-notifications" options={{href:null,title:'Email Notifications'}}/>
    <Tabs.Screen name="sponsored-ads" options={{href:null,title:'Sponsored Advertising'}}/>
    <Tabs.Screen name="data" options={{href:null,title:'Data Workbench'}}/>
  </Tabs>
 </>;
}
