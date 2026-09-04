import * as Linking from 'expo-linking';
import { useEffect,useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable,ScrollView,Text,TextInput,View } from 'react-native';
import { getSupabaseClient } from '@/lib/supabase';
import { signInOwner } from '@/services/controlPlane';
import { getOwnerAuthorization } from '@/services/ownerAuthorization';

const ownerRedirect=Linking.createURL('/auth',{scheme:'kleenest-owner'});

type AuthMode='signin'|'signup';
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
  return 'Owner authentication could not be completed. Please try again.';
}

async function authorizeOwnerSession(){
 const authorization=await getOwnerAuthorization();
 if(!authorization.authorized){await getSupabaseClient().auth.signOut({scope:'local'});throw new Error('This account exists, but it is not authorized for KleenestOS yet.');}
 return authorization;
}

export default function OwnerSignIn(){
  const router=useRouter();
  const[mode,setMode]=useState<AuthMode>('signin');
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');
  const[confirmPassword,setConfirmPassword]=useState('');
  const[showPassword,setShowPassword]=useState(false);
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState<string|null>(null);
  const[notice,setNotice]=useState<string|null>(null);

  async function finishAuth(url:string|null){
    if(!url)return false;
    const parsed=Linking.parse(url);
    const code=typeof parsed.queryParams?.code==='string'?parsed.queryParams.code:'';
    if(!code)return false;
    setBusy(true);setError(null);setNotice(null);
    const supabase=getSupabaseClient();
    try{
      const {error:exchangeError}=await supabase.auth.exchangeCodeForSession(code);
      if(exchangeError)throw exchangeError;
      await authorizeOwnerSession();
      router.replace('/');
      return true;
    }catch(c){
      await supabase.auth.signOut({scope:'local'});
      setError(messageOf(c));
      return false;
    }finally{setBusy(false);}
  }
  useEffect(()=>{void Linking.getInitialURL().then(finishAuth);const sub=Linking.addEventListener('url',event=>{void finishAuth(event.url)});return()=>sub.remove();},[]);

  async function signIn(){
    setBusy(true);setError(null);setNotice(null);
    try{await signInOwner(email,password);await authorizeOwnerSession();router.replace('/');}
    catch(c){setError(messageOf(c));}
    finally{setBusy(false);}
  }

  async function signUp(){
    const cleanEmail=email.trim();
    if(!cleanEmail||!password)return;
    if(password.length<8){setError('Use at least 8 characters for the owner account password.');return;}
    if(password!==confirmPassword){setError('The passwords do not match.');return;}
    setBusy(true);setError(null);setNotice(null);
    const client=getSupabaseClient();
    try{
      const {data,error:signupError}=await client.auth.signUp({email:cleanEmail,password,options:{emailRedirectTo:ownerRedirect}});
      if(signupError)throw signupError;
      if(data.session){
        try{await authorizeOwnerSession();router.replace('/');return;}
        catch{await client.auth.signOut({scope:'local'});}
      }
      setNotice('Account created. Confirm your email if prompted. KleenestOS owner/admin authority is granted separately, so creating an account does not unlock platform controls by itself.');
      setMode('signin');setPassword('');setConfirmPassword('');
    }catch(c){setError(messageOf(c));}
    finally{setBusy(false);}
  }

  async function google(){
    if(busy)return;
    setBusy(true);setError(null);setNotice(null);
    try{
      const {data,error:authError}=await getSupabaseClient().auth.signInWithOAuth({provider:'google',options:{redirectTo:ownerRedirect,skipBrowserRedirect:true}});
      if(authError)throw authError;
      if(!data.url)throw new Error('Google sign-in did not return an authorization URL.');
      await Linking.openURL(data.url);
    }catch(c){setError(messageOf(c));}
    finally{setBusy(false);}
  }

  const creating=mode==='signup';
  const submitDisabled=busy||!email.trim()||!password||(creating&&!confirmPassword);
  return <ScrollView contentContainerStyle={{flexGrow:1,justifyContent:'center',padding:24,backgroundColor:'#f5f8f6'}} keyboardShouldPersistTaps="handled">
    <View style={{gap:14}}>
      <View style={{backgroundColor:'#132b21',borderRadius:20,padding:18,gap:6}}>
        <Text style={{color:'#bcd4c5',fontSize:11,fontWeight:'900',letterSpacing:1.8}}>KLEENESTOS OWNER CONTROL CENTER</Text>
        <Text style={{color:'white',fontSize:30,fontWeight:'900'}}>KleenestOS</Text>
        <Text style={{color:'#dce9e1',lineHeight:20}}>Private platform operating system</Text>
      </View>
      <View style={{flexDirection:'row',gap:8}}>
        <ModeButton label="Sign in" active={!creating} onPress={()=>{setMode('signin');setError(null);setNotice(null);}}/>
        <ModeButton label="Create account" active={creating} onPress={()=>{setMode('signup');setError(null);setNotice(null);}}/>
      </View>
      <Text style={{fontSize:24,fontWeight:'800',color:'#132b21'}}>{creating?'Create owner account':'Owner sign in'}</Text>
      <Text style={{color:'#607067',lineHeight:21}}>{creating?'Create the Supabase identity used for KleenestOS. Account creation never grants platform authority automatically; owner/admin access remains controlled by the backend.':'KleenestOS verifies your server authorization tier after authentication. Platform owners receive mutation controls; admins receive only the authority allowed by the backend.'}</Text>
      {error?<Text accessibilityLiveRegion="polite" style={{color:'#9b2c2c'}}>{error}</Text>:null}
      {notice?<View style={{backgroundColor:'#e6f3eb',borderRadius:14,padding:12}}><Text accessibilityLiveRegion="polite" style={{color:'#22563c',lineHeight:20}}>{notice}</Text></View>:null}
      <Pressable disabled={busy} onPress={google} style={{backgroundColor:'white',borderWidth:1,borderColor:'#ccd9d1',padding:14,borderRadius:14}}><Text style={{fontWeight:'900',textAlign:'center',color:'#132b21'}}>Continue with Google</Text></Pressable>
      <View style={{gap:6}}><Text style={label}>Owner email</Text><TextInput accessibilityLabel="Owner email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" placeholder="owner@example.com" placeholderTextColor="#7f8d85" style={input}/></View>
      <View style={{gap:6}}><Text style={label}>Owner password</Text><View style={passwordRow}><TextInput accessibilityLabel="Owner password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete={creating?'new-password':'current-password'} textContentType={creating?'newPassword':'password'} placeholder={creating?'Create a password':'Enter owner password'} placeholderTextColor="#7f8d85" style={passwordInput}/><Pressable accessibilityRole="button" accessibilityLabel={showPassword?'Hide password':'Show password'} onPress={()=>setShowPassword(value=>!value)} style={visibilityButton}><Text style={visibilityText}>{showPassword?'Hide':'Show'}</Text></Pressable></View></View>
      {creating?<View style={{gap:6}}><Text style={label}>Confirm password</Text><TextInput accessibilityLabel="Confirm owner password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" placeholder="Re-enter password" placeholderTextColor="#7f8d85" style={input}/></View>:null}
      <Pressable disabled={submitDisabled} onPress={creating?signUp:signIn} style={{backgroundColor:'#132b21',padding:15,borderRadius:14,opacity:submitDisabled?0.5:1}}><Text style={{color:'white',fontWeight:'900',textAlign:'center'}}>{busy?'Working…':creating?'Create owner account':'Sign in to KleenestOS'}</Text></Pressable>
    </View>
  </ScrollView>
}
function ModeButton({label,active,onPress}:{label:string;active:boolean;onPress:()=>void}){return <Pressable accessibilityRole="button" accessibilityState={{selected:active}} onPress={onPress} style={{flex:1,paddingVertical:11,borderRadius:999,backgroundColor:active?'#132b21':'#e7eee9',alignItems:'center'}}><Text style={{fontWeight:'900',color:active?'white':'#31483c'}}>{label}</Text></Pressable>}
const label={fontSize:12,fontWeight:'900',color:'#31483c'} as const;
const input={borderWidth:1,borderColor:'#ccd9d1',borderRadius:14,paddingHorizontal:14,paddingVertical:13,backgroundColor:'white',color:'#132b21'} as const;
const passwordRow={flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:'#ccd9d1',borderRadius:14,backgroundColor:'white',overflow:'hidden'} as const;
const passwordInput={flex:1,paddingHorizontal:14,paddingVertical:13,color:'#132b21'} as const;
const visibilityButton={alignSelf:'stretch',justifyContent:'center',paddingHorizontal:16,borderLeftWidth:1,borderLeftColor:'#e0e8e3',backgroundColor:'#eef4f0'} as const;
const visibilityText={fontSize:12,fontWeight:'900',color:'#132b21'} as const;
