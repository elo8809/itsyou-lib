const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require(
  require.resolve('typescript', {
    paths: [
      require('node:path').dirname(
        require.resolve('ts-loader'),
      ),
    ],
  }),
);
const compiled = ts.transpileModule(
  fs.readFileSync(
    require.resolve('../src/components/chat/grouping.ts'),
    'utf8',
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  },
);
const mod = { exports: {} };
new Function(
  'exports',
  'require',
  'module',
  compiled.outputText,
)(mod.exports, require, mod);
const { groupConversations, groupConversationsByCategory } = mod.exports;
const north = { id: 'n', name: 'Studio' },
  south = { id: 's', name: 'Studio' };
const a = { id: 'a', project: 'Campaign', client: north },
  b = { id: 'b', project: 'Campaign', client: north },
  c = { id: 'c', project: 'Campaign', client: south };
const chats = [
  { id: '1', request: a },
  { id: '2', request: c },
  { id: '3', request: a },
  { id: '4', request: b },
  { id: '5', request: null },
  { id: '6' },
];
test('client grouping preserves activity order and separates equally named clients by ID', () => {
  const before = JSON.stringify(chats);
  const groups = groupConversations(chats);
  assert.deepEqual(
    groups.map((group) => group.id),
    ['n', 's', 'general'],
  );
  assert.deepEqual(
    groups[0].chats.map((chat) => chat.id),
    ['1', '3', '4'],
  );
  assert.deepEqual(
    groups[2].chats.map((chat) => chat.id),
    ['5', '6'],
  );
  assert.equal(JSON.stringify(chats), before);
  assert.deepEqual(groupConversations([]), []);
});

const mixedChats = [
  { id: 'model-new', kind: 'GENERAL', owner: { role: 'USER' } },
  { id: 'client-new', kind: 'GENERAL', owner: { role: 'CLIENT', client: north } },
  { id: 'project-new', kind: 'GROUP', request: a },
  { id: 'client-no-company', kind: 'GENERAL', owner: { role: 'CLIENT' } },
  { id: 'model-old', kind: 'GENERAL', owner: { role: 'USER' } },
  { id: 'project-old', request: c },
  { id: 'unassigned-group', kind: 'GROUP', request: null },
];

test('admin categories separate direct chats from projects while preserving activity order', () => {
  const before = JSON.stringify(mixedChats);
  const groups = groupConversationsByCategory(mixedChats);
  assert.deepEqual(groups.map(group => [group.id, group.chats.map(chat => chat.id)]), [
    ['project', ['project-new', 'project-old', 'unassigned-group']],
    ['general-client', ['client-new', 'client-no-company']],
    ['general-model', ['model-new', 'model-old']],
  ]);
  assert.equal(JSON.stringify(mixedChats), before);
});

test('portal grouping puts the virtual general chat first and keeps project chats together', () => {
  const groups = groupConversationsByCategory([
    mixedChats[2],
    { id: 'general', kind: 'GENERAL', isUnstarted: true },
    mixedChats[5],
  ], 'kind');
  assert.deepEqual(groups.map(group => [group.id, group.chats.map(chat => chat.id)]), [
    ['general', ['general']],
    ['project', ['project-new', 'project-old']],
  ]);
});

test('filtered and archived lists omit empty categories without losing chats from removed accounts', () => {
  const removed = { id: 'removed', kind: 'GENERAL', owner: null, archived: true };
  const archivedClient = { ...mixedChats[1], archived: true };
  assert.deepEqual(groupConversationsByCategory([removed, archivedClient]), [
    { id: 'general-client', chats: [archivedClient] },
    { id: 'general', chats: [removed] },
  ]);
  assert.deepEqual(groupConversationsByCategory([]), []);
  assert.deepEqual(groupConversationsByCategory([], 'kind'), []);
});
