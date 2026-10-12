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
    require.resolve('../src/components/chat/utils.ts'),
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
const { mergeMessages } = mod.exports;
test('late message pages cannot roll back a newer edit or duplicate messages', () => {
  const edited = {
    id: 'a',
    sequence: 1,
    body: 'Corrected',
    editSequence: 7,
  };
  const unchanged = { id: 'b', sequence: 2, body: 'Next' };
  assert.deepEqual(
    mergeMessages(
      [edited, unchanged],
      [
        {
          id: 'a',
          sequence: 1,
          body: 'Stale',
          editSequence: 0,
        },
      ],
    ),
    [edited, unchanged],
  );
  const newer = {
    ...edited,
    body: 'Newest correction',
    editSequence: 8,
  };
  assert.deepEqual(
    mergeMessages([unchanged, edited], [newer, newer]),
    [newer, unchanged],
  );
  assert.equal(edited.body, 'Corrected');
});
