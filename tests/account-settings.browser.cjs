// Run against the local Admin (3000), Model (3004), and Client (3005) dev apps.
// Every API request uses synthetic browser fixtures; no account or email is modified.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? {
          executablePath:
            process.env.PLAYWRIGHT_EXECUTABLE_PATH,
        }
      : {}),
  });
  try {
    for (const [role, port] of [
      ['ADMIN', 3000],
      ['MEMBER', 3000],
      ['CLIENT', 3005],
      ['USER', 3004],
    ]) {
      const de = role === 'CLIENT' || role === 'USER';
      const origin = `http://localhost:${port}`;
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1100 },
      });
      const page = await context.newPage();
      page.setDefaultTimeout(20000);
      let account = {
        email: `${role.toLowerCase()}@example.test`,
        hasPassword: de,
      };
      let nextEmail = '';
      const writes = [],
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.route('**/*', async (route) => {
        const req = route.request(),
          u = new URL(req.url());
        const json = (data, status = 200) =>
          route.fulfill({
            status,
            json: data,
            headers: {
              'Access-Control-Allow-Origin': origin,
              'Access-Control-Allow-Credentials': 'true',
            },
          });
        if (u.pathname === '/api/auth/session')
          return json({
            user: {
              id: '000000000000000000000001',
              role,
              name: 'Preview',
              email: account.email,
              clientId: '000000000000000000000002',
            },
            expires: '2099-01-01T00:00:00Z',
          });
        if (u.origin !== origin) {
          if (u.pathname === '/workspace/attention')
            return json({ notifications: 1, chat: 2 });
          if (u.pathname.includes('/notifications/'))
            return json({
              items: [],
              unreadCount: 1,
              openCount: 1,
              nextCursor: null,
            });
          if (u.pathname === '/account/settings')
            return json(account);
          if (u.pathname.startsWith('/account/')) {
            const body = req.postDataJSON();
            writes.push({ path: u.pathname, body });
            if (u.pathname.endsWith('/password/code'))
              return json({ resendAfter: 60 });
            if (u.pathname.endsWith('/password')) {
              if (body.currentPassword === 'wrong')
                return json(
                  { code: 'CURRENT_PASSWORD' },
                  403,
                );
              account.hasPassword = true;
              return json(account);
            }
            if (u.pathname.endsWith('/email/request')) {
              if (body.email === 'taken@example.test')
                return json(
                  { code: 'EMAIL_UNAVAILABLE' },
                  409,
                );
              nextEmail = body.email;
              return json({ resendAfter: 60 });
            }
            if (u.pathname.endsWith('/email/confirm')) {
              if (body.code !== '123456')
                return json({ code: 'CODE_INVALID' }, 400);
              account.email = nextEmail;
              return json(account);
            }
            return json({ code: 'FAILED' }, 500);
          }
          return json([]);
        }
        return route.continue();
      });
      await page.goto(
        origin + (de ? '/notifications' : '/inbox'),
        { waitUntil: 'networkidle', timeout: 60000 },
      );
      await page
        .getByRole('button', {
          name: de ? 'Kontomenü' : 'Account menu',
          exact: true,
        })
        .click();
      await page
        .getByRole('menuitem', {
          name: de ? 'Einstellungen' : 'Settings',
          exact: true,
        })
        .click();
      await page
        .getByRole('heading', {
          name: de ? 'Einstellungen' : 'Settings',
          exact: true,
          level: 1,
        })
        .waitFor();
      const passwordSection = page
        .locator('.ui-settings > section')
        .first();
      const emailSection = page
        .locator('.ui-settings > section')
        .last();
      if (!de) {
        await passwordSection
          .getByRole('button', {
            name: 'Send verification code',
            exact: true,
          })
          .click();
        await passwordSection
          .getByLabel('Verification code', { exact: true })
          .fill('123456');
        assert.equal(
          await passwordSection
            .getByLabel('Current password', { exact: true })
            .count(),
          0,
        );
      } else {
        await passwordSection
          .getByLabel('Aktuelles Passwort', { exact: true })
          .fill('wrong');
      }
      await passwordSection
        .getByLabel(
          de ? 'Neues Passwort' : 'New password',
          { exact: true },
        )
        .fill('A long new password 123');
      await passwordSection
        .getByLabel(
          de
            ? 'Neues Passwort bestätigen'
            : 'Confirm new password',
          { exact: true },
        )
        .fill('Different new password 123');
      await passwordSection
        .getByRole('button', {
          name: de ? 'Passwort ändern' : 'Set password',
          exact: true,
        })
        .click();
      await passwordSection
        .getByText(
          de
            ? 'Die Passwörter stimmen nicht überein.'
            : 'The passwords do not match.',
          { exact: true },
        )
        .waitFor();
      assert.equal(
        writes.filter((w) => w.path === '/account/password')
          .length,
        0,
      );
      await passwordSection
        .getByLabel(
          de
            ? 'Neues Passwort bestätigen'
            : 'Confirm new password',
          { exact: true },
        )
        .fill('A long new password 123');
      await passwordSection
        .getByRole('button', {
          name: de ? 'Passwort ändern' : 'Set password',
          exact: true,
        })
        .click();
      if (de) {
        await passwordSection
          .getByText(
            'Dein aktuelles Passwort ist nicht korrekt.',
            { exact: true },
          )
          .waitFor();
        await passwordSection
          .getByLabel('Aktuelles Passwort', { exact: true })
          .fill('Current secure password');
        await passwordSection
          .getByRole('button', {
            name: 'Passwort ändern',
            exact: true,
          })
          .click();
      }
      await passwordSection.getByRole('status').waitFor();
      assert.equal(
        await passwordSection
          .getByLabel(
            de ? 'Neues Passwort' : 'New password',
            { exact: true },
          )
          .inputValue(),
        '',
      );
      await emailSection
        .getByLabel(
          de ? 'Neue E-Mail-Adresse' : 'New email address',
          { exact: true },
        )
        .fill('taken@example.test');
      await emailSection
        .getByLabel(
          de ? 'Aktuelles Passwort' : 'Current password',
          { exact: true },
        )
        .fill('A long new password 123');
      await emailSection
        .getByRole('button', {
          name: de
            ? 'Neue E-Mail bestätigen'
            : 'Verify new email',
          exact: true,
        })
        .click();
      await emailSection
        .getByText(
          de
            ? 'Diese E-Mail-Adresse wird bereits verwendet.'
            : 'This email address is already in use.',
          { exact: true },
        )
        .waitFor();
      await emailSection
        .getByLabel(
          de ? 'Neue E-Mail-Adresse' : 'New email address',
          { exact: true },
        )
        .fill(`changed-${role.toLowerCase()}@example.test`);
      await emailSection
        .getByRole('button', {
          name: de
            ? 'Neue E-Mail bestätigen'
            : 'Verify new email',
          exact: true,
        })
        .click();
      await emailSection
        .getByLabel(
          de ? 'Bestätigungscode' : 'Verification code',
          { exact: true },
        )
        .fill('000000');
      await emailSection
        .getByRole('button', {
          name: de
            ? 'E-Mail-Änderung bestätigen'
            : 'Confirm email change',
          exact: true,
        })
        .click();
      await emailSection
        .getByText(
          de
            ? 'Der Code ist falsch, abgelaufen oder bereits verwendet. Versuche es erneut oder fordere einen neuen Code an.'
            : 'The code is incorrect, expired, or has already been used. Try again or request a new code.',
          { exact: true },
        )
        .waitFor();
      assert.equal(
        account.email,
        `${role.toLowerCase()}@example.test`,
      );
      await emailSection
        .getByLabel(
          de ? 'Bestätigungscode' : 'Verification code',
          { exact: true },
        )
        .fill('123456');
      await emailSection
        .getByRole('button', {
          name: de
            ? 'E-Mail-Änderung bestätigen'
            : 'Confirm email change',
          exact: true,
        })
        .click();
      await emailSection.getByRole('status').waitFor();
      assert.equal(
        await page
          .locator('.ui-settings-identity strong')
          .innerText(),
        `changed-${role.toLowerCase()}@example.test`,
      );
      await page
        .getByRole('button', {
          name: de ? 'Kontomenü' : 'Account menu',
          exact: true,
        })
        .click();
      await page
        .locator('.ui-account-info')
        .getByText(account.email, { exact: true })
        .waitFor();
      await page.keyboard.press('Escape');
      await page.screenshot({
        path: `/tmp/itsyou-settings-${role}.png`,
        fullPage: true,
      });
      await page.setViewportSize({
        width: 390,
        height: 844,
      });
      assert.equal(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            innerWidth,
        ),
        false,
      );
      await page.screenshot({
        path: `/tmp/itsyou-settings-${role}-mobile.png`,
        fullPage: true,
      });
      assert.deepEqual(errors, []);
      console.log(
        `PASS ${role}: settings dropdown, password setup/change, validation, email verification, session refresh, mobile layout`,
      );
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
