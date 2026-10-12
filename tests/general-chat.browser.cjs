// Local browser checks with isolated API fixtures; no live accounts or writes.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const people = {
  admin: { id: '111111111111111111111111', name: 'Alex Morgan', role: 'ADMIN' },
  member: { id: '222222222222222222222222', name: 'Daniel Bauer', role: 'MEMBER' },
  client: { id: '333333333333333333333333', name: 'Lena Fischer', role: 'CLIENT', client: { id: 'aaaaaaaaaaaaaaaaaaaaaaaa', name: 'Studio Nord' } },
  model: { id: '444444444444444444444444', name: 'Sophie Weber', role: 'USER' },
};
const groupId = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const now = new Date().toISOString();
const group = {
  id: groupId, kind: 'GROUP', title: 'Campaign team', description: '', revision: 1,
  participants: Object.values(people), participantCount: 4, unreadCount: 0,
  lastReadSequence: 0, messageSequence: 0, lastMessage: null, createdAt: now, updatedAt: now,
};
const conversations = new Map();
const posts = [];
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
function general(owner, staff = false) {
  const messages = conversations.get(owner.id) || [];
  return {
    id: staff ? owner.id : 'general', kind: 'GENERAL', owner, title: owner.name,
    description: '', revision: messages.length ? 1 : 0, isUnstarted: !messages.length,
    participants: [owner, people.admin, people.member], participantCount: 3,
    unreadCount: staff ? messages.filter(m => m.senderId === owner.id).length : 0,
    lastReadSequence: 0, messageSequence: messages.length,
    lastMessage: messages.at(-1) || null,
    createdAt: messages[0]?.createdAt || null, updatedAt: messages.at(-1)?.createdAt || null,
  };
}
async function setup(browser, app, role) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const actor = people[role];
  const viewer = { ...actor, canManage: ['ADMIN', 'MEMBER'].includes(actor.role) };
  let loseNextSend = role === 'model';
  const json = (route, body, status = 200) => route.fulfill({
    status, contentType: 'application/json',
    headers: { 'Access-Control-Allow-Origin': app, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'Content-Type' },
    body: JSON.stringify(body),
  });
  await page.route('**/api/auth/session', route => json(route, { user: { ...actor, email: `${role}@example.test` }, expires: '2099-01-01T00:00:00.000Z' }));
  await page.route('**:8888/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'OPTIONS') return json(route, {});
    if (!url.pathname.startsWith('/chats')) return json(route, { items: [], unreadCount: 0, nextCursor: null, asOf: now });
    const body = request.method() === 'POST' ? request.postDataJSON() : undefined;
    if (body) posts.push({ role, path: url.pathname, body });
    const id = body?.chatId || url.searchParams.get('chatId') || url.searchParams.get('id');
    const owner = id === 'general' ? actor : Object.values(people).find(person => person.id === id);
    if (url.pathname === '/chats') {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      return json(route, {
        viewer, generalChat: viewer.canManage ? null : general(actor),
        items: [
          ...(viewer.canManage ? [people.client, people.model].filter(person => conversations.has(person.id)).map(person => general(person, true)) : []),
          group,
        ].filter(chat => `${chat.title} ${chat.owner?.client?.name || ''}`.toLowerCase().includes(q)),
        nextCursor: null,
      });
    }
    if (url.pathname === '/chats/detail') return json(route, id === groupId ? group : general(owner, viewer.canManage));
    if (url.pathname === '/chats/messages' && !body) {
      const messages = id === groupId ? [] : conversations.get(owner.id) || [];
      const after = Number(url.searchParams.get('after') || 0);
      return json(route, { items: messages.filter(message => message.sequence > after), hasMore: false });
    }
    if (url.pathname === '/chats/messages' && body) {
      const messages = conversations.get(owner.id) || [];
      let message = messages.find(item => item.clientMessageId === body.clientMessageId && item.senderId === actor.id);
      if (!message) {
        message = { id: `${owner.id}-${messages.length + 1}`, chatId: owner.id, senderId: actor.id, senderName: actor.name, senderRole: actor.role, body: body.body, sequence: messages.length + 1, clientMessageId: body.clientMessageId, createdAt: new Date().toISOString() };
        messages.push(message);
        conversations.set(owner.id, messages);
      }
      if (loseNextSend) {
        loseNextSend = false;
        return json(route, { message: 'Simulated lost response after commit' }, 503);
      }
      await sleep(150);
      return json(route, message, 201);
    }
    if (url.pathname === '/chats/read') return json(route, { ok: true });
    if (url.pathname === '/chats/participants') return json(route, { items: Object.values(people), nextCursor: null });
    if (url.pathname === '/chats/requests') return json(route, { items: [], nextCursor: null });
    return json(route, {});
  });
  if (role === 'model') {
    await page.request.get(`${app}/chat`, { maxRedirects: 0 });
    await page.route('**/_next/data/**/chat.json*', route => json(route, { pageProps: {}, __N_SSP: true }));
    await page.goto(`${app}/404`);
    await page.waitForFunction(() => window.next?.router?.isReady);
    await page.evaluate(async () => { await window.next.router.push('/chat'); });
  } else await page.goto(`${app}/chat`);
  return { page, errors };
}
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const [role, app] of [['client', 'http://localhost:3005'], ['model', 'http://localhost:3004']]) {
      const { page, errors } = await setup(browser, app, role);
      console.log(`${role}: opening general chat`);
      await page.getByRole('heading', { name: 'Allgemeiner Chat', exact: true }).waitFor();
      await page.getByText('Wie können wir dir helfen?', { exact: true }).waitFor();
      const composer = page.getByRole('textbox', { name: 'Nachricht', exact: true });
      assert.equal(conversations.has(people[role].id), false);
      assert.equal(posts.filter(item => item.role === role).length, 0, 'Opening general chat is read-only');
      assert.equal(await page.getByRole('button', { name: 'Neuer Gruppenchat' }).count(), 0);
      await composer.fill('Hello from ' + role);
      const before = await page.locator('.ui-chat-composer').boundingBox();
      await page.getByRole('button', { name: 'Senden', exact: true }).click();
      if (role === 'model') {
        await page.getByRole('alert').filter({ hasText: 'Nachricht nicht gesendet' }).waitFor();
        assert.equal(await composer.inputValue(), 'Hello from model');
        await page.getByRole('button', { name: 'Senden', exact: true }).click();
        const sends = posts.filter(item => item.role === role && item.path === '/chats/messages');
        assert.equal(sends.length, 2);
        assert.equal(sends[0].body.clientMessageId, sends[1].body.clientMessageId, 'Retry retains idempotency key');
      }
      await page.waitForFunction(() => document.querySelector('.ui-chat-composer textarea')?.value === '');
      assert.equal(conversations.get(people[role].id).length, 1);
      assert.equal(await page.locator('.ui-chat-message').count(), 1);
      assert.equal(await page.getByRole('heading', { name: 'Allgemeiner Chat', exact: true }).count(), 1);
      assert.equal((await page.locator('.ui-chat-composer').boundingBox()).y, before.y, 'First send keeps composer position');
      await page.getByRole('button', { name: 'Details zur Unterhaltung', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByText('Alex Morgan', { exact: true }).waitFor();
      assert.equal(await dialog.getByText('Daniel Bauer', { exact: true }).count(), 1);
      assert.equal(await dialog.getByRole('button', { name: 'Gruppe verwalten' }).count(), 0);
      await page.keyboard.press('Escape');
      await page.locator('.ui-chat-list-item').filter({ hasText: 'Campaign team' }).click();
      await page.getByRole('heading', { name: 'Campaign team', exact: true }).waitFor();
      await page.locator('.ui-chat-list-item').filter({ hasText: 'Allgemeiner Chat' }).click();
      await page.getByRole('heading', { name: 'Allgemeiner Chat', exact: true }).waitFor();
      await page.setViewportSize({ width: 390, height: 844 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `/tmp/itsyou-general-${role}-mobile.png` });
      await page.getByRole('button', { name: 'Zurück zu Unterhaltungen', exact: true }).click();
      await page.locator('.ui-chat-list-item').filter({ hasText: 'Allgemeiner Chat' }).waitFor();
      assert.deepEqual(errors, []);
      console.log(`${role}: first send, retry and mobile checks passed`);
      await page.close();
    }
    for (const role of ['admin', 'member']) {
      const { page, errors } = await setup(browser, 'http://localhost:3000', role);
      console.log(`${role}: checking shared inbox and replies`);
      await page.locator('.ui-chat-list-item').filter({ hasText: 'Lena Fischer' }).waitFor();
      assert.equal(await page.locator('.ui-chat-list-item').filter({ hasText: 'Sophie Weber' }).count(), 1);
      const clientGroup = page.locator('.ui-chat-conversation-group').filter({ has: page.locator('.ui-chat-group-heading', { hasText: 'Studio Nord' }) });
      assert.equal(await clientGroup.locator('.ui-chat-list-item').filter({ hasText: 'Lena Fischer' }).count(), 1);
      await page.locator('.ui-chat-list-item').filter({ hasText: 'Lena Fischer' }).click();
      await page.getByRole('heading', { name: 'Lena Fischer', exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Manage group', exact: true }).count(), 0);
      await page.getByRole('textbox', { name: 'Message', exact: true }).fill(`Reply from ${role}`);
      await page.getByRole('button', { name: 'Send', exact: true }).click();
      await page.locator('.ui-chat-bubble').getByText(`Reply from ${role}`, { exact: true }).waitFor();
      await page.locator('.ui-chat-list-item').filter({ hasText: 'Campaign team' }).click();
      await page.getByRole('button', { name: 'Manage group', exact: true }).waitFor();
      await page.getByRole('button', { name: 'New group chat', exact: true }).first().click();
      await page.getByRole('dialog').getByRole('textbox', { name: 'Group name', exact: true }).waitFor();
      await page.keyboard.press('Escape');
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('General chat browser checks passed in client/model/admin: virtual opening, first send, retry, stable layout, details, private/group distinction, mobile navigation and both staff roles.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
