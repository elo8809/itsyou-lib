// Run against the three local dev servers. All sessions and API calls are fixtures.
const assert = require('node:assert/strict');
const { readFile, mkdir } = require('node:fs/promises');
const React = require('react');
const {
  renderToStaticMarkup,
} = require('react-dom/server');
const { chromium } = require('playwright');
const { Button, IconButton } = require('../dist');
const output = '/tmp/itsyou-loading-qa';
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const near = (before, after, message) => {
  for (const key of ['width', 'height'])
    assert.ok(
      Math.abs(before[key] - after[key]) < 1,
      `${message}: ${key} ${before[key]} -> ${after[key]}`,
    );
};
const feed = {
  items: [],
  unreadCount: 0,
  openCount: 0,
  nextCursor: null,
  asOf: '2026-10-12T10:00:00Z',
};
async function fixturePage(browser, port, role, handle) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.clock.install();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      json: {
        user: {
          id: 'fixture-user',
          role,
          name: 'Alex Morgan',
          email: 'fixture@example.test',
        },
        expires: '2099-01-01T00:00:00.000Z',
      },
    }),
  );
  await page.route('**:8888/**', async (route) => {
    const url = new URL(route.request().url());
    const json = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': `http://localhost:${port}`,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify(body),
      });
    if (route.request().method() === 'OPTIONS')
      return json({});
    if (url.pathname.includes('notifications'))
      return json(feed);
    if (await handle(route, url, json)) return;
    return json([]);
  });
  return { page, errors };
}
(async () => {
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });
  try {
    // The shared controls must have exactly the same bounds with and without loaders.
    const controls = await browser.newPage();
    const css = await readFile(
      require.resolve('../dist/assets/css/design-system.css'),
      'utf8',
    );
    for (const props of [
      {},
      { icon: 'Plus' },
      { trailingIcon: 'Link', size: 'sm' },
      { icon: 'File', trailingIcon: 'Link', size: 'lg' },
    ]) {
      const render = (isLoading) =>
        renderToStaticMarkup(
          React.createElement(
            Button,
            { ...props, isLoading },
            'Save changes',
          ),
        );
      await controls.setContent(
        `<style>${css}</style><div id="control" style="display:inline-block">${render(false)}</div>`,
      );
      const before = await controls
        .locator('button')
        .boundingBox();
      await controls
        .locator('#control')
        .evaluate((el, html) => {
          el.innerHTML = html;
        }, render(true));
      near(
        before,
        await controls.locator('button').boundingBox(),
        'Loading button retains size',
      );
      assert.equal(
        await controls
          .getByRole('button', { name: 'Save changes' })
          .getAttribute('aria-busy'),
        'true',
      );
    }
    const iconMarkup = (loading) =>
      renderToStaticMarkup(
        React.createElement(IconButton, {
          icon: 'Refresh',
          size: 24,
          isLoading: loading,
          title: 'Refresh',
        }),
      );
    await controls.setContent(
      `<style>${css}</style><div id="control">${iconMarkup(false)}</div>`,
    );
    const iconBefore = await controls
      .locator('button')
      .boundingBox();
    await controls
      .locator('#control')
      .evaluate((el, html) => {
        el.innerHTML = html;
      }, iconMarkup(true));
    near(
      iconBefore,
      await controls.locator('button').boundingBox(),
      'Icon button retains size',
    );
    await controls.close();

    if (!process.env.MODEL_ONLY) {
      // Client: the next page keeps the current grid visible until its response arrives.
      const models = Array.from({ length: 48 }, (_, i) => ({
        id: `model-${i}`,
        firstName: 'Model',
        lastName: String(i + 1),
        type: 'Model',
        gender: 'FEMALE',
        city: 'Wien',
        height: 175,
        images: [],
        languages: ['de'],
        locations: ['Wien'],
        jobTypes: ['Model'],
      }));
      let clientGate = null,
        clientCalls = 0,
        clientFail = false;
      const client = await fixturePage(
        browser,
        3005,
        'CLIENT',
        async (_route, url, json) => {
          if (url.pathname !== '/client/models')
            return false;
          clientCalls++;

          if (clientGate) await clientGate.promise;
          if (clientFail) {
            await json(
              { message: 'Temporary failure' },
              503,
            );
            return true;
          }
          const number = Number(
            url.searchParams.get('page') || 1,
          );
          await json({
            items: models.slice(
              (number - 1) * 24,
              number * 24,
            ),
            page: number,
            total: 48,
            pageSize: 24,
            totalPages: 2,
          });
          return true;
        },
      );
      console.log('Checking client');
      await client.page.goto(
        'http://localhost:3005/models',
      );
      await client.page
        .getByRole('button', {
          name: 'Profil von Model 1 ansehen',
          exact: true,
        })
        .waitFor();
      const clientGrid = client.page.locator(
        '.client-model-grid',
      );
      const clientBefore = await clientGrid.boundingBox();
      clientGate = deferred();
      await client.page
        .getByRole('button', {
          name: 'Nächste Seite',
          exact: true,
        })
        .click();
      await client.page.screenshot({
        path: `${output}/client-pending.png`,
      });
      await client.page
        .locator(
          '.client-model-directory > .ui-data-region[aria-busy="true"]',
        )
        .waitFor();
      assert.equal(
        await client.page
          .locator('button.client-model-card')
          .count(),
        24,
      );
      near(
        clientBefore,
        await clientGrid.boundingBox(),
        'Pending pagination retains grid dimensions',
      );
      assert.equal(
        await client.page
          .getByRole('button', {
            name: 'Profil von Model 1 ansehen',
            exact: true,
          })
          .count(),
        1,
      );
      clientGate.resolve();
      clientGate = null;
      await client.page
        .getByRole('button', {
          name: 'Profil von Model 25 ansehen',
          exact: true,
        })
        .waitFor();
      await client.page
        .getByText('Seite 2 von 2', { exact: true })
        .waitFor();
      await client.page
        .getByRole('button', {
          name: 'Profil von Model 25 ansehen',
          exact: true,
        })
        .click();
      await client.page
        .locator('.client-model-preview')
        .waitFor();
      clientFail = true;
      await client.page.clock.fastForward(31_000);
      await client.page.waitForTimeout(1800);
      await client.page
        .locator('.ui-refresh-notice')
        .waitFor();
      assert.equal(
        await client.page
          .locator('.client-model-preview')
          .count(),
        1,
        'Refresh failure does not close profile',
      );
      await client.page.keyboard.press('Escape');
      await client.page.screenshot({
        path: `${output}/client-refresh-error.png`,
      });
      assert.deepEqual(client.errors, []);
      await client.page.close();

      // Admin: a refresh and new array contents cannot reset the current orders page.
      let adminGate = null,
        adminCalls = 0;
      const orders = Array.from({ length: 50 }, (_, i) => ({
        id: `order-${i}`,
        project: `Project ${String(i + 1).padStart(2, '0')}`,
        status: 'OPEN',
        createdAt: new Date(
          Date.UTC(2026, 9, 12) - i * 1000,
        ).toISOString(),
        client: { name: 'Studio' },
        items: [{ price: 100, amount: 1 }],
      }));
      const admin = await fixturePage(
        browser,
        3000,
        'ADMIN',
        async (_route, url, json) => {
          if (url.pathname !== '/orders') return false;
          adminCalls++;
          if (adminGate) await adminGate.promise;
          await json(
            orders.map((row, i) =>
              i === 30
                ? {
                    ...row,
                    location: `Updated ${adminCalls}`,
                  }
                : row,
            ),
          );
          return true;
        },
      );
      console.log('Checking admin');
      await admin.page.goto('http://localhost:3000/orders');
      await admin.page
        .getByRole('link', {
          name: 'Project 01',
          exact: true,
        })
        .waitFor();
      await admin.page
        .getByRole('button', {
          name: 'Next page',
          exact: true,
        })
        .click();
      await admin.page
        .getByRole('link', {
          name: 'Project 26',
          exact: true,
        })
        .waitFor();
      const tableBefore = await admin.page
        .locator('section[aria-label="Orders"]')
        .boundingBox();
      adminGate = deferred();
      await admin.page.clock.fastForward(51_000);
      await admin.page
        .locator('.ui-data-region[aria-busy="true"]')
        .waitFor();
      near(
        tableBefore,
        await admin.page
          .locator('section[aria-label="Orders"]')
          .boundingBox(),
        'Refresh retains orders table',
      );
      adminGate.resolve();
      adminGate = null;
      await admin.page
        .getByText('Updated 2', { exact: false })
        .waitFor();
      await admin.page
        .getByText('Page 2 of 2', { exact: true })
        .waitFor();
      assert.equal(
        await admin.page
          .getByRole('link', {
            name: 'Project 26',
            exact: true,
          })
          .count(),
        1,
      );
      assert.deepEqual(admin.errors, []);
      await admin.page.close();
    }
    // Model: dirty preferences survive a failed profile refresh; save buttons stay put.
    let profileGate = null,
      saveGate = null,
      profileFail = false;
    let profile = {
      id: 'profile',
      firstName: 'Alex',
      type: 'Model',
      locations: ['Wien'],
      jobTypes: ['Model'],
    };
    const model = await fixturePage(
      browser,
      3004,
      'USER',
      async (route, url, json) => {
        if (url.pathname === '/users/profile') {
          if (profileGate) await profileGate.promise;
          await json(
            profileFail
              ? { message: 'Temporary failure' }
              : profile,
            profileFail ? 503 : 200,
          );
          return true;
        }
        if (route.request().method() === 'POST') {
          if (saveGate) await saveGate.promise;
          profile = {
            ...profile,
            ...JSON.parse(route.request().postData()),
          };
          await json(profile);
          return true;
        }
        return false;
      },
    );
    await model.page.route(
      '**/_next/data/**/job-filter.json*',
      (route) =>
        route.fulfill({
          json: { pageProps: {}, __N_SSP: true },
        }),
    );
    console.log('Checking model');
    await model.page.request.get(
      'http://localhost:3004/job-filter',
    );
    await model.page.goto('http://localhost:3004/404');
    await model.page.waitForFunction(
      () => window.next?.router?.isReady,
    );
    await model.page.evaluate(() =>
      window.next.router.push('/job-filter'),
    );
    const choice = model.page.getByRole('button', {
      name: 'Hostess',
      exact: true,
    });
    await choice.waitFor().catch(async (error) => {
      console.log(
        'Model diagnostic',
        model.page.url(),
        await model.page.locator('body').innerText(),
        model.errors,
      );
      await model.page.screenshot({
        path: `${output}/model-diagnostic.png`,
      });
      throw error;
    });
    await choice.click();
    const save = model.page.getByRole('button', {
      name: 'Änderungen speichern',
      exact: true,
    });
    const saveBefore = await save.boundingBox();
    saveGate = deferred();
    await save.click();
    await model.page
      .locator('button[aria-busy="true"]')
      .first()
      .waitFor();
    near(
      saveBefore,
      await save.boundingBox(),
      'Saving keeps model form actions sized',
    );
    saveGate.resolve();
    saveGate = null;
    await model.page
      .getByText('Deine Auswahl ist gespeichert', {
        exact: true,
      })
      .waitFor();
    await model.page
      .getByRole('button', {
        name: 'Promoter',
        exact: true,
      })
      .click();
    profileFail = true;
    await model.page.clock.fastForward(51_000);
    await model.page
      .locator('.ui-refresh-notice')
      .waitFor({ timeout: 20000 });
    assert.equal(
      await model.page
        .getByRole('button', {
          name: 'Promoter',
          exact: true,
        })
        .getAttribute('aria-pressed'),
      'true',
    );
    await model.page
      .getByText('Ungespeicherte Änderungen', {
        exact: true,
      })
      .waitFor();
    near(
      saveBefore,
      await save.boundingBox(),
      'Error keeps model form actions sized',
    );
    assert.ok(
      Math.abs(
        saveBefore.y - (await save.boundingBox()).y,
      ) < 1,
      'Refresh error does not move form actions',
    );
    await model.page.setViewportSize({
      width: 390,
      height: 844,
    });
    assert.ok(
      await model.page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          window.innerWidth,
      ),
      'Mobile form has no horizontal overflow',
    );
    await model.page.screenshot({
      path: `${output}/model-mobile-dirty-error.png`,
    });
    assert.deepEqual(model.errors, []);
    await model.page.close();
    console.log(
      process.env.MODEL_ONLY
        ? 'Passed: shared button geometry, model saving and preserved unsaved edits after failed refresh, mobile overflow.'
        : 'Passed: shared button geometry, client delayed pagination and retained preview, admin pagination on refresh, model save geometry and unsaved edits after failed refresh, mobile overflow.',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
