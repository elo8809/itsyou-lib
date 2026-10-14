const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const webpack = require('webpack');
const { chromium } = require('playwright');

(async () => {
  const output = fs.mkdtempSync(
    path.join(os.tmpdir(), 'itsyou-attention-'),
  );
  let browser, server;
  try {
    await new Promise((resolve, reject) => {
      const compiler = webpack({
        mode: 'development',
        devtool: false,
        entry: path.join(
          __dirname,
          'fixtures/attention.jsx',
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
        res.end(
          fs.readFileSync(
            path.join(
              __dirname,
              '../dist/assets/css/design-system.css',
            ),
          ),
        );
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
        : {}),
    });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    let counts = {
      notifications: 4,
      chat: 127,
      applications: 3,
      contact: 0,
    };
    let release;
    let pause = false;
    let requests = 0;
    await page.route(
      '**/workspace/attention',
      async (route) => {
        requests++;
        const response = { ...counts };
        if (pause)
          await new Promise((resolve) => {
            release = resolve;
          });
        await route
          .fulfill({ json: response })
          .catch(() => {});
      },
    );
    page.on('pageerror', (error) => console.error(error));
    await page.goto(
      `http://127.0.0.1:${server.address().port}`,
    );
    const sidebar = page.locator('aside.ui-sidebar');
    const navBadge = (href) =>
      sidebar.locator(`a[href="${href}"] .ui-nav-count`);
    await page
      .waitForFunction(
        () =>
          document.querySelector('.ui-nav-count')
            ?.textContent === '4',
        null,
        { timeout: 10000 },
      )
      .catch(async (error) => {
        console.log({
          requests,
          body: await page.locator('body').innerText(),
        });
        throw error;
      });
    assert.equal(await navBadge('/inbox').innerText(), '4');
    assert.equal(
      await navBadge('/chat').innerText(),
      '99+',
    );
    assert.equal(
      await sidebar
        .locator('a[href="/chat"]')
        .getAttribute('aria-label'),
      'Chat, 127 needing attention',
    );
    assert.equal(await navBadge('/contact').count(), 0);
    assert.equal(
      await page.locator('.ui-nav-dot').count(),
      0,
    );
    const size = await sidebar
      .locator('a[href="/chat"]')
      .boundingBox();
    await page.evaluate(() => window.navigate('/chat'));
    await page.waitForFunction(
      () =>
        document
          .querySelector('a[href="/chat"]')
          ?.getAttribute('aria-current') === 'page',
    );
    assert.equal(
      await navBadge('/chat').innerText(),
      '99+',
    );
    assert.equal(
      (
        await sidebar
          .locator('a[href="/chat"]')
          .boundingBox()
      ).height,
      size.height,
    );
    counts = { ...counts, notifications: 0, chat: 1 };
    await page.evaluate(() =>
      window.dispatchEvent(
        new Event('itsyou:notifications-changed'),
      ),
    );
    await navBadge('/inbox').waitFor({ state: 'detached' });
    await page.waitForFunction(
      () =>
        document.querySelector(
          'a[href="/chat"] .ui-nav-count',
        )?.textContent === '1',
    );
    counts.chat = 0;
    await page.evaluate(() =>
      window.dispatchEvent(
        new Event('itsyou:attention-changed'),
      ),
    );
    await navBadge('/chat').waitFor({ state: 'detached' });
    counts.applications = 2;
    await page.evaluate(() => window.finishMutation());
    await page.waitForFunction(
      () =>
        document.querySelector(
          'a[href="/applications"] .ui-nav-count',
        )?.textContent === '2',
    );
    // Hide previous account's badges immediately, even while a new request waits.
    pause = true;
    counts = {
      notifications: 1,
      chat: 2,
      applications: 0,
      contact: 0,
    };
    await page.evaluate(() =>
      window.switchAccount('other-member'),
    );
    await page.waitForFunction(
      () => !document.querySelector('.ui-nav-count'),
    );
    while (!release)
      await new Promise((resolve) =>
        setTimeout(resolve, 10),
      );
    pause = false;
    release();
    await page.waitForFunction(
      () =>
        document.querySelector(
          'a[href="/inbox"] .ui-nav-count',
        )?.textContent === '1',
    );
    await page.screenshot({
      path: path.join(output, 'desktop.png'),
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .getByRole('button', {
        name: 'Open navigation',
        exact: true,
      })
      .click();
    const drawer = page.getByRole('dialog');
    await drawer.locator('.ui-mobile-sidebar').waitFor();
    assert.equal(
      await drawer
        .locator('a[href="/inbox"] .ui-nav-count')
        .innerText(),
      '1',
    );
    assert.equal(
      await drawer
        .locator('a[href="/chat"] .ui-nav-count')
        .innerText(),
      '2',
    );
    const overflow = await drawer.evaluate(
      (el) => el.scrollWidth > el.clientWidth,
    );
    assert.equal(overflow, false);
    await page.screenshot({
      path: path.join(output, 'mobile.png'),
    });
    assert.ok(requests >= 6);
    console.log(
      `PASS: active/inactive badges, 99+, zero hiding, no selection dot, read/mutation updates, account isolation, mobile drawer. Screenshots: ${output}`,
    );
  } finally {
    await browser?.close();
    await new Promise((resolve) =>
      server ? server.close(resolve) : resolve(),
    );
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
