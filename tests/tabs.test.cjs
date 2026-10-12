const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { Tabs } = require('../dist');

const items = [
  { name: 'Overview', panel: 'Request brief' },
  { name: 'People', count: 0, panel: React.createElement('input', { name: 'selection' }) },
];

test('controlled content tabs expose their selected panel and retain hidden forms', () => {
  const html = renderToStaticMarkup(React.createElement(Tabs, {
    items, variant: 'underline', label: 'Request sections', selectedIndex: 1,
    onChange: () => {}, keepMounted: true,
  }));
  assert.match(html, /aria-label="Request sections"/);
  assert.match(html, /aria-selected="true"[^>]*>People/);
  assert.match(html, /ui-content-tab-count">0<\/span>/);
  assert.match(html, /hidden=""[^>]*>Request brief<\/div>/);
  assert.match(html, /role="tabpanel"[^>]*><input name="selection"/);
});

test('existing segmented tabs still default to the first panel and unmount inactive content', () => {
  const html = renderToStaticMarkup(React.createElement(Tabs, { items }));
  assert.match(html, /aria-selected="true"[^>]*>Overview/);
  assert.match(html, /Request brief/);
  assert.doesNotMatch(html, /name="selection"/);
  assert.doesNotMatch(html, /ui-content-tabs-list/);
});
