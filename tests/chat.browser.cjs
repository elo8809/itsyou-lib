// Browser interaction checks against running local admin/client apps, with all
// authentication and chat API requests fulfilled by fixtures (no real writes).
const assert = require('node:assert/strict');
const { mkdir } = require('node:fs/promises');
const { chromium } = require('playwright');
const output =
  process.env.CHAT_SCREENSHOTS || '/tmp/itsyou-chat-qa';
const people = [
  {
    id: '111111111111111111111111',
    name: 'Alex Morgan',
    role: 'ADMIN',
    email: 'alex@example.test',
  },
  {
    id: '222222222222222222222222',
    name: 'Sophie Weber',
    role: 'USER',
    email: 'sophie@example.test',
  },
  {
    id: '333333333333333333333333',
    name: 'Lena Fischer',
    role: 'CLIENT',
    email: 'lena@example.test',
    client: { name: 'Studio Nord' },
  },
  {
    id: '444444444444444444444444',
    name: 'Daniel Bauer',
    role: 'MEMBER',
    email: 'daniel@example.test',
  },
];
const requests = [
  {
    id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
    project: 'Autumn campaign',
    client: {
      id: 'a11111111111111111111111',
      name: 'Studio Nord',
    },
  },
  {
    id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
    project: 'Winter launch',
    client: {
      id: 'a11111111111111111111111',
      name: 'Studio Nord',
    },
  },
  {
    id: 'cccccccccccccccccccccccc',
    project: 'Autumn campaign',
    client: {
      id: 'c11111111111111111111111',
      name: 'Studio South',
    },
  },
];
const requestDetails = (request) => ({
  ...request,
  status: 'OPEN',
  time: 'Thursday, 09:00',
  location: 'Vienna',
  salary: '500 EUR',
  description: 'Campaign production',
  tasks: 'Photoshoot',
  createdAt: new Date().toISOString(),
  personalRequests: [],
  pitches: [],
});
const chatId = '555555555555555555555555';
const now = new Date();
const createdAt = new Date(
  now.getTime() - 3600000,
).toISOString();
function fixture(viewerRole = 'ADMIN') {
  const viewer = {
    ...people.find((p) => p.role === viewerRole),
    canManage: ['ADMIN', 'MEMBER'].includes(viewerRole),
  };
  let messages = [
    {
      id: 'm1',
      chatId,
      senderId: people[3].id,
      senderName: people[3].name,
      senderRole: 'MEMBER',
      sequence: 1,
      body: 'Good morning, everyone. This is our space for the Vienna campaign. Looking forward to working together!',
      createdAt,
    },
    {
      id: 'm2',
      chatId,
      senderId: people[2].id,
      senderName: people[2].name,
      senderRole: 'CLIENT',
      sequence: 2,
      body: 'Thanks, Daniel! The studio is confirmed for Thursday. Call time is 09:00.\nI’ll share the final schedule here once the team has approved it.',
      createdAt,
    },
    {
      id: 'm3',
      chatId,
      senderId: people[0].id,
      senderName: people[0].name,
      senderRole: 'ADMIN',
      sequence: 3,
      body: 'Perfect. Sophie, please bring the neutral wardrobe options we discussed. We’ll have styling on set.',
      createdAt,
    },
    {
      id: 'm4',
      chatId,
      senderId: people[1].id,
      senderName: people[1].name,
      senderRole: 'USER',
      sequence: 4,
      body: 'All noted, thank you! See you on Thursday ✨',
      createdAt,
    },
  ];
  let rooms = [
    {
      id: chatId,
      request: requests[0],
      title: 'Vienna campaign · Production',
      description:
        'Shoot coordination, schedules, and updates for the October campaign.',
      revision: 1,
      participantCount: 4,
      unreadCount: 2,
      lastReadSequence: 2,
      messageSequence: 4,
      lastMessage: messages[3],
      createdAt,
      updatedAt: createdAt,
      participants: people,
    },
  ];
  rooms.push(
    {
      ...rooms[0],
      id: '777777777777777777777777',
      title: 'Winter planning',
      request: requests[1],
      lastMessage: null,
      unreadCount: 0,
    },
    {
      ...rooms[0],
      id: '888888888888888888888888',
      title: 'South production',
      request: requests[2],
      lastMessage: null,
      unreadCount: 0,
    },
    {
      ...rooms[0],
      id: '999999999999999999999999',
      title: 'Agency updates',
      request: null,
      lastMessage: null,
      unreadCount: 0,
    },
  );
  let failSend = false;
  const sendKeys = [];
  let sendCount = 0;
  let readCount = 0;
  return {
    viewer,
    setFail: () => {
      failSend = true;
    },
    sendKeys,
    get readCount() {
      return readCount;
    },
    get sendCount() {
      return sendCount;
    },
    rooms,
    async route(route) {
      const req = route.request(),
        url = new URL(req.url()),
        path = url.pathname;
      const json = (data, status = 200) =>
        route.fulfill({
          status,
          contentType: 'application/json',
          headers: {
            'Access-Control-Allow-Origin': new URL(
              req.headers().origin ||
                'http://localhost:3000',
            ).origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
          body: JSON.stringify(data),
        });
      if (req.method() === 'OPTIONS') return json({});
      if (path === '/chats/requests')
        return json({
          items: requests.filter((r) =>
            `${r.project} ${r.client.name}`
              .toLowerCase()
              .includes(
                (
                  url.searchParams.get('q') || ''
                ).toLowerCase(),
              ),
          ),
          nextCursor: null,
        });
      if (path === '/chats/request-draft')
        return json({
          viewer,
          draft: {
            title: requests[0].project,
            description: '',
            request: requests[0],
            participants: [people[0], people[1], people[2]],
          },
          missingModelAccounts: 0,
          missingClientAccount: false,
        });
      if (path === '/chats/participants')
        return json({
          items: people.filter(
            (p) =>
              (!url.searchParams.get('role') ||
                p.role === url.searchParams.get('role')) &&
              `${p.name} ${p.email}`
                .toLowerCase()
                .includes(
                  (
                    url.searchParams.get('q') || ''
                  ).toLowerCase(),
                ),
          ),
          nextCursor: null,
        });
      if (path === '/chats/detail') {
        const room = rooms.find(
          (r) => r.id === url.searchParams.get('id'),
        );
        return room
          ? json(room)
          : json({ message: 'Not found' }, 404);
      }
      if (
        path === '/chats/messages' &&
        req.method() === 'GET'
      )
        return json({
          items: messages.filter(
            (m) =>
              m.chatId === url.searchParams.get('chatId') &&
              (!url.searchParams.has('after') ||
                m.sequence >
                  Number(url.searchParams.get('after'))),
          ),
          hasMore: false,
        });
      if (path === '/chats/read') {
        readCount++;
        const body = req.postDataJSON(),
          room = rooms.find((r) => r.id === body.chatId);
        room.lastReadSequence = body.sequence;
        room.unreadCount = 0;
        return json({ ok: true });
      }
      if (
        path === '/chats/messages' &&
        req.method() === 'POST'
      ) {
        const body = req.postDataJSON();
        sendKeys.push(body.clientMessageId);
        if (failSend) {
          failSend = false;
          return json({ message: 'Connection error' }, 503);
        }
        const room = rooms.find(
          (r) => r.id === body.chatId,
        );
        const m = {
          id: `sent${++sendCount}`,
          chatId: body.chatId,
          senderId: viewer.id,
          senderName: viewer.name,
          senderRole: viewer.role,
          body: body.body,
          clientMessageId: body.clientMessageId,
          sequence: room.messageSequence + 1,
          createdAt: new Date().toISOString(),
        };
        messages.push(m);
        room.messageSequence = m.sequence;
        room.lastMessage = m;
        return json(m, 201);
      }
      if (path === '/chats/update') {
        const b = req.postDataJSON(),
          room = rooms.find((r) => r.id === b.id);
        Object.assign(room, {
          request:
            requests.find(
              (r) => r.id === b.clientRequestId,
            ) || null,
          title: b.title,
          description: b.description,
          participants: people.filter((p) =>
            b.participantIds.includes(p.id),
          ),
          participantCount: b.participantIds.length,
          revision: room.revision + 1,
        });
        return json(room);
      }
      if (path === '/chats' && req.method() === 'POST') {
        const b = req.postDataJSON(),
          room = {
            ...rooms[0],
            id: '666666666666666666666666',
            request:
              requests.find(
                (r) => r.id === b.clientRequestId,
              ) || null,
            title: b.title,
            description: b.description,
            participants: people.filter((p) =>
              b.participantIds.includes(p.id),
            ),
            participantCount: b.participantIds.length,
            revision: 1,
            messageSequence: 0,
            lastReadSequence: 0,
            lastMessage: null,
            unreadCount: 0,
          };
        rooms.push(room);
        return json(room, 201);
      }
      if (path === '/chats')
        return json({
          viewer,
          items: rooms.filter(
            (r) =>
              (!url.searchParams.has('clientRequestId') ||
                r.request?.id ===
                  url.searchParams.get(
                    'clientRequestId',
                  )) &&
              `${r.title} ${r.request?.project || ''} ${r.request?.client.name || ''}`
                .toLowerCase()
                .includes(
                  (
                    url.searchParams.get('q') || ''
                  ).toLowerCase(),
                ),
          ),
          nextCursor: null,
        });
      throw new Error(
        `Unexpected API request: ${req.method()} ${path}`,
      );
    },
  };
}
(async () => {
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1512, height: 1060 },
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const data = fixture();
    await page.route('**/api/auth/session', (r) =>
      r.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          user: { ...data.viewer },
          expires: '2099-01-01T00:00:00.000Z',
        }),
      }),
    );
    await page.route('**/chats**', (r) => data.route(r));
    await page.goto(
      `${process.env.CHAT_ADMIN_URL || 'http://localhost:3000'}/chat`,
    );
    await page
      .getByRole('button', {
        name: 'New group chat',
        exact: true,
      })
      .first()
      .waitFor();
    await page
      .locator('.ui-chat-list-item')
      .first()
      .click();
    await page
      .locator('.ui-chat-bubble p')
      .filter({ hasText: 'All noted, thank you!' })
      .waitFor();
    await page.screenshot({
      path: `${output}/admin-desktop.png`,
      fullPage: true,
    });
    assert.equal(
      await page
        .locator(
          '.ui-chat-conversation-group[data-kind="project"]',
        )
        .count(),
      1,
    );
    assert.equal(
      await page
        .locator(
          '.ui-chat-conversation-group[data-kind="request"]',
        )
        .count(),
      0,
    );
    assert.equal(
      await page
        .locator(
          '.ui-chat-conversation-group[data-kind="general"]',
        )
        .count(),
      0,
    );
    const projects = page.locator(
      '.ui-chat-conversation-group[data-kind="project"]',
    );
    assert.equal(
      await projects.locator('.ui-chat-list-item').count(),
      4,
    );
    await projects.locator('> .ui-chat-group-heading').click();
    assert.equal(
      await projects
        .locator('.ui-chat-list-item')
        .first()
        .isVisible(),
      false,
    );
    await projects.locator('> .ui-chat-group-heading').click();
    const composer = page.getByRole('textbox', {
      name: 'Message',
      exact: true,
    });
    await composer.fill('Browser test message');
    data.setFail();
    await page
      .getByRole('button', { name: 'Send', exact: true })
      .click();
    await page
      .getByText('Message not sent.', { exact: false })
      .waitFor();
    assert.equal(
      await composer.inputValue(),
      'Browser test message',
    );
    await page
      .getByRole('button', { name: 'Send', exact: true })
      .click();
    await page
      .locator('.ui-chat-bubble p')
      .filter({ hasText: 'Browser test message' })
      .waitFor();
    assert.equal(data.sendKeys[0], data.sendKeys[1]);
    assert.equal(data.sendCount, 1);
    await composer.fill('Line one');
    await composer.press('Shift+Enter');
    await composer.press('x');
    assert.equal(
      await composer.inputValue(),
      'Line one\nx',
    );
    await composer.fill('<script>alert("safe")</script>');
    await composer.press('Enter');
    await page
      .getByText('<script>alert("safe")</script>', {
        exact: true,
      })
      .waitFor();
    await page
      .getByRole('button', {
        name: 'Manage group',
        exact: true,
      })
      .click();
    await page.locator('.ui-action-dialog-panel').waitFor();
    await page
      .locator('.ui-chat-person-option')
      .first()
      .waitFor();
    await page.screenshot({
      path: `${output}/admin-manage.png`,
      fullPage: true,
    });
    await page.locator('.ui-chat-request-value').click();
    await page
      .locator('.ui-chat-request-option')
      .filter({ hasText: 'Winter launch' })
      .click();
    await page
      .getByRole('textbox', {
        name: 'Group name',
        exact: true,
      })
      .fill('Vienna campaign · October');
    await page
      .getByRole('button', {
        name: 'Save changes',
        exact: true,
      })
      .click();
    await page
      .getByRole('heading', {
        name: 'Vienna campaign · October',
        exact: true,
      })
      .waitFor();
    assert.equal(data.rooms[0].request.id, requests[1].id);
    await page
      .getByRole('button', {
        name: 'New group chat',
        exact: true,
      })
      .first()
      .click();
    await page
      .getByRole('textbox', {
        name: 'Group name',
        exact: true,
      })
      .fill('New production group');
    assert.equal(
      await page
        .getByRole('button', {
          name: 'Create group',
          exact: true,
        })
        .isDisabled(),
      true,
    );
    await page.locator('.ui-chat-request-value').click();
    await page
      .locator('.ui-chat-request-option')
      .filter({ hasText: 'Studio South' })
      .click();
    await page
      .locator('.ui-chat-person-option')
      .filter({ hasText: 'Sophie Weber' })
      .getByRole('checkbox')
      .check();
    await page
      .getByRole('button', {
        name: 'Create group',
        exact: true,
      })
      .click();
    await page
      .getByRole('heading', {
        name: 'New production group',
        exact: true,
      })
      .waitFor();
    await page
      .getByText('Start the conversation', { exact: true })
      .waitFor();
    await composer.fill('Draft survives switching');
    data.setFail();
    await page
      .getByRole('button', { name: 'Send', exact: true })
      .click();
    await page
      .getByText('Message not sent.', { exact: false })
      .waitFor();
    const failedKey = data.sendKeys.at(-1);
    await page
      .locator('.ui-chat-list-item')
      .filter({ hasText: 'Vienna campaign' })
      .click();
    await composer.fill('Keep this draft in Vienna');
    await page
      .locator('.ui-chat-list-item')
      .filter({ hasText: 'New production group' })
      .click();
    assert.equal(
      await composer.inputValue(),
      'Draft survives switching',
    );
    await page
      .getByRole('button', { name: 'Send', exact: true })
      .click();
    await page
      .locator('.ui-chat-bubble p')
      .filter({ hasText: 'Draft survives switching' })
      .waitFor();
    assert.equal(
      data.sendKeys.at(-1),
      failedKey,
      'Retry identifier survives thread navigation',
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .getByRole('button', {
        name: 'Back to conversations',
        exact: true,
      })
      .click();
    await page
      .locator('.ui-chat-list-item')
      .filter({ hasText: 'Vienna campaign' })
      .click();
    await page.locator('.ui-chat-bubble').first().waitFor();
    await page.screenshot({
      path: `${output}/admin-mobile.png`,
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          window.innerWidth,
      ),
      'Mobile must not overflow',
    );
    assert.equal(
      await page
        .getByRole('button', {
          name: 'Back to conversations',
          exact: true,
        })
        .isVisible(),
      true,
    );
    await page
      .getByRole('button', {
        name: 'Manage group',
        exact: true,
      })
      .click();
    await page.locator('.ui-action-dialog-panel').waitFor();
    const saveBox = await page
      .getByRole('button', {
        name: 'Save changes',
        exact: true,
      })
      .boundingBox();
    assert.ok(
      saveBox &&
        saveBox.y >= 0 &&
        saveBox.y + saveBox.height <= 844,
      'Mobile dialog actions stay visible',
    );
    await page
      .getByRole('button', { name: 'Cancel', exact: true })
      .click();
    assert.equal(errors.length, 0, errors.join('\n'));
    // Request action navigates to a full page with the shared form prefilled.
    await page.setViewportSize({
      width: 1512,
      height: 1060,
    });
    await page.route('**:8888/client-requests*', (r) =>
      r.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(requestDetails(requests[0])),
      }),
    );
    await page.goto(
      `${process.env.CHAT_ADMIN_URL || 'http://localhost:3000'}/client-requests/${requests[0].id}`,
    );
    await page
      .getByRole('link', {
        name: 'Create group chat',
        exact: true,
      })
      .click();
    await page.waitForURL('**/chat/new?clientRequestId=*');
    await page.locator('.ui-chat-create-card').waitFor();
    assert.equal(await page.getByRole('dialog').count(), 0);
    assert.equal(
      await page
        .getByRole('textbox', {
          name: 'Group name',
          exact: true,
        })
        .inputValue(),
      requests[0].project,
    );
    const chips = await page
      .locator('.ui-chat-selected')
      .innerText();
    for (const name of [
      'Alex Morgan',
      'Sophie Weber',
      'Lena Fischer',
    ])
      assert.ok(chips.includes(name));
    assert.ok(!chips.includes('Daniel Bauer'));
    assert.equal(
      await page
        .locator('.ui-chat-request-context')
        .innerText()
        .then((t) => t.includes(requests[0].project)),
      true,
    );
    await page
      .locator('.ui-chat-person-option')
      .first()
      .waitFor();
    await page.screenshot({
      path: `${output}/admin-request-create.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          window.innerWidth,
      ),
      'Creation page must fit mobile',
    );
    await page.screenshot({
      path: `${output}/admin-request-create-mobile.png`,
      fullPage: true,
    });
    await page
      .getByRole('button', {
        name: 'Create group',
        exact: true,
      })
      .click();
    await page.waitForURL('**/chat?id=*');
    const created = data.rooms.at(-1);
    assert.equal(created.request.id, requests[0].id);
    assert.deepEqual(
      created.participants.map((p) => p.id),
      people.slice(0, 3).map((p) => p.id),
    );
    // The client app uses the same component with German copy and no management controls.
    const clientPage = await browser.newPage({
        viewport: { width: 1280, height: 900 },
      }),
      client = fixture('CLIENT');
    await clientPage.route('**/api/auth/session', (r) =>
      r.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          user: client.viewer,
          expires: '2099-01-01T00:00:00.000Z',
        }),
      }),
    );
    await clientPage.route('**/chats**', (r) =>
      client.route(r),
    );
    await clientPage.route(
      '**/client/notifications*',
      (r) =>
        r.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            items: [],
            unreadCount: 0,
            nextCursor: null,
            asOf: new Date().toISOString(),
          }),
        }),
    );
    await clientPage.goto(
      `${process.env.CHAT_CLIENT_URL || 'http://localhost:3005'}/chat`,
    );
    await clientPage
      .locator('.ui-chat-list-item')
      .first()
      .click();
    await clientPage
      .getByText('All noted, thank you!')
      .waitFor();
    assert.equal(
      await clientPage
        .getByRole('button', {
          name: 'Neuer Gruppenchat',
          exact: true,
        })
        .count(),
      0,
    );
    assert.equal(
      await clientPage
        .getByRole('button', {
          name: 'Gruppe verwalten',
          exact: true,
        })
        .count(),
      0,
    );
    assert.equal(
      await clientPage
        .locator(
          '.ui-chat-conversation-group[data-kind="client"]',
        )
        .count(),
      0,
    );
    assert.equal(
      await clientPage
        .locator('.ui-chat-conversation-group')
        .count(),
      1,
    );
    await clientPage
      .getByRole('textbox', {
        name: 'Nachricht',
        exact: true,
      })
      .fill('Vielen Dank!');
    await clientPage
      .getByRole('button', { name: 'Senden', exact: true })
      .click();
    await clientPage
      .getByText('Vielen Dank!', { exact: true })
      .waitFor();
    await clientPage.waitForFunction(() => {
      const el = document.querySelector(
        '.ui-chat-messages',
      );
      return (
        el &&
        el.scrollHeight - el.scrollTop - el.clientHeight < 5
      );
    });
    await clientPage.screenshot({
      path: `${output}/client-desktop.png`,
      fullPage: true,
    });
    // Client request details embed only that request's assigned conversations.
    await clientPage.route(
      '**:8888/client/requests*',
      (r) =>
        r.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(requestDetails(requests[0])),
        }),
    );
    client.rooms[0].lastReadSequence = 0;
    client.rooms[0].unreadCount =
      client.rooms[0].messageSequence;
    const readsBeforeRequest = client.readCount;
    await clientPage.goto(
      `${process.env.CHAT_CLIENT_URL || 'http://localhost:3005'}/requests/${requests[0].id}`,
    );
    const embedded = clientPage.locator(
      '.ui-chat-workspace[data-embedded="true"]',
    );
    await embedded
      .locator('.ui-chat-bubble')
      .first()
      .waitFor();
    assert.equal(
      client.readCount,
      readsBeforeRequest,
      'Below-the-fold request chat stays unread',
    );
    assert.equal(
      await embedded.locator('.ui-chat-list-item').count(),
      1,
    );
    assert.equal(
      await embedded
        .getByRole('button', {
          name: 'Gruppe verwalten',
          exact: true,
        })
        .count(),
      0,
    );
    await embedded
      .getByRole('textbox', {
        name: 'Nachricht',
        exact: true,
      })
      .fill('Update from request details');
    await embedded
      .getByRole('button', { name: 'Senden', exact: true })
      .click();
    await embedded
      .locator('.ui-chat-bubble p')
      .filter({ hasText: 'Update from request details' })
      .waitFor();
    await embedded.screenshot({
      path: `${output}/client-request-chat.png`,
    });
    assert.ok(
      client.readCount > readsBeforeRequest,
      'Visible conversation advances read state',
    );
    await clientPage.setViewportSize({
      width: 390,
      height: 844,
    });
    assert.ok(
      await clientPage.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          window.innerWidth,
      ),
      'Embedded chat fits mobile',
    );
    await embedded.screenshot({
      path: `${output}/client-request-chat-mobile.png`,
    });
    client.rooms[0].request = null;
    await clientPage.reload();
    await clientPage
      .getByText(
        'Noch keine Unterhaltungen zu dieser Anfrage',
        { exact: true },
      )
      .waitFor();
    assert.equal(
      await clientPage.locator('.ui-chat-composer').count(),
      0,
    );
    const modelPage = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    });
    const model = fixture('USER');
    await modelPage.route('**/api/auth/session', (r) =>
      r.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          user: model.viewer,
          expires: '2099-01-01T00:00:00.000Z',
        }),
      }),
    );
    await modelPage.route('**/chats**', (r) =>
      model.route(r),
    );
    // The model route has a server session guard. Stub its Next data response
    // as well as the browser session so this UI test does not need real credentials.
    await modelPage.route('**/_next/data/**/chat.json*', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ pageProps: {}, __N_SSP: true }) }));
    await modelPage.goto(`${process.env.CHAT_MODEL_URL || 'http://localhost:3004'}/404`);
    await modelPage.waitForFunction(() => window.next?.router?.isReady);
    await modelPage.evaluate(() => window.next.router.push('/chat'));
    await modelPage
      .locator('.ui-chat-list-item')
      .first()
      .waitFor();
    assert.equal(
      await modelPage
        .locator(
          '.ui-chat-conversation-group[data-kind="client"]',
        )
        .count(),
      0,
    );
    assert.equal(
      await modelPage
        .locator('.ui-chat-conversation-group')
        .count(),
      1,
    );
    assert.equal(
      await modelPage
        .getByRole('button', {
          name: /New group chat|Neuer Gruppenchat/,
        })
        .count(),
      0,
    );
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log(
      `Browser checks passed: project grouping across portals, request prefill and embedded request messaging, group creation/editing, role controls, safe text rendering, send/retry, keyboard composer, client messaging, mobile navigation. Screenshots: ${output}`,
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
