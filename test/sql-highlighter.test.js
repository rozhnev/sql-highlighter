const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const SQLHighlighter = require(path.join(__dirname, '..', 'sql-highlighter.js'));

function highlight(sql) {
    const block = { innerHTML: sql };
    SQLHighlighter.highlightCodeSQL(block);
    return block.innerHTML;
}

test('highlights basic keywords', () => {
    const html = highlight('SELECT * FROM users');
    assert.match(html, /<span class="keyword">SELECT<\/span>/);
    assert.match(html, /<span class="keyword">FROM<\/span>/);
});

test('does not highlight keywords embedded in other words', () => {
    const html = highlight('SELECT id FROM orders WHERE origin IN (1)');
    assert.doesNotMatch(html, /ord<span class="keyword">OR<\/span>ders/i);
    assert.doesNotMatch(html, /orig<span class="keyword">IN<\/span>/i);
});

test('SELECT DISTINCT is not double-wrapped by the plain SELECT rule', () => {
    const html = highlight('SELECT DISTINCT id FROM t');
    assert.equal((html.match(/<span class="keyword">/g) || []).length, 2);
    assert.match(html, /<span class="keyword">SELECT\s+DISTINCT<\/span>/);
});

test('functions are only highlighted when called', () => {
    const html = highlight('SELECT COUNT(*), MAX AS m FROM t');
    assert.match(html, /<span class="built-in">COUNT<\/span>\(/);
    assert.doesNotMatch(html, /<span class="built-in">MAX<\/span>/);
});

test('data types are highlighted', () => {
    const html = highlight('CREATE TABLE t (id INT, name VARCHAR(255))');
    assert.match(html, /<span class="type">INT<\/span>/);
    assert.match(html, /<span class="type">VARCHAR<\/span>/);
});

test('numbers are highlighted but not digits inside identifiers', () => {
    const html = highlight('TIMESTAMPDIFF(unit, datetime1, datetime2) AND x = 5');
    assert.doesNotMatch(html, /datetime<span class="number">1<\/span>/);
    assert.match(html, /<span class="number">5<\/span>/);
});

test('string literals are protected from all other highlighting', () => {
    const html = highlight("SELECT * FROM t WHERE note = 'SELECT 123 -- not a comment'");
    assert.match(html, /<span class="string">'SELECT 123 -- not a comment'<\/span>/);
});

test('doubled and escaped quotes inside strings do not break parsing', () => {
    const html = highlight("SELECT * FROM t WHERE note = 'it''s 42'");
    assert.match(html, /<span class="string">'it''s 42'<\/span>/);
});

test('comments are protected and wrapped', () => {
    const html = highlight('SELECT 1 -- SELECT 2\nFROM t /* SELECT 3 */');
    assert.match(html, /<span class="comment">-- SELECT 2<\/span>/);
    assert.match(html, /<span class="comment">\/\* SELECT 3 \*\/<\/span>/);
});

test('extend() appends to the keyword/function/constant/type lists', () => {
    const before = SQLHighlighter.keyWords.length;
    SQLHighlighter.extend({
        keyWords: ['MERGE'],
        functions: ['ARRAY_AGG'],
        constants: ['CURRENT_ROLE'],
        types: ['JSONB']
    });
    assert.equal(SQLHighlighter.keyWords.length, before + 1);

    const html = highlight('MERGE INTO t; SELECT ARRAY_AGG(x), CURRENT_ROLE; CREATE TABLE u (d JSONB)');
    assert.match(html, /<span class="keyword">MERGE<\/span>/);
    assert.match(html, /<span class="built-in">ARRAY_AGG<\/span>/);
    assert.match(html, /<span class="built-in">CURRENT_ROLE<\/span>/);
    assert.match(html, /<span class="type">JSONB<\/span>/);
});

test('highlightCodeBlocks scans the DOM via the configurable selector', () => {
    const block = { classList: { contains: () => true }, innerHTML: 'SELECT 1' };
    const calls = [];
    global.document = {
        querySelectorAll(selector) {
            calls.push(selector);
            return [block];
        }
    };
    try {
        SQLHighlighter.highlightCodeBlocks();
    } finally {
        delete global.document;
    }
    assert.deepEqual(calls, [SQLHighlighter.codeBlockSelector]);
    assert.match(block.innerHTML, /<span class="keyword">SELECT<\/span>/);
});
