import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getSupabaseClient } from '@/lib/supabase';

export default function RootLayout(){
 const router=useRouter();
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
 useEffect(()=>{
  if(!ready)return;
  const onAuth=segments[0]==='auth';
  if(!signedIn&&!onAuth)router.replace('/auth');
 },[ready,signedIn,segments,router]);
 if(!ready)return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#f4f6f5'}}><ActivityIndicator size="large"/></View>;
 return <><StatusBar style="auto"/><Stack screenOptions={{headerLargeTitle:true,headerShadowVisible:false,contentStyle:{backgroundColor:'#f4f6f5'}}}><Stack.Screen name="index" options={{title:'KleenestOS'}}/><Stack.Screen name="auth" options={{title:'Owner Sign In',presentation:'modal'}}/><Stack.Screen name="access" options={{title:'People & Access'}}/><Stack.Screen name="businesses" options={{title:'Businesses & Network'}}/><Stack.Screen name="progression" options={{title:'Economy'}}/><Stack.Screen name="moderation" options={{title:'Trust & Moderation'}}/><Stack.Screen name="operations" options={{title:'Operations'}}/><Stack.Screen name="audit" options={{title:'System Audit'}}/><Stack.Screen name="capabilities" options={{title:'System Capabilities'}}/><Stack.Screen name="intelligence" options={{title:'Intelligence Lab'}}/><Stack.Screen name="reports" options={{title:'Reporting'}}/><Stack.Screen name="data" options={{title:'Data Workbench'}}/></Stack></>;
}
