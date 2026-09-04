import fs from 'node:fs';

const failures=[];
const must=(condition,message)=>{if(!condition)failures.push(message)};
const exists=file=>fs.existsSync(new URL(`../${file}`,import.meta.url));
const read=file=>exists(file)?fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8'):'';

const required=[
  'src/services/ownerAuthorization.ts',
  'src/services/ownerSearch.ts',
  'src/services/ownerPeople.ts',
  'src/services/ownerBusinesses.ts',
  'src/services/ownerEconomy.ts',
  'src/services/ownerModeration.ts',
  'src/services/ownerOperations.ts',
  'src/components/KleenestOS.tsx',
  'app/businesses.tsx',
  'app/moderation.tsx',
  'app/index.tsx','app/access.tsx','app/operations.tsx','app/progression.tsx','app/_layout.tsx'
];
for(const file of required)must(exists(file),`missing KleenestOS file: ${file}`);

const auth=read('src/services/ownerAuthorization.ts');
const search=read('src/services/ownerSearch.ts');
const people=read('src/services/ownerPeople.ts');
const businesses=read('src/services/ownerBusinesses.ts');
const economy=read('src/services/ownerEconomy.ts');
const moderation=read('src/services/ownerModeration.ts');
const operations=read('src/services/ownerOperations.ts');
const home=read('app/index.tsx');
const access=read('app/access.tsx');
const businessUi=read('app/businesses.tsx');
const progression=read('app/progression.tsx');
const moderationUi=read('app/moderation.tsx');
const operationsUi=read('app/operations.tsx');
const layout=read('app/_layout.tsx');
const os=read('src/components/KleenestOS.tsx');

for(const token of ['admin_authorization_v1','getOwnerAuthorization','requirePlatformOwner','platform_owner'])must(auth.includes(token),`Owner authorization missing ${token}`);
for(const token of ['admin_user_search','searchOwnerUsers'])must((search+people).includes(token),`People search missing ${token}`);
for(const token of ['admin_set_user_access','setOwnerUserAccess'])must(people.includes(token),`People mutation missing ${token}`);
for(const token of ['searchOwnerBusinesses','admin_set_business_access','setOwnerBusinessAccess'])must(businesses.includes(token),`Business authority missing ${token}`);
for(const token of ['owner_progression_platform_snapshot','owner_progression_xp_action_catalog','owner_update_progression_xp_action','getOwnerEconomySnapshot'])must(economy.includes(token),`Economy service missing live authority ${token}`);
for(const token of ['admin_list_review_reports','admin_resolve_review_report','getOwnerModerationQueues'])must(moderation.includes(token),`Moderation service missing ${token}`);
for(const token of ['admin_national_ingestion_status','admin_set_national_ingestion_resume_authorization','getOwnerOperationsSnapshot'])must(operations.includes(token),`Operations service missing ${token}`);
for(const token of ['COMMAND CENTER','People & Access','Businesses & Network','Economy','Trust & Moderation','Operations'])must(home.includes(token),`Command Center missing ${token}`);
for(const token of ['searchOwnerUsers','setOwnerUserAccess'])must(access.includes(token),`Access UI missing wired ${token}`);
for(const token of ['searchOwnerBusinesses','setOwnerBusinessAccess'])must(businessUi.includes(token),`Business UI missing wired ${token}`);
for(const token of ['getOwnerEconomySnapshot','XP issuance','Evidence tiers','Level distribution','Objective mix'])must(progression.includes(token),`Economy UI missing ${token}`);
for(const token of ['getOwnerModerationQueues','resolveOwnerReviewReport'])must(moderationUi.includes(token),`Moderation UI missing ${token}`);
for(const token of ['getOwnerOperationsSnapshot','setIngestionResumeAuthorization'])must(operationsUi.includes(token),`Operations UI missing ${token}`);
for(const route of ['businesses','moderation'])must(layout.includes(`name="${route}"`),`Owner route not registered: ${route}`);
for(const token of ['OSHero','HealthCard','StatusPill','SectionHeader','DiagnosticDisclosure'])must(os.includes(token),`KleenestOS component library missing ${token}`);
for(const file of ['app/index.tsx','app/access.tsx','app/businesses.tsx','app/progression.tsx','app/moderation.tsx','app/operations.tsx']){
  const source=read(file);
  must(!source.includes('JSON.stringify('),`${file} must not use raw JSON as primary UX`);
}

if(failures.length){console.error('KleenestOS authority audit failed:');for(const failure of failures)console.error(`- ${failure}`);process.exit(1)}
console.log('KleenestOS authority audit passed.');
