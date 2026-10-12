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
const { groupConversations } = mod.exports;
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
test('admin groups by client ID, preserving activity order without request subgroups', () => {
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
