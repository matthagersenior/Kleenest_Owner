import fs from 'node:fs';
const requiredRoutes=['audit','capabilities','intelligence','reports','data'];
const layout=fs.readFileSync(new URL('../app/_layout.tsx',import.meta.url),'utf8');
const service=fs.readFileSync(new URL('../src/services/controlPlane.ts',import.meta.url),'utf8');
for(const route of requiredRoutes){if(!fs.existsSync(new URL(`../app/${route}.tsx`,import.meta.url)))throw new Error(`Missing Owner route: ${route}`);if(!layout.includes(`name="${route}"`))throw new Error(`Owner route is not registered: ${route}`)}
for(const rpc of['run_capability_audit','admin_raw_schema_capability_audit','check_single_capability_per_domain','admin_crud_gateway','business_growth_analytics','get_fleet_dashboard_summary','get_enterprise_network_metrics'])if(!service.includes(`'${rpc}'`))throw new Error(`Missing canonical Owner authority: ${rpc}`);
console.log(`Owner parity audit passed: ${requiredRoutes.length} Architecture-backed control-plane routes and canonical authorities verified.`);
