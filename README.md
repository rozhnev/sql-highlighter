# sql-highlighter

A small, dependency-free SQL syntax highlighter for the browser. No build step,
no framework — drop in a `<script>` tag (or `import`/`require` it) and call one
function.

It highlights:

- keywords (`SELECT`, `JOIN`, `GROUP BY`, `CASE WHEN`, window functions, ...)
- built-in functions, but only when actually called, e.g. `COUNT(` — not `COUNT` used as a column name
- data types (`INT`, `VARCHAR`, `TIMESTAMP`, `JSON`, ...)
- string literals (`'...'` / `"..."`, including escaped/doubled quotes) — nothing inside a string is ever re-highlighted
- comments (`-- ...` and `/* ... */`) — likewise protected from further highlighting
- numbers, without matching digits embedded in identifiers (`datetime1` is left alone)

## Install

```bash
npm install sql-highlighter
```

or via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/sql-highlighter/sql-highlighter.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sql-highlighter/sql-highlighter.min.css">
```

## Usage

```html
<pre>
  <code class="language-sql">
    SELECT
      id, name 
    FROM users 
    WHERE created_at > '2024-01-01'
  </code>
</pre>

<script src="sql-highlighter.min.js"></script>
<link rel="stylesheet" href="sql-highlighter.min.css">
<script>
  SQLHighlighter.highlightCodeBlocks();
</script>
```

By default it scans the page for `pre code` elements and highlights the ones
with a `language-sql` class. Anything else is left untouched (there's a
`highlightCodeCommon` hook you can extend for non-SQL languages).

### Module usage

```js
// CommonJS
const SQLHighlighter = require('sql-highlighter');

// ES modules / bundlers (webpack, esbuild, vite, ...)
import SQLHighlighter from 'sql-highlighter';
```

### Configuring the selector

If your code blocks don't match `pre code` / `.language-sql`, point the
highlighter at your own markup before calling it:

```js
SQLHighlighter.codeBlockSelector = '.my-code-block';
SQLHighlighter.sqlLanguageClass = 'sql';
SQLHighlighter.highlightCodeBlocks();
```

### Extending the keyword/function/type lists

Add your dialect's extra keywords, functions, constants or types without
forking the library:

```js
SQLHighlighter.extend({
  keyWords: ['MERGE', 'PIVOT'],
  functions: ['ARRAY_AGG'],
  constants: ['CURRENT_ROLE'],
  types: ['JSONB', 'UUID']
});

SQLHighlighter.highlightCodeBlocks();
```

`extend()` appends to the existing lists — call it once, before
`highlightCodeBlocks()`.

### Highlighting a single block

```js
const block = document.querySelector('#my-code');
SQLHighlighter.highlightCodeSQL(block);
```

## Styling / theming

`sql-highlighter.css` defines one class per token type, all driven by CSS
custom properties so you can restyle without touching the rules themselves:

| Class | Variable | Default |
|---|---|---|
| `.keyword` | `--sql-hl-keyword` | `#aa0d91` |
| `.built-in` / `.constant` | `--sql-hl-builtin` | `#5c2699` |
| `.type` | `--sql-hl-type` | `#0b6125` |
| `.number` | `--sql-hl-number` | `#1c00cf` |
| `.string` | `--sql-hl-string` | `#c41a16` |
| `.comment` | `--sql-hl-comment` | `#6a737d` |

Dark-mode values are applied automatically via
`@media (prefers-color-scheme: dark)`, and overridden by an explicit
`[data-theme="dark"]` attribute on `<html>` if your page manages its own
theme toggle:

```html
<html data-theme="dark">
```

To override colors yourself, just set the variables on `.language-sql` (or
higher up the tree):

```css
.language-sql {
  --sql-hl-keyword: #ff0080;
}
```

The block background/text color fall back to `--sql-background-color` /
`--question-text` if your page defines them, otherwise to sane defaults —
no other CSS from your site is required.

## How it works

This is a regex-based highlighter, not a real SQL parser. It runs a series of
word-boundary-aware passes over the code block's `innerHTML`:

1. comments and string literals are located and temporarily replaced with a
   placeholder token, so no later pass can highlight text inside them
2. keywords, functions (only when followed by `(`), constants, and data types
   are wrapped in `<span>`s, each pass skipping text a previous pass already
   wrapped
3. bare numbers are highlighted, but not digits embedded in identifiers
4. the placeholders from step 1 are swapped back for the original text,
   wrapped in `.comment` / `.string` spans

This keeps it small and dependency-free, at the cost of not handling every
edge case a full parser would (e.g. deeply nested dialect-specific syntax).
If you need that, look at [highlight.js](https://highlightjs.org/) or
[Prism](https://prismjs.com/) instead — this project exists for cases where
those are too heavy for "highlight a few SQL snippets on a page".

## Development

```bash
npm install
npm test          # run the test suite
npm run build     # regenerate the .min.js / .min.css files after editing sources
```

## License

MIT — see [LICENSE](LICENSE).
