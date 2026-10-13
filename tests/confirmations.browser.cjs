const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const webpack = require('webpack');
const { chromium } = require('playwright');

// Real browser coverage of Headless UI portals, focus, keyboard and async actions.
(async () => {
  const output = fs.mkdtempSync(
    path.join(os.tmpdir(), 'itsyou-confirmations-'),
  );
  let browser;
  let server;
  try {
    await new Promise((resolve, reject) => {
      const compiler = webpack({
        mode: 'development',
        devtool: false,
        entry: path.join(
          __dirname,
          'fixtures/confirmations.jsx',
        ),
        output: { path: output, filename: 'fixture.js' },
        module: {
          rules: [
            {
              test: /\.jsx$/,
              exclude: /node_modules/,
              use: {
                loader: require.resolve('ts-loader'),
                options: {
                  transpileOnly: true,
                  configFile: path.join(
                    __dirname,
                    '../tsconfig.json',
                  ),
                },
              },
            },
          ],
        },
      });
      compiler.run((error, stats) => {
        compiler.close(() => {});
        if (error || stats.hasErrors())
          reject(
            error ||
              new Error(
                stats.toString({
                  all: false,
                  errors: true,
                }),
              ),
          );
        else resolve();
      });
    });
    const css = fs.readFileSync(
      path.join(
        __dirname,
        '../dist/assets/css/design-system.css',
      ),
    );
    server = http.createServer((req, res) => {
      if (req.url === '/fixture.js') {
        res.setHeader(
          'Content-Type',
          'text/javascript; charset=utf-8',
        );
        res.end(
          fs.readFileSync(path.join(output, 'fixture.js')),
        );
      } else if (req.url === '/style.css') {
        res.setHeader('Content-Type', 'text/css');
        res.end(css);
      } else {
        res.setHeader(
          'Content-Type',
          'text/html; charset=utf-8',
        );
        res.end(
          '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script>window.process={env:{NODE_ENV:"development"}}</script><script src="/fixture.js"></script></body></html>',
        );
      }
    });
    await new Promise((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    browser = await chromium.launch({
      headless: true,
      ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
        ? {
            executablePath:
              process.env.PLAYWRIGHT_EXECUTABLE_PATH,
          }
        : process.env.PLAYWRIGHT_CHANNEL
          ? { channel: process.env.PLAYWRIGHT_CHANNEL }
          : {}),
    });
    const page = await browser.newPage({
      viewport: { width: 1280, height: 850 },
    });
    const errors = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
      console.error(error.stack);
    });
    await page.goto(
      `http://127.0.0.1:${server.address().port}`,
    );
    const calls = () => page.evaluate(() => window.calls);
    const dialog = page.getByRole('dialog');
    const open = async () => {
      await page
        .getByRole('button', {
          name: 'Email invoice',
          exact: true,
        })
        .click();
      await dialog
        .locator('.ui-action-dialog-panel')
        .waitFor();
    };
    // Opening, cancellation, Escape and backdrop dismissal must never run an action.
    await open();
    assert.deepEqual(await calls(), []);
    await page
      .getByRole('button', { name: 'Cancel', exact: true })
      .click();
    await dialog.waitFor({ state: 'detached' });
    assert.equal(
      await page
        .getByRole('button', {
          name: 'Email invoice',
          exact: true,
        })
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await open();
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    await open();
    await page.mouse.click(5, 5);
    await dialog.waitFor({ state: 'detached' });
    assert.deepEqual(await calls(), []);
    assert.equal(
      await page
        .getByRole('button', {
          name: 'Disabled',
          exact: true,
        })
        .isDisabled(),
      true,
    );

    // Pending requests resist rapid clicks, Escape, close and cancel.
    await open();
    await page
      .getByRole('button', {
        name: 'Send email',
        exact: true,
      })
      .evaluate((el) => {
        el.click();
        el.click();
      });
    assert.deepEqual(await calls(), ['email']);
    assert.equal(
      await page
        .getByRole('button', {
          name: 'Cancel',
          exact: true,
        })
        .isDisabled(),
      true,
    );
    assert.equal(
      await page
        .getByRole('button', { name: 'Close', exact: true })
        .isDisabled(),
      true,
    );
    await page.keyboard.press('Escape');
    await page.mouse.click(5, 5);
    assert.equal(await dialog.count(), 1);
    await page.evaluate(() =>
      window.failAction({
        response: {
          data: { message: 'Email service unavailable' },
        },
      }),
    );
    await page.getByRole('alert').waitFor();
    assert.match(
      await page.getByRole('alert').innerText(),
      /Email service unavailable/,
    );
    await page
      .getByRole('button', {
        name: 'Send email',
        exact: true,
      })
      .click();
    assert.deepEqual(await calls(), ['email', 'email']);
    await page.evaluate(() => window.completeAction());
    await dialog.waitFor({ state: 'detached' });
    await open();
    assert.equal(await page.getByRole('alert').count(), 0);
    await page.keyboard.press('Escape');

    // The legacy button also awaits completion and never submits its surrounding form.
    await page
      .getByRole('button', { name: 'Delete', exact: true })
      .click();
    await page
      .getByRole('button', {
        name: 'Delete photo',
        exact: true,
      })
      .click();
    assert.deepEqual(await calls(), [
      'email',
      'email',
      'legacy',
    ]);
    await page.evaluate(() => window.completeAction());
    await dialog.waitFor({ state: 'detached' });

    // A confirmation nested in a form dialog leaves entered details intact on cancel.
    await page
      .getByRole('button', {
        name: 'Edit document',
        exact: true,
      })
      .click();
    await page
      .getByRole('textbox', { name: 'Project' })
      .fill('Updated campaign');
    await page
      .getByRole('button', {
        name: 'Create PDF',
        exact: true,
      })
      .click();
    await page
      .getByRole('dialog', { name: 'Generate document?' })
      .locator('.ui-action-dialog-panel')
      .waitFor();
    await page
      .getByRole('button', { name: 'Cancel', exact: true })
      .click();
    assert.equal(
      await page
        .getByRole('textbox', { name: 'Project' })
        .inputValue(),
      'Updated campaign',
    );
    assert.deepEqual(await calls(), [
      'email',
      'email',
      'legacy',
    ]);
    await page.keyboard.press('Escape');

    // German labels and the mobile layout use the same component.
    await page.setViewportSize({ width: 375, height: 667 });
    await page
      .getByRole('button', {
        name: 'Vertrag anfordern',
        exact: true,
      })
      .click();
    await page
      .getByRole('button', {
        name: 'Vertrag erstellen',
        exact: true,
      })
      .click();
    await page.evaluate(() => window.failAction(null));
    await page.getByRole('alert').waitFor();
    assert.match(
      await page.getByRole('alert').innerText(),
      /Etwas ist schiefgelaufen/,
    );
    const box = await page
      .locator('.ui-action-dialog-panel')
      .boundingBox();
    assert.ok(
      box.x >= 0 &&
        box.x + box.width <= 375 &&
        box.y >= 0 &&
        box.y + box.height <= 667,
    );
    await page.screenshot({
      path: path.join(output, 'confirmation-mobile.png'),
    });
    await page
      .getByRole('button', {
        name: 'Abbrechen',
        exact: true,
      })
      .click();
    assert.deepEqual(errors, []);
    console.log(
      'PASS: confirmation cancellation, focus, async errors/retry, duplicate prevention, legacy adapter, nested dialogs, German labels and mobile layout.',
    );
    if (process.env.CONFIRMATION_SCREENSHOT)
      fs.copyFileSync(
        path.join(output, 'confirmation-mobile.png'),
        process.env.CONFIRMATION_SCREENSHOT,
      );
  } finally {
    await browser?.close();
    if (server)
      await new Promise((resolve) => server.close(resolve));
    fs.rmSync(output, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
