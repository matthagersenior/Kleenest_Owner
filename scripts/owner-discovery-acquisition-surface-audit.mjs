import fs from 'node:fs';

const files=[
  'app/index.tsx',
  'app/operations.tsx',
  'app/data.tsx',
  'src/services/ownerOperations.ts',
];
const read=path=>fs.readFileSync(path,'utf8');
const combined=files.map(read).join('\n');
const failures=[];

for(const token of [
  'National ingestion control',
  'Ingestion scheduler is inactive',
  'setIngestionResumeAuthorization',
  'admin_set_national_ingestion_resume_authorization',
  'admin_national_ingestion_status',
  'national_ingestion_markets',
  'national_ingestion_runs',
  'label="Ingestion"',
]){
  if(combined.includes(token)) failures.push('legacy ingestion surface remains: '+token);
}

const index=read('app/index.tsx');
const operations=read('app/operations.tsx');
for(const [source,token,label] of [
  [index,'label="Discovery"','command center Discovery card'],
  [index,'live Discovery grows canonical locations','command center Discovery authority copy'],
  [operations,'Interactive Discovery is the canonical acquisition path','Platform Health acquisition authority'],
  [operations,'value="DISCOVERY"','Platform Health Discovery status'],
]){
  if(!source.includes(token)) failures.push(label+' missing '+token);
}

if(failures.length){
  console.error('Owner Discovery acquisition surface audit failed:');
  for(const failure of failures) console.error('- '+failure);
  process.exit(1);
}
console.log('Owner Discovery acquisition surface audit passed: KleenestOS is Discovery-first and legacy national-ingestion controls are retired.');
