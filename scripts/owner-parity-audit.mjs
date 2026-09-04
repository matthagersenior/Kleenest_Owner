import fs from 'node:fs';
const requiredRoutes=['auth','audit','capabilities','intelligence','reports','data'];
const layout=fs.readFileSync(new URL('../app/_layout.tsx',import.meta.url),'utf8');
const service=fs.readFileSync(new URL('../src/services/controlPlane.ts',import.meta.url),'utf8');
const auth=fs.readFileSync(new URL('../app/auth.tsx',import.meta.url),'utf8');
const authCompact=(service+'\n'+auth).replace(/\s+/g,'');
for(const route of requiredRoutes){if(!fs.existsSync(new URL(`../app/${route}.tsx`,import.meta.url)))throw new Error(`Missing Owner route: ${route}`);if(!layout.includes(`name="${route}"`))throw new Error(`Owner route is not registered: ${route}`)}
for(const rpc of['run_capability_audit','admin_raw_schema_capability_audit','check_single_capability_per_domain','admin_crud_gateway','business_growth_analytics','get_fleet_dashboard_summary','get_enterprise_network_metrics'])if(!service.includes(`'${rpc}'`))throw new Error(`Missing canonical Owner authority: ${rpc}`);
if(!service.includes('signInWithPassword')||!service.includes('is_platform_owner')||!service.includes("signOut({scope:'local'})"))throw new Error('Owner login does not enforce platform authority');
for(const token of ['OWNER CONTROL CENTER','KleenestOS','showPassword','secureTextEntry={!showPassword}','Show password','Hide password'])if(!auth.includes(token))throw new Error(`Owner sign-in visibility contract missing ${token}`);
for(const token of ['Continue with Google','signInWithOAuth','exchangeCodeForSession','Linking.createURL','Linking.openURL','authorizeOwnerSession'])if(!(service+'\n'+auth).includes(token))throw new Error(`Owner Google auth contract missing ${token}`);
if(!authCompact.includes("provider:'google'")&&!authCompact.includes('provider:"google"'))throw new Error('Owner Google auth must use the Supabase google provider');
if(!authCompact.includes('skipBrowserRedirect:true'))throw new Error('Owner Google auth must use native browser handoff');
console.log(`Owner parity audit passed: ${requiredRoutes.length} Architecture-backed control-plane routes, canonical authorities and guarded Google OAuth verified.`);