// Browser fixtures exercise the shared controls in all three local apps.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const id = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const ownId = '111111111111111111111111';
const otherId = '222222222222222222222222';
const now = new Date().toISOString();
(async () => {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });
  try {
    for (const app of [
      { role: 'ADMIN', port: 3000, locale: 'en' },
      { role: 'CLIENT', port: 3005, locale: 'de' },
      { role: 'USER', port: 3004, locale: 'de' },
    ]) {
      const de = app.locale === 'de';
      const labels = de
        ? {
            edit: 'Nachricht bearbeiten',
            message: 'Nachricht',
            save: 'Änderungen speichern',
            cancel: 'Abbrechen',
            archive: 'Chat archivieren',
            restore: 'Chat wiederherstellen',
            archived: /^Archiviert/,
            all: 'Alle',
            edited: 'Bearbeitet',
          }
        : {
            edit: 'Edit message',
            message: 'Message',
            save: 'Save changes',
            cancel: 'Cancel',
            archive: 'Archive chat',
            restore: 'Restore chat',
            archived: /^Archived/,
            all: 'All',
            edited: 'Edited',
          };
      const page = await browser.newPage({
        viewport: { width: 1440, height: 960 },
      });
      const errors = [];
      page.on('pageerror', (error) =>
        errors.push(error.message),
      );
      const actor = {
        id: ownId,
        name: 'Alex Morgan',
        role: app.role,
        canManage: app.role === 'ADMIN',
      };
      let archived = false;
      let editSequence = 0;
      let failEdit = true;
      let failArchive = true;
      const messages = [
        {
          id: '333333333333333333333333',
          senderId: ownId,
          senderName: 'Alex Morgan',
          senderRole: app.role,
          body: 'My original message',
        },
        {
          id: '444444444444444444444444',
          senderId: otherId,
          senderName: 'Sam Taylor',
          senderRole: 'MEMBER',
          body: 'Agency reply',
        },
      ].map((message, i) => ({
        ...message,
        chatId: id,
        sequence: i + 1,
        clientMessageId: `message-identifier-${i}`,
        createdAt: now,
        editSequence: 0,
        editedAt: null,
      }));
      const detail = () => ({
        id,
        kind: 'GROUP',
        title: 'Campaign team',
        description: '',
        archived,
        editSequence,
        revision: 1,
        participants: [
          actor,
          {
            id: otherId,
            name: 'Sam Taylor',
            role: 'MEMBER',
          },
        ],
        participantCount: 2,
        unreadCount: 0,
        lastReadSequence: messages.length,
        messageSequence: messages.length,
        lastMessage: messages.at(-1),
        createdAt: now,
        updatedAt: now,
      });
      const json = (route, body, status = 200) =>
        route.fulfill({
          status,
          contentType: 'application/json',
          headers: {
            'Access-Control-Allow-Origin': `http://localhost:${app.port}`,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
          body: JSON.stringify(body),
        });
      await page.route('**/api/auth/session', (route) =>
        json(route, {
          user: { ...actor, email: 'fixture@example.test' },
          expires: '2099-01-01T00:00:00.000Z',
        }),
      );
      await page.route('**:8888/**', async (route) => {
        const request = route.request();
        if (request.method() === 'OPTIONS')
          return json(route, {});
        const url = new URL(request.url());
        if (!url.pathname.startsWith('/chats'))
          return json(route, {
            items: [],
            unreadCount: 0,
            nextCursor: null,
            asOf: now,
          });
        const body =
          request.method() === 'POST'
            ? request.postDataJSON()
            : undefined;
        if (url.pathname === '/chats')
          return json(route, {
            viewer: actor,
            items:
              archived ===
              (url.searchParams.get('archived') === 'true')
                ? [detail()]
                : [],
            generalChat: null,
            archivedCount: archived ? 1 : 0,
            nextCursor: null,
          });
        if (url.pathname === '/chats/detail')
          return json(route, detail());
        if (url.pathname === '/chats/messages' && !body)
          return json(route, {
            items: messages.filter(
              (message) =>
                message.sequence >
                Number(url.searchParams.get('after') || 0),
            ),
            hasMore: false,
          });
        if (url.pathname === '/chats/message-edits')
          return json(route, {
            items: messages
              .filter(
                (message) =>
                  message.editSequence >
                  Number(
                    url.searchParams.get('after') || 0,
                  ),
              )
              .sort(
                (a, b) => a.editSequence - b.editSequence,
              ),
            hasMore: false,
          });
        if (url.pathname === '/chats/messages/edit') {
          const message = messages.find(
            (message) => message.id === body.messageId,
          );
          assert.equal(message.senderId, ownId);
          if (
            body.editSequence !== message.editSequence &&
            body.body !== message.body
          )
            return json(
              route,
              { message: 'Edit conflict' },
              409,
            );
          if (body.body !== message.body)
            Object.assign(message, {
              body: body.body,
              editSequence: ++editSequence,
              editedAt: new Date().toISOString(),
            });
          await new Promise((resolve) =>
            setTimeout(resolve, 250),
          );
          if (failEdit) {
            failEdit = false;
            return json(
              route,
              { message: 'Response lost after save' },
              503,
            );
          }
          return json(route, message);
        }
        if (url.pathname === '/chats/archive') {
          if (failArchive) {
            failArchive = false;
            return json(
              route,
              { message: 'Try again' },
              503,
            );
          }
          archived = body.archived;
          return json(route, detail());
        }
        if (url.pathname === '/chats/read')
          return json(route, { ok: true });
        return json(route, {});
      });
      if (app.role === 'USER') {
        await page.request.get(
          `http://localhost:${app.port}/chat`,
          { maxRedirects: 0 },
        );
        await page.route(
          '**/_next/data/**/chat.json*',
          (route) =>
            json(route, { pageProps: {}, __N_SSP: true }),
        );
        await page.goto(`http://localhost:${app.port}/404`);
        await page.waitForFunction(
          () => window.next?.router?.isReady,
        );
        await page.evaluate(async () => {
          await window.next.router.push('/chat');
        });
      } else
        await page.goto(
          `http://localhost:${app.port}/chat`,
        );
      const row = page
        .locator('.ui-chat-list-item')
        .filter({ hasText: 'Campaign team' });
      await row.click();
      await page
        .getByText('My original message', { exact: true })
        .waitFor();
      assert.equal(
        await page
          .locator('.ui-chat-message[data-own="false"]')
          .getByRole('button', { name: labels.edit })
          .count(),
        0,
      );
      const composer = page.locator(
        '.ui-chat-composer textarea',
      );
      await composer.fill('Unsent draft stays here');
      await page
        .getByRole('button', {
          name: labels.edit,
          exact: true,
        })
        .click();
      let dialog = page.getByRole('dialog');
      await dialog
        .getByRole('textbox', {
          name: labels.message,
          exact: true,
        })
        .fill('');
      assert.equal(
        await dialog
          .getByRole('button', {
            name: labels.save,
            exact: true,
          })
          .isDisabled(),
        true,
      );
      await dialog
        .getByRole('textbox', {
          name: labels.message,
          exact: true,
        })
        .fill('My corrected message');
      const save = dialog.getByRole('button', {
        name: labels.save,
        exact: true,
      });
      const before = await save.boundingBox();
      await save.click();
      assert.deepEqual(
        await save.boundingBox(),
        before,
        'Save button stays the same size while saving',
      );
      await dialog.getByRole('alert').waitFor();
      assert.equal(
        await dialog
          .getByRole('textbox', {
            name: labels.message,
            exact: true,
          })
          .inputValue(),
        'My corrected message',
      );
      await save.click();
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(
        editSequence,
        1,
        'Retry does not apply edit twice',
      );
      await page
        .locator('.ui-chat-bubble')
        .getByText('My corrected message', { exact: true })
        .waitFor();
      await page
        .locator('.ui-chat-message[data-own="true"]')
        .getByText(labels.edited + ' ·', { exact: false })
        .waitFor();
      assert.equal(
        await composer.inputValue(),
        'Unsent draft stays here',
      );
      await page
        .getByRole('button', {
          name: labels.edit,
          exact: true,
        })
        .click();
      dialog = page.getByRole('dialog');
      await dialog
        .getByRole('textbox', {
          name: labels.message,
          exact: true,
        })
        .fill('My unsaved edit');
      Object.assign(messages[0], {
        body: 'Changed in another tab',
        editSequence: ++editSequence,
        editedAt: now,
      });
      await page.evaluate(() =>
        window.dispatchEvent(new Event('focus')),
      );
      await dialog
        .getByRole('button', {
          name: labels.save,
          exact: true,
        })
        .click();
      await dialog.getByRole('alert').waitFor();
      assert.equal(
        await dialog
          .getByRole('textbox', {
            name: labels.message,
            exact: true,
          })
          .inputValue(),
        'My unsaved edit',
      );
      await dialog
        .getByRole('button', {
          name: labels.cancel,
          exact: true,
        })
        .click();
      await page
        .locator('.ui-chat-bubble')
        .getByText('Changed in another tab', {
          exact: true,
        })
        .waitFor();
      Object.assign(messages[1], {
        body: 'Updated agency reply',
        editSequence: ++editSequence,
        editedAt: now,
      });
      await page.evaluate(() =>
        window.dispatchEvent(new Event('focus')),
      );
      await page
        .locator('.ui-chat-bubble')
        .getByText('Updated agency reply', { exact: true })
        .waitFor();
      assert.equal(
        await page.locator('.ui-chat-message').count(),
        2,
      );
      await page
        .getByRole('button', {
          name: labels.archive,
          exact: true,
        })
        .click();
      await page.getByRole('alert').waitFor();
      assert.equal(
        await page
          .getByRole('heading', {
            name: 'Campaign team',
            exact: true,
          })
          .count(),
        1,
        'Archive failure keeps chat open',
      );
      await page
        .getByRole('button', {
          name: labels.archive,
          exact: true,
        })
        .click();
      await row.waitFor({ state: 'hidden' });
      await page
        .getByRole('button', { name: labels.archived })
        .click();
      await row.click();
      await page
        .getByRole('button', {
          name: labels.restore,
          exact: true,
        })
        .waitFor();
      assert.equal(
        await page
          .locator('.ui-chat-archived-notice')
          .count(),
        1,
      );
      assert.equal(
        await composer.inputValue(),
        'Unsent draft stays here',
      );
      await page.setViewportSize({
        width: 390,
        height: 844,
      });
      assert.ok(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            innerWidth,
        ),
      );
      await page.screenshot({
        path: `/tmp/itsyou-chat-actions-${app.role}-mobile.png`,
      });
      await page
        .getByRole('button', {
          name: labels.edit,
          exact: true,
        })
        .click();
      await page.screenshot({
        path: `/tmp/itsyou-chat-edit-${app.role}-mobile.png`,
      });
      await page
        .getByRole('dialog')
        .getByRole('button', {
          name: labels.cancel,
          exact: true,
        })
        .click();
      await page
        .getByRole('button', {
          name: labels.restore,
          exact: true,
        })
        .click();
      await page
        .getByRole('button', {
          name: labels.all,
          exact: true,
        })
        .click();
      await row.click();
      await page
        .getByRole('button', {
          name: labels.archive,
          exact: true,
        })
        .click();
      await page
        .getByRole('button', { name: labels.archived })
        .click();
      await row.waitFor();
      archived = false;
      messages.push({
        ...messages[1],
        id: '555555555555555555555555',
        body: 'New message reopens the chat',
        sequence: 3,
        editSequence: 0,
        editedAt: null,
      });
      await page.evaluate(() =>
        window.dispatchEvent(new Event('focus')),
      );
      await row.waitFor({ state: 'hidden' });
      await page
        .getByRole('button', {
          name: labels.all,
          exact: true,
        })
        .click();
      await row.waitFor();
      if (app.role === 'CLIENT') {
        archived = true;
        await page.setViewportSize({ width: 1440, height: 960 });
        await page.route('**:8888/client/requests*', (route) => json(route, {
          id, project: 'Campaign request', status: 'OPEN', location: 'Vienna',
          time: '', tasks: '', salary: '', description: '', createdAt: now,
          personalRequests: [], pitches: [],
        }));
        await page.goto(`http://localhost:${app.port}/requests/${id}?tab=chat`);
        const embedded = page.locator('.ui-chat-workspace[data-embedded="true"]');
        await embedded.getByRole('button', { name: labels.archived }).click();
        await embedded.locator('.ui-chat-list-item').click();
        await embedded.getByRole('button', { name: labels.restore, exact: true }).click();
        await embedded.getByRole('button', { name: labels.all, exact: true }).click();
        await embedded.locator('.ui-chat-list-item').click();
        const chatHeight = (await embedded.locator('.ui-chat').boundingBox()).height;
        await embedded.getByRole('button', { name: labels.archive, exact: true }).click();
        await embedded.locator('.ui-chat-list-item').waitFor({ state: 'hidden' });
        assert.equal((await embedded.locator('.ui-chat').boundingBox()).height, chatHeight, 'Archiving the last request chat keeps the layout stable and archive reachable');
        await embedded.getByRole('button', { name: labels.archived }).click();
        await embedded.locator('.ui-chat-list-item').waitFor();
      }
      assert.deepEqual(errors, []);
      console.log(
        `${app.role}: own-message editing, conflict/retry handling, remote edit sync, personal archive/restore, new-message reopening and mobile controls passed`,
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
