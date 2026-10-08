import fs from 'node:fs';
function read(file){return fs.readFileSync(file,'utf8')}
function expect(ok,message){if(!ok)throw new Error(message)}
const directory=read('supabase/functions/owner-email-directory/index.ts');
const auth=read('app/auth.tsx');
const layout=read('app/_layout.tsx');
const mailboxUI=read('app/mailboxes.tsx');
const inbox=read('app/communications.tsx');
const api=read('src/services/communications.ts');
for(const action of ['admin_overview','create_mailbox','update_mailbox','add_alias','remove_alias','assign_member','remove_member']){
  expect(directory.includes('action==="'+action+'"'),'Mailbox API missing action '+action);
}
expect(directory.includes('if(!platformOwner)reject("Platform owner authorization required.",403)'), 'All mailbox mutations must be platform-owner protected.');
expect(directory.includes('getUserById(target)'), 'Mailbox assignment must validate a real account.');
expect(directory.includes('owner_email_mailbox_members')&&directory.includes('m.owner_user_id===userId'), 'Mailbox listing must scope users to owned or assigned mailboxes.');
expect(!directory.includes('user_metadata'), 'Never authorize from editable metadata.');
expect(directory.includes('await audit(userId,action'), 'Mailbox changes must be audited.');
expect(auth.includes("if(returnToMail)")&&auth.includes('auth.signInWithPassword'), 'Mail-only users need dedicated sign-in.');
expect(auth.includes('authorizeDestination()')&&auth.includes('listOwnerMailboxes()'), 'Mail sign-in must enforce an assigned mailbox.');
expect(layout.includes('ownerAllowed===false')&&layout.includes('<Redirect href="/mail"/>'), 'Mail-only users must not enter Owner routes.');
expect(mailboxUI.includes('getOwnerAuthorization')&&mailboxUI.includes('is_platform_owner'), 'Mailbox UI must require platform-owner auth.');
expect(mailboxUI.includes("run('assign_member'")&&mailboxUI.includes("run('remove_member'"), 'Mailbox assignment and revocation controls are required.');
expect(mailboxUI.includes("run('create_mailbox'")&&mailboxUI.includes("run('update_mailbox'"), 'Mailbox create/update controls are required.');
expect(inbox.includes('Manage mailboxes & access')&&inbox.includes('Sign out'), 'Email Center needs management navigation and mail-only sign-out.');
expect(api.includes('listManagedMailboxes')&&api.includes('manageMailDirectory'), 'Client must call authenticated directory endpoint.');
console.log('Mailbox CRUD and delegated access audit passed.');
