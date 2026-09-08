import fs from 'node:fs';

const auth=fs.readFileSync('app/auth.tsx','utf8');
const supabase=fs.readFileSync('src/lib/supabase.ts','utf8');
const config=fs.readFileSync('app.config.ts','utf8');
const required=(source,token,label)=>{if(!source.includes(token))throw new Error(`${label} missing ${token}`)};

required(config,"scheme: 'kleenest-owner'",'Owner native config');
required(auth,"Linking.createURL('auth'",'Owner auth');
required(auth,"isTripleSlashed:false",'Owner auth');
required(auth,"redirectTo:ownerRedirect",'Owner Google auth');
required(auth,"skipBrowserRedirect:true",'Owner Google auth');
required(auth,"exchangeCodeForSession(code)",'Owner auth callback');
required(supabase,"flowType:'pkce'",'Owner Supabase client');

if(auth.includes("Linking.createURL('/auth'"))throw new Error('Owner OAuth callback must not use a leading-slash path that can drift from the allow-listed native URI.');
if(/Kleenest_Architecture|github\.io\/Kleenest_Architecture/i.test(auth+supabase))throw new Error('Owner native auth must never target the Architecture web deployment.');

console.log('Owner native auth redirect audit passed.');
