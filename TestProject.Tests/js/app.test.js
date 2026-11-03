const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../../wwwroot/app.js');

test('formatBytes formats byte counts cleanly', () => {
    assert.equal(app.formatBytes(0), '0 B');
    assert.equal(app.formatBytes(512), '512 B');
    assert.equal(app.formatBytes(2048), '2.0 KB');
    assert.equal(app.formatBytes(5 * 1024 * 1024), '5.0 MB');
});

test('escapeHtml escapes special HTML characters', () => {
    assert.equal(app.escapeHtml('<script>"alert(\'xss\')&"</script>'), '&lt;script&gt;&quot;alert(&#039;xss&#039;)&amp;&quot;&lt;/script&gt;');
});

test('getLastPathSegment extracts file or folder name', () => {
    assert.equal(app.getLastPathSegment('docs/sub/notes.txt'), 'notes.txt');
    assert.equal(app.getLastPathSegment('readme.txt'), 'readme.txt');
    assert.equal(app.getLastPathSegment(''), '');
});

test('getParentPath extracts parent folder or empty for root items', () => {
    assert.equal(app.getParentPath('docs/sub/notes.txt'), 'docs/sub');
    assert.equal(app.getParentPath('docs/notes.txt'), 'docs');
    assert.equal(app.getParentPath('readme.txt'), '');
});

test('combinePath joins folder and name without duplicate slashes', () => {
    assert.equal(app.combinePath('', 'readme.txt'), 'readme.txt');
    assert.equal(app.combinePath('docs', 'readme.txt'), 'docs/readme.txt');
    assert.equal(app.combinePath('/docs/nested/', '/notes.txt'), 'docs/nested/notes.txt');
});

test('parseUrlState and buildUrlState support deep-linking state', () => {
    const queryStr = app.buildUrlState('docs/archive', 'report');
    assert.equal(queryStr, '?open=1&path=docs%2Farchive&q=report');

    const parsed = app.parseUrlState(queryStr);
    assert.equal(parsed.open, true);
    assert.equal(parsed.path, 'docs/archive');
    assert.equal(parsed.query, 'report');
    assert.equal(parsed.mode, 'search');

    const browseState = app.parseUrlState('?open=1&path=docs');
    assert.equal(browseState.mode, 'browse');
});
