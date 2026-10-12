const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
// Exercise the built package entry that client request pages actually import.
const { RequestChat } = require('../dist');

test('the public request chat export renders inside a request detail page', () => {
  assert.equal(typeof RequestChat, 'function', 'Rebuild the UI package to expose RequestChat');
  const html = renderToStaticMarkup(React.createElement(RequestChat, {
    apiBaseUrl: 'http://localhost:8888',
    clientRequestId: '68083930797bcae5c5e45696',
    locale: 'de',
  }));
  assert.match(html, /data-embedded="true"/);
  assert.match(html, /<h2>Chat<\/h2>/);
});
