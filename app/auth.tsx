import * as Linking from 'expo-linking';
import { useEffect,useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable,ScrollView,Text,TextInput,View } from 'react-native';
import { getSupabaseClient } from '@/lib/supabase';
import { signInOwner } from '@/services/controlPlane';

const googleRedirect=Linking.createURL('/auth',{scheme:'kleenest-owner'});

function messageOf(value:unknown){
  if(value instanceof Error&&value.message)return value.message;
  if(value&&typeof value==='object'){
    const candidate=value as Record<string,unknown>;
    for(const key of ['message','error_description','details','hint','code']){
      const text=candidate[key];
      if(typeof text==='string'&&text.trim())return text;
    }
  }
  if(typeof value==='string'&&value.trim())return value;
  return 'Owner sign-in could not be completed. Please try again.';
}

async function authorizeOwnerSession(){const supabase=getSupabaseClient();const {data,error}=await supabase.auth.getUser();if(error)throw error;const user=data.user;if(!user)throw new Error('Owner sign-in returned no authenticated user.');const {data:profile,error:profileError}=await supabase.from('profiles').select('role,is_admin,is_platform_owner').eq('id',user.id).maybeSingle();if(profileError)throw profileError;if(!profile?.is_platform_owner&&!profile?.is_admin&&String(profile?.role??'').toLowerCase()!=='admin'){await supabase.auth.signOut({scope:'local'});throw new Error('This account is not authorized for the Kleenest Owner control plane.');}}

export default function OwnerSignIn(){
  const router=useRouter();
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');
  const[showPassword,setShowPassword]=useState(false);
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState<string|null>(null);
  async function finishGoogle(url:string|null){if(!url)return false;const parsed=Linking.parse(url);const code=typeof parsed.queryParams?.code==='string'?parsed.queryParams.code:'';if(!code)return false;setBusy(true);setError(null);const supabase=getSupabaseClient();try{const {error:exchangeError}=await supabase.auth.exchangeCodeForSession(code);if(exchangeError)throw exchangeError;await authorizeOwnerSession();router.replace('/');return true;}catch(c){await supabase.auth.signOut({scope:'local'});setError(messageOf(c));return false;}finally{setBusy(false);}}
  useEffect(()=>{void Linking.getInitialURL().then(finishGoogle);const sub=Linking.addEventListener('url',event=>{void finishGoogle(event.url)});return()=>sub.remove();},[]);
  async function signIn(){setBusy(true);setError(null);try{await signInOwner(email,password);router.replace('/')}catch(c){setError(messageOf(c))}finally{setBusy(false)}}
  async function google(){if(busy)return;setBusy(true);setError(null);try{const {data,error:authError}=await getSupabaseClient().auth.signInWithOAuth({provider:'google',options:{redirectTo:googleRedirect,skipBrowserRedirect:true}});if(authError)throw authError;if(!data.url)throw new Error('Google sign-in did not return an authorization URL.');await Linking.openURL(data.url);}catch(c){setError(messageOf(c));}finally{setBusy(false);}}
  return <ScrollView contentContainerStyle={{flexGrow:1,justifyContent:'center',padding:24,backgroundColor:'#f5f8f6'}} keyboardShouldPersistTaps="handled">
    <View style={{gap:14}}>
      <View style={{backgroundColor:'#132b21',borderRadius:20,padding:18,gap:6}}>
        <Text style={{color:'#bcd4c5',fontSize:11,fontWeight:'900',letterSpacing:1.8}}>OWNER CONTROL CENTER</Text>
        <Text style={{color:'white',fontSize:30,fontWeight:'900'}}>Kleenest Owner</Text>
        <Text style={{color:'#dce9e1',lineHeight:20}}>Private platform administration app</Text>
      </View>
      <Text style={{fontSize:24,fontWeight:'800',color:'#132b21'}}>Owner sign in</Text>
      <Text style={{color:'#607067',lineHeight:21}}>This private app verifies platform-owner or administrator authority after authentication. Unauthorized sessions are immediately signed out.</Text>
      {error?<Text accessibilityLiveRegion="polite" style={{color:'#9b2c2c'}}>{error}</Text>:null}
      <Pressable disabled={busy} onPress={google} style={{backgroundColor:'white',borderWidth:1,borderColor:'#ccd9d1',padding:14,borderRadius:14}}><Text style={{fontWeight:'900',textAlign:'center',color:'#132b21'}}>Continue with Google</Text></Pressable>
      <View style={{gap:6}}><Text style={label}>Owner email</Text><TextInput accessibilityLabel="Owner email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="owner@example.com" placeholderTextColor="#7f8d85" style={input}/></View>
      <View style={{gap:6}}><Text style={label}>Owner password</Text><View style={passwordRow}><TextInput accessibilityLabel="Owner password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} placeholder="Enter owner password" placeholderTextColor="#7f8d85" style={passwordInput}/><Pressable accessibilityRole="button" accessibilityLabel={showPassword?'Hide password':'Show password'} onPress={()=>setShowPassword(value=>!value)} style={visibilityButton}><Text style={visibilityText}>{showPassword?'Hide':'Show'}</Text></Pressable></View></View>
      <Pressable disabled={busy||!email.trim()||!password} onPress={signIn} style={{backgroundColor:'#132b21',padding:15,borderRadius:14,opacity:(busy||!email.trim()||!password)?0.5:1}}><Text style={{color:'white',fontWeight:'900',textAlign:'center'}}>{busy?'Verifying owner access…':'Sign in to Kleenest Owner'}</Text></Pressable>
    </View>
  </ScrollView>
}
const label={fontSize:12,fontWeight:'900',color:'#31483c'} as const;
const input={borderWidth:1,borderColor:'#ccd9d1',borderRadius:14,paddingHorizontal:14,paddingVertical:13,backgroundColor:'white',color:'#132b21'} as const;
const passwordRow={flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:'#ccd9d1',borderRadius:14,backgroundColor:'white',overflow:'hidden'} as const;
const passwordInput={flex:1,paddingHorizontal:14,paddingVertical:13,color:'#132b21'} as const;
const visibilityButton={alignSelf:'stretch',justifyContent:'center',paddingHorizontal:16,borderLeftWidth:1,borderLeftColor:'#e0e8e3',backgroundColor:'#eef4f0'} as const;
const visibilityText={fontSize:12,fontWeight:'900',color:'#132b21'} as const;
