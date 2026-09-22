import fs from 'node:fs';
import assert from 'node:assert/strict';

const layout=fs.readFileSync(new URL('../app/_layout.tsx',import.meta.url),'utf8');
const home=fs.readFileSync(new URL('../app/index.tsx',import.meta.url),'utf8');
const inbox=fs.readFileSync(new URL('../app/communications.tsx',import.meta.url),'utf8');

assert.match(layout,/name="communications" options=\{\{title:'Email'/,'Owner email dashboard must be a visible bottom tab');
assert.doesNotMatch(layout,/name="communications" options=\{\{href:null/,'Owner email dashboard must not be hidden');
assert.match(home,/href="\/communications"[\s\S]{0,700}Email Dashboard & Inbox/,'Owner home must open the email dashboard');
assert.match(home,/Email Alert Settings/,'Notification policy must be clearly separate from the inbox');
assert.match(inbox,/title="Email Dashboard & Inbox"/,'Email route must present itself as dashboard and inbox');
assert.match(inbox,/listOwnerMailThreads/,'Email dashboard must load real Gmail threads');
assert.match(inbox,/replyOwnerMailThread/,'Email dashboard must support in-thread replies');

console.log('owner email navigation audit passed');
