import { Link, Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { getSupabaseClient } from '@/lib/supabase';

export default function RootLayout(){
 const segments=useSegments();
 const[ready,setReady]=useState(false);
 const[signedIn,setSignedIn]=useState(false);
 useEffect(()=>{
  let mounted=true;
  const client=getSupabaseClient();
  client.auth.getSession().then(({data,error})=>{
   if(!mounted)return;
   setSignedIn(!error&&Boolean(data.session));
   setReady(true);
  }).catch(()=>{if(mounted){setSignedIn(false);setReady(true);}});
  const{data:listener}=client.auth.onAuthStateChange((_event,session)=>{
   if(mounted){setSignedIn(Boolean(session));setReady(true);}
  });
  return()=>{mounted=false;listener.subscription.unsubscribe();};
 },[]);
 if(!ready)return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#f4f6f5'}}><ActivityIndicator size="large"/></View>;
 const onAuth=segments[0]==='auth';
 if(!signedIn&&!onAuth)return <Redirect href="/auth"/>;
 return <><StatusBar style="auto"/><Stack screenOptions={{
  headerLargeTitle:true,
  headerShadowVisible:false,
  contentStyle:{backgroundColor:'#f4f6f5'},
  headerRight:()=>onAuth?null:<Link href="/search" asChild><Pressable accessibilityRole="button" accessibilityLabel="Search KleenestOS" hitSlop={10} style={{minWidth:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center',backgroundColor:'#17324d',borderWidth:1,borderColor:'#35516b'}}><Text style={{fontSize:19,color:'#f7c85e'}}>⌕</Text></Pressable></Link>
}}><Stack.Screen name="index" options={{title:'KleenestOS'}}/><Stack.Screen name="auth" options={{title:'Owner Sign In',presentation:'modal'}}/><Stack.Screen name="access" options={{title:'People & Access'}}/><Stack.Screen name="businesses" options={{title:'Businesses & Network'}}/><Stack.Screen name="progression" options={{title:'Economy'}}/><Stack.Screen name="creator-missions" options={{title:'Creator Missions'}}/><Stack.Screen name="moderation" options={{title:'Trust & Moderation'}}/><Stack.Screen name="operations" options={{title:'Operations'}}/><Stack.Screen name="audit" options={{title:'System Audit'}}/><Stack.Screen name="capabilities" options={{title:'System Capabilities'}}/><Stack.Screen name="intelligence" options={{title:'Intelligence Lab'}}/><Stack.Screen name="reports" options={{title:'Reporting'}}/><Stack.Screen name="search" options={{title:'Search',headerLargeTitle:false,headerRight:()=>null}}/><Stack.Screen name="email-notifications" options={{title:'Email Notifications'}}/><Stack.Screen name="data" options={{title:'Data Workbench'}}/></Stack></>;
}
