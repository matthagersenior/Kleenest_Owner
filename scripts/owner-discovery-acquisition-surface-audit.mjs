import fs from 'node:fs';

const files=[
  'app/index.tsx',
  'app/control.tsx',
  'app/operations.tsx',
  'app/ingestion.tsx',
  'src/services/ownerIngestion.ts',
];
const read=path=>fs.readFileSync(path,'utf8');
const combined=files.map(read).join('\n');
const failures=[];

for(const token of [
  'public-data-ingest-v2',
  'public-data-ingest-v3',
  'public-data-ingest-v4',
  'market-bathroom-ingest-v2',
  'market-bathroom-ingest-v3',
  'market-bathroom-ingest-v4',
  'market-bathroom-ingest-v5',
  'ingest-map-candidates-v2',
  'ingest-map-candidates-v3',
  'admin_set_national_ingestion_resume_authorization',
]){
  if(combined.includes(token)) failures.push('retired implementation channel leaked into Owner UX: '+token);
}

const index=read('app/index.tsx');
const control=read('app/control.tsx');
const ingestion=read('app/ingestion.tsx');
const service=read('src/services/ownerIngestion.ts');
const operations=read('app/operations.tsx');

for(const [source,token,label] of [
  [index,"['/ingestion', 'Ingestion Control'","command center ingestion route"],
  [control,"['/ingestion','Ingestion Control'","control center ingestion route"],
  [ingestion,'Four ingestion lanes','four-lane operating model'],
  [ingestion,'Interactive discovery','Discovery lane'],
  [ingestion,'Fill geographic gaps','coverage lane'],
  [ingestion,'Keep canonical places healthy','refresh/verification lane'],
  [ingestion,'Improve what already exists','corrections/enrichment lane'],
  [ingestion,'Pause background ingestion','global pause control'],
  [ingestion,'Run one bounded cycle','bounded cycle control'],
  [ingestion,'Repair stalled cells','repair control'],
  [service,'owner_ingestion_control_snapshot','owner ingestion snapshot RPC'],
  [service,'owner_set_ingestion_global_pause','audited global pause RPC'],
  [service,'owner_update_ingestion_source_policy','source policy RPC'],
  [service,'owner_update_ingestion_market','coverage market RPC'],
  [operations,'dedicated Ingestion Control center','Platform Health handoff'],
]){
  if(!source.includes(token)) failures.push(label+' missing '+token);
}

if(failures.length){
  console.error('Owner ingestion control surface audit failed:');
  for(const failure of failures) console.error('- '+failure);
  process.exit(1);
}
console.log('Owner ingestion control surface audit passed: four-lane controls are visible and retired implementation channels stay hidden.');
