import fs from 'node:fs';
import assert from 'node:assert/strict';

const layout=fs.readFileSync(new URL('../app/_layout.tsx',import.meta.url),'utf8');
const home=fs.readFileSync(new URL('../app/index.tsx',import.meta.url),'utf8');
const inbox=fs.readFileSync(new URL('../app/communications.tsx',import.meta.url),'utf8');
const service=fs.readFileSync(new URL('../src/services/communications.ts',import.meta.url),'utf8');

assert.match(layout,/name="communications" options=\{\{title:'Email'/,'Owner Email Center must remain a visible bottom tab');
assert.doesNotMatch(layout,/name="communications" options=\{\{href:null/,'Owner Email Center must not be hidden');
assert.match(home,/href="\/communications"[\s\S]{0,700}Kleenest Email Center/,'Owner home must open the first-party Email Center');
assert.match(home,/Email Alert Settings/,'Notification policy must remain separate from the Email Center');

for(const token of [
  'title="Kleenest Email Center"',
  'No Gmail connection is required',
  'listOwnerMailThreads',
  'replyOwnerMailThread',
  'sendOwnerMail',
  'forwardOwnerMailThread',
  'support@kleenest.us',
]) assert.ok(inbox.includes(token),`Owner Email Center screen missing ${token}`);

for(const token of [
  "invokeFunction<T>('owner-email-center',body)",
  "client.functions.invoke(functionName",
  "invokeFunction<{mailboxes:OwnerMailbox[];isAdmin:boolean}>('owner-email-directory'",
  "action:'status'",
  "action:'list_threads'",
  "action:'send'",
  "action:'reply'",
  "action:'forward'",
]) assert.ok(service.includes(token),`Owner Email Center service missing ${token}`);

for(const retired of ['Connect Gmail','gmail.readonly','providerToken','owner-email-gateway']){
  assert.ok(!inbox.includes(retired),`Retired Gmail UI token still present: ${retired}`);
  assert.ok(!service.includes(retired),`Retired Gmail service token still present: ${retired}`);
}

console.log('owner first-party Email Center navigation audit passed');
