import fs from 'node:fs';

const auth=fs.readFileSync('app/auth.tsx','utf8');
const supabase=fs.readFileSync('src/lib/supabase.ts','utf8');
const config=fs.readFileSync('app.config.ts','utf8');
const envExample=fs.readFileSync('.env.example','utf8');
const pagesWorkflow=fs.readFileSync('.github/workflows/pages.yml','utf8');
const required=(source,token,label)=>{if(!source.includes(token))throw new Error(`${label} missing ${token}`)};

required(config,"scheme: 'kleenest-owner'",'Owner native config');
required(config,"process.env.EXPO_PUBLIC_WEB_BASE_URL || '/'",'Owner web base URL');
required(config,'baseUrl: webBaseUrl','Owner web base URL');
required(auth,"Linking.createURL('auth'",'Owner auth');
required(auth,"isTripleSlashed:false",'Owner auth');
required(auth,"Platform.OS==='web'",'Owner web auth');
required(auth,"https://os.kleenest.us",'Owner canonical web origin');
required(auth,"redirectTo:ownerRedirect",'Owner Google auth');
required(auth,"skipBrowserRedirect:true",'Owner Google auth');
required(auth,"exchangeCodeForSession(code)",'Owner auth callback');
required(supabase,"flowType:'pkce'",'Owner Supabase client');
required(envExample,'EXPO_PUBLIC_OWNER_WEB_ORIGIN=https://os.kleenest.us','Owner environment contract');
required(envExample,'EXPO_PUBLIC_WEB_BASE_URL=/','Owner environment contract');
required(pagesWorkflow,'actions/upload-pages-artifact@v3','Owner Pages deployment');
required(pagesWorkflow,'actions/deploy-pages@v4','Owner Pages deployment');
required(pagesWorkflow,'EXPO_PUBLIC_OWNER_WEB_ORIGIN: https://os.kleenest.us','Owner Pages canonical origin');
required(pagesWorkflow,'EXPO_PUBLIC_WEB_BASE_URL: /','Owner Pages root base URL');

if(auth.includes("Linking.createURL('/auth'"))throw new Error('Owner OAuth callback must not use a leading-slash path that can drift from the allow-listed native URI.');
if(/github\.io\/Kleenest_Owner/i.test(auth+config+envExample))throw new Error('Owner production web auth/base configuration must not target the legacy GitHub Pages repository path.');
if(/Kleenest_Architecture|github\.io\/Kleenest_Architecture/i.test(auth+supabase))throw new Error('Owner native auth must never target the Architecture web deployment.');

console.log('Owner auth and canonical web host audit passed.');
