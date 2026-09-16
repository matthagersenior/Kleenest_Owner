import fs from 'node:fs';

const access=fs.readFileSync('app/access.tsx','utf8');
const people=fs.readFileSync('src/services/ownerPeople.ts','utf8');

for(const token of ['Themes & Progression Rewards','OWNER GRANT','PROGRESSION EARNED','Grant reward','Revoke grant']){
 if(!access.includes(token)) throw new Error('Owner reward UI missing '+token);
}
for(const token of ['owner_user_progression_rewards','owner_grant_progression_reward','owner_revoke_progression_reward']){
 if(!people.includes(token)) throw new Error('Owner reward service missing '+token);
}
console.log('owner progression reward controls audit passed');
