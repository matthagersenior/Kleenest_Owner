import fs from 'node:fs';
function read(file){return fs.readFileSync(file,'utf8')}
function expect(ok,message){if(!ok)throw new Error(message)}
const directory=read('supabase/functions/owner-email-directory/index.ts');
const center=read('supabase/functions/owner-email-center/index.ts');
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
expect(!center.includes('(admin&&!personal)'), 'Ordinary admins must not bypass mailbox assignment.');
expect(center.includes('const canRead=platformOwner||owns||Boolean(member);'), 'Reading a mailbox must require owner or membership.');
expect(center.includes('const canSend=platformOwner||owns||Boolean(member?.can_send);'), 'Sending must require owner or explicit send permission.');
expect(!directory.includes('isAdmin&&m.mailbox_type'), 'Directory must not grant all shared mailboxes to admins.');
expect(center.includes('if(requireModify&&!platformOwner&&!owns'), 'Read-only viewers must not change inbox state.');
expect(center.includes('String(current.data.mailbox_id),false,true)'), 'Message mutation paths must require edit rights.');
expect(directory.includes('can_modify:platformOwner'), 'Directory must expose mailbox modification rights.');
expect(inbox.includes('selectedCanModify')&&inbox.includes('selectedCanSend'), 'Viewer controls must be read-only in the UI.');
expect(auth.includes("if(returnToMail)")&&auth.includes('auth.signInWithPassword'), 'Mail-only users need dedicated sign-in.');
expect(auth.includes('authorizeDestination()')&&auth.includes('listOwnerMailboxes()'), 'Mail sign-in must enforce an assigned mailbox.');
expect(layout.includes('ownerAllowed===false')&&layout.includes('<Redirect href="/mail"/>'), 'Mail-only users must not enter Owner routes.');
expect(mailboxUI.includes('getOwnerAuthorization')&&mailboxUI.includes('is_platform_owner'), 'Mailbox UI must require platform-owner auth.');
expect(mailboxUI.includes("run('assign_member'")&&mailboxUI.includes("run('remove_member'"), 'Mailbox assignment and revocation controls are required.');
expect(mailboxUI.includes("run('create_mailbox'")&&mailboxUI.includes("run('update_mailbox'"), 'Mailbox create/update controls are required.');
expect(inbox.includes('Manage mailboxes & access')&&inbox.includes('Sign out'), 'Email Center needs management navigation and mail-only sign-out.');
expect(api.includes('listManagedMailboxes')&&api.includes('manageMailDirectory'), 'Client must call authenticated directory endpoint.');
expect(api.includes("action:'get_attachment'")&&api.includes('attachments:input.attachments||[]'), 'Mail client must wire attachment downloads and outgoing attachments.');
expect(inbox.includes('downloadAttachment(selected.id,m.id')&&inbox.includes('Attach files'), 'Users must be able to download and attach files in the mail UI.');
expect(inbox.includes('attachNativePhotos'), 'Native owner client must offer photo attachments.');
expect(inbox.includes('selectedCanModify?<><Text')&&inbox.includes('Read-only access:'), 'Read-only users must not see label mutation controls.');
expect(inbox.includes("void load(view,mailboxId,next)"), 'Unread filter must use the next state rather than stale state.');
expect(inbox.includes("pathname==='/mail'?'KLEENEST MAIL'"), 'Installable mail client must use its own title.');
expect(center.includes('withMailboxSignature(requiredText')&&center.includes('body:withMailboxSignature(replyBody,mailbox)'), 'Saved mailbox signatures must be added to outbound messages.');
console.log('Mailbox CRUD, delegated access, and mail UI capability audit passed.');
