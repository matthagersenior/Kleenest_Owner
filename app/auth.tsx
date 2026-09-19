import * as Linking from 'expo-linking';
import { useEffect,useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable,ScrollView,Text,TextInput,View } from 'react-native';
import { getSupabaseClient } from '@/lib/supabase';
import { signInOwner } from '@/services/controlPlane';
import { getOwnerAuthorization } from '@/services/ownerAuthorization';
import { useOwnerTheme } from '@/services/theme';

const ownerRedirect=Linking.createURL('auth',{scheme:'kleenest-owner',isTripleSlashed:false});

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
  const theme=useOwnerTheme();
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
  const fieldStyle={borderWidth:1,borderColor:theme.line,borderRadius:14,paddingHorizontal:14,paddingVertical:13,backgroundColor:theme.surfaceRaised,color:theme.ink} as const;
  const labelStyle={fontSize:12,fontWeight:'900',color:theme.ink} as const;
  return <ScrollView style={{backgroundColor:theme.canvas}} contentContainerStyle={{flexGrow:1,justifyContent:'center',padding:24,backgroundColor:theme.canvas}} keyboardShouldPersistTaps="handled">
    <View style={{gap:14}}>
      <View style={{backgroundColor:theme.accent,borderRadius:20,padding:18,gap:6,borderWidth:1,borderColor:theme.accent}}>
        <Text style={{color:theme.accentText,fontSize:11,fontWeight:'900',letterSpacing:1.8,opacity:.82}}>KLEENESTOS OWNER CONTROL CENTER</Text>
        <Text style={{color:theme.accentText,fontSize:30,fontWeight:'900'}}>KleenestOS</Text>
        <Text style={{color:theme.accentText,lineHeight:20,opacity:.9}}>Private platform operating system</Text>
      </View>
      <View style={{flexDirection:'row',gap:8}}>
        <ModeButton label="Sign in" active={!creating} onPress={()=>{setMode('signin');setError(null);setNotice(null);}}/>
        <ModeButton label="Create account" active={creating} onPress={()=>{setMode('signup');setError(null);setNotice(null);}}/>
      </View>
      <Text style={{fontSize:24,fontWeight:'800',color:theme.ink}}>{creating?'Create owner account':'Owner sign in'}</Text>
      <Text style={{color:theme.muted,lineHeight:21}}>{creating?'Create the Supabase identity used for KleenestOS. Account creation never grants platform authority automatically; owner/admin access remains controlled by the backend.':'KleenestOS verifies your server authorization tier after authentication. Platform owners receive mutation controls; admins receive only the authority allowed by the backend.'}</Text>
      {error?<Text accessibilityLiveRegion="polite" style={{color:theme.danger}}>{error}</Text>:null}
      {notice?<View style={{backgroundColor:theme.success+'18',borderRadius:14,padding:12,borderWidth:1,borderColor:theme.success+'55'}}><Text accessibilityLiveRegion="polite" style={{color:theme.success,lineHeight:20}}>{notice}</Text></View>:null}
      <Pressable disabled={busy} onPress={google} style={{backgroundColor:theme.surface,borderWidth:1,borderColor:theme.line,padding:14,borderRadius:14}}><Text style={{fontWeight:'900',textAlign:'center',color:theme.ink}}>Continue with Google</Text></Pressable>
      <View style={{gap:6}}><Text style={labelStyle}>Owner email</Text><TextInput accessibilityLabel="Owner email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" placeholder="owner@example.com" placeholderTextColor={theme.muted} style={fieldStyle}/></View>
      <View style={{gap:6}}><Text style={labelStyle}>Owner password</Text><View style={{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:theme.line,borderRadius:14,backgroundColor:theme.surfaceRaised,overflow:'hidden'}}><TextInput accessibilityLabel="Owner password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete={creating?'new-password':'current-password'} textContentType={creating?'newPassword':'password'} placeholder={creating?'Create a password':'Enter owner password'} placeholderTextColor={theme.muted} style={{flex:1,paddingHorizontal:14,paddingVertical:13,color:theme.ink}}/><Pressable accessibilityRole="button" accessibilityLabel={showPassword?'Hide password':'Show password'} onPress={()=>setShowPassword(value=>!value)} style={{alignSelf:'stretch',justifyContent:'center',paddingHorizontal:16,borderLeftWidth:1,borderLeftColor:theme.line,backgroundColor:theme.surface}}><Text style={{fontSize:12,fontWeight:'900',color:theme.accent}}>{showPassword?'Hide':'Show'}</Text></Pressable></View></View>
      {creating?<View style={{gap:6}}><Text style={labelStyle}>Confirm password</Text><TextInput accessibilityLabel="Confirm owner password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" placeholder="Re-enter password" placeholderTextColor={theme.muted} style={fieldStyle}/></View>:null}
      <Pressable disabled={submitDisabled} onPress={creating?signUp:signIn} style={{backgroundColor:theme.accent,padding:15,borderRadius:14,opacity:submitDisabled?0.5:1}}><Text style={{color:theme.accentText,fontWeight:'900',textAlign:'center'}}>{busy?'Working…':creating?'Create owner account':'Sign in to KleenestOS'}</Text></Pressable>
    </View>
  </ScrollView>
}
function ModeButton({label,active,onPress}:{label:string;active:boolean;onPress:()=>void}){const theme=useOwnerTheme();return <Pressable accessibilityRole="button" accessibilityState={{selected:active}} onPress={onPress} style={{flex:1,paddingVertical:11,borderRadius:999,backgroundColor:active?theme.accent:theme.surfaceRaised,borderWidth:1,borderColor:active?theme.accent:theme.line,alignItems:'center'}}><Text style={{fontWeight:'900',color:active?theme.accentText:theme.ink}}>{label}</Text></Pressable>}
