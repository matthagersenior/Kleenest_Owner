import fs from 'node:fs';

function read(path){return fs.readFileSync(path,'utf8')}
function expect(condition,message){if(!condition)throw new Error(message)}

const communications=read('app/communications.tsx');
const mailRoute=read('app/mail.tsx');
const layout=read('app/_layout.tsx');
const manifest=JSON.parse(read('public/mail-manifest.json'));
const worker=read('public/mail-sw.js');
const directory=read('supabase/functions/owner-email-directory/index.ts');
const tsconfig=JSON.parse(read('tsconfig.json'));

expect(communications.includes("m.mailbox_type!=='system'"),'Email Center must include authorized personal mailboxes.');
expect(communications.includes("m.mailbox_type==='personal'&&m.send_enabled"),'Compose should prefer an authorized personal mailbox.');
expect(!communications.includes("mailbox_type==='shared'"),'Email Center must not filter the directory to shared mailboxes only.');
expect(mailRoute.includes('mail-manifest.json'),'Standalone mail route must advertise its PWA manifest.');
expect(mailRoute.includes('serviceWorker.register'),'Standalone mail route must register the privacy-safe service worker.');
expect(layout.includes("name=\"mail\""),'Kleenest Mail route must be registered as a hidden Owner route.');
expect(manifest.id==='/mail'&&manifest.start_url==='/mail','Kleenest Mail manifest must launch the /mail route.');
expect(manifest.display==='standalone','Kleenest Mail must install in standalone display mode.');
expect(worker.includes('not cached'),'Mail service worker must avoid caching sensitive mailbox content.');
expect(directory.includes('mailbox.mailbox_type==="personal"'),'Mailbox directory must enforce personal mailbox ownership/membership.');
expect(directory.includes('owner_email_mailbox_members'),'Mailbox directory must honor explicit mailbox membership.');
expect(!directory.includes('user_metadata'),'Mailbox authorization must not trust user-editable metadata.');
expect(Array.isArray(tsconfig.exclude)&&tsconfig.exclude.includes('supabase/functions'),'Expo typecheck must exclude Deno Edge Function sources.');

console.log('Kleenest Mail PWA audit passed.');
