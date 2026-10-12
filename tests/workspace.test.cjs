const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { filterSelectOptions, findActiveRoute, flattenNavigation, Pagination, SearchSelect, Button, Input } = require('../dist');
const options = [
  { value: 'a', label: 'Müller Studio', meta: '#1042', description: 'Anna · Wien', keywords: ['anna@example.test', '+43 (660) 123-4567', 'ATU1234'] },
  { value: 'b', label: 'North Studio', meta: '#1043', description: 'Berlin' },
];
test('search matches accents, numbers, contacts, email, formatted phones and multiple terms', () => {
  for (const query of ['muller', '#1042', 'anna', 'anna@example.test', '+436601234567', '1042 Wien', 'ATU1234']) {
    assert.deepEqual(filterSelectOptions(options, query).map((o) => o.value), ['a'], query);
  }
  assert.deepEqual(filterSelectOptions(options, 'Studio').map((o) => o.value), ['a', 'b']);
  assert.equal(filterSelectOptions(options, 'unknown').length, 0);
  assert.equal(filterSelectOptions(options, '   ').length, 2);
});
test('search handles a large directory without changing input order or data', () => {
  const directory = Array.from({length: 10000}, (_, i) => ({ value: String(i), label: `Client ${i}`, meta: `#${10000 + i}` }));
  assert.deepEqual(filterSelectOptions(directory, '#19999').map((o) => o.value), ['9999']);
  assert.equal(directory[0].value, '0');
});
test('navigation picks the most specific route and respects path boundaries', () => {
  const nav = { Workspace: [{name: 'Home', href: '/'}, {name: 'Profile', href: '/profile', children: [{name: 'Create', href: '/profile/create'}]}] };
  assert.equal(flattenNavigation(nav).length, 3);
  assert.equal(findActiveRoute(nav, '/profile/create?step=1').name, 'Create');
  assert.equal(findActiveRoute(nav, '/profile-extra'), undefined);
  assert.equal(findActiveRoute(nav, '/').name, 'Home');
});
test('pagination presents valid empty and out-of-range states', () => {
  const empty = renderToStaticMarkup(React.createElement(Pagination, {page: 1, pageSize:25, total:0, onPageChange:()=>{}}));
  assert.match(empty, /0–0 of 0 results/);
  assert.equal((empty.match(/disabled=""/g) || []).length, 2);
  const last = renderToStaticMarkup(React.createElement(Pagination, {page: 9, pageSize:25, total:26, onPageChange:()=>{}}));
  assert.match(last, /26–26 of 26 results/);
  assert.match(last, /Page 2 of 2/);
});
test('selector submits an identifier and associates error text with its input', () => {
  const markup = renderToStaticMarkup(React.createElement(SearchSelect, {id:'client',label:'Client', name:'clientId', value:'a', options, onChange:()=>{},error:'Required'}));
  assert.match(markup, /type="hidden" name="clientId" value="a"/);
  assert.match(markup, /aria-errormessage="client-message"/);
  assert.match(markup, /aria-invalid="true"/);
  assert.match(markup, /for="client"/);
});
test('base fields expose labels and loading buttons are disabled', () => {
  const field = renderToStaticMarkup(React.createElement(Input, {id:'email',label:'Email',error:'Required'}));
  assert.match(field, /for="email"/);
  assert.match(field, /aria-invalid="true"/);
  const button = renderToStaticMarkup(React.createElement(Button, {isLoading:true},'Save'));
  assert.match(button, /disabled=""/);
  assert.match(button, /aria-busy="true"/);
});
