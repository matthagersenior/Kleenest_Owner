import fs from 'node:fs';
const failures=[];
const must=(condition,message)=>{if(!condition)failures.push(message)};
const exists=file=>fs.existsSync(new URL(`../${file}`,import.meta.url));
const read=file=>exists(file)?fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8'):'';

for(const file of ['app/sponsored-ads.tsx','src/services/ownerSponsorship.ts','app/_layout.tsx','app/index.tsx','app/control.tsx','app/search.tsx'])must(exists(file),`Missing sponsored-ad Owner surface: ${file}`);
const page=read('app/sponsored-ads.tsx'),service=read('src/services/ownerSponsorship.ts'),layout=read('app/_layout.tsx'),home=read('app/index.tsx'),control=read('app/control.tsx'),search=read('app/search.tsx');
for(const token of ['owner_relevance_sponsorship_snapshot','owner_set_sponsorship_enabled','owner_upsert_ad_placement','owner_upsert_sponsored_campaign','owner_review_sponsored_campaign','owner_archive_sponsored_campaign'])must(service.includes(token),`Sponsored Owner service missing RPC: ${token}`);
for(const token of ['Sponsored Advertising','Pause Kleenest Sponsored globally','Campaigns awaiting approval','Create Owner campaign','Placement CRUD','$5 Remove Ads disables AdMob/network inventory only'])must(page.includes(token),`Sponsored Owner UI missing behavior: ${token}`);
must(layout.includes('name="sponsored-ads"'),'Sponsored Advertising route is not registered');
must(home.includes('/sponsored-ads')&&home.includes('Sponsored Advertising'),'Sponsored Advertising is not discoverable from Owner home');
must(control.includes('/sponsored-ads')&&control.includes('Sponsored Advertising'),'Sponsored Advertising is not discoverable from Control Center');
must(search.includes('/sponsored-ads')&&search.includes('sponsored'),'Sponsored Advertising is not searchable in KleenestOS');
if(failures.length){console.error('Owner sponsored advertising audit failed:');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('Owner sponsored advertising audit passed.');
