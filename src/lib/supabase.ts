import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const secureStorage={getItem:(key:string)=>SecureStore.getItemAsync(key),setItem:(key:string,value:string)=>SecureStore.setItemAsync(key,value),removeItem:(key:string)=>SecureStore.deleteItemAsync(key)};
let singleton:SupabaseClient|null=null;
export function getSupabaseClient(){if(singleton)return singleton;const url=process.env.EXPO_PUBLIC_SUPABASE_URL;const key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;if(!url||!key)throw new Error('Missing Owner Supabase environment configuration.');singleton=createClient(url,key,{auth:{storage:secureStorage,autoRefreshToken:true,persistSession:true,detectSessionInUrl:false}});return singleton;}
