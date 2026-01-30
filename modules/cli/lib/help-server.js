'use strict';

const http = require('http');
const { generateDocsData } = require('@jsaf/core');

function startHelpServer(context) {
  const docsData = generateDocsData(context);
  const html = generateHtml(docsData);

  const server = http.createServer((req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
    res.end(html);
  });

  // Port 0 = OS picks an available port
  server.listen(0, '127.0.0.1');

  const result = {
    url: null,
    port: null,
    stop() { server.close(); },
    _readyCb: null,
    onReady(cb) { this._readyCb = cb; },
  };

  server.on('listening', () => {
    const addr = server.address();
    result.port = addr.port;
    result.url = `http://127.0.0.1:${addr.port}`;
    if (result._readyCb) result._readyCb(result.url);
  });

  return result;
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateHtml(docsData) {
  // Build sidebar + main content
  let sidebar = '';
  let content = '';

  for (const mod of docsData) {
    const name = mod.module;

    // Group methods by sub-resource (e.g. jobs, builds, pods)
    const groups = {};
    const topLevel = [];
    for (const m of mod.methods) {
      const dot = m.path.indexOf('.');
      if (dot > -1) {
        const group = m.path.slice(0, dot);
        if (!groups[group]) groups[group] = [];
        groups[group].push(m);
      } else {
        topLevel.push(m);
      }
    }

    // Sidebar
    sidebar += `<div class="sb-module">`;
    sidebar += `<a class="sb-module-name" href="#${esc(name)}">${esc(name)}</a>`;
    if (topLevel.length > 0) {
      for (const m of topLevel) {
        sidebar += `<a class="sb-method" href="#${esc(m.fullPath)}" data-search="${esc(m.fullPath.toLowerCase())}">${esc(m.path)}</a>`;
      }
    }
    for (const [group, methods] of Object.entries(groups)) {
      sidebar += `<div class="sb-group">${esc(group)}</div>`;
      for (const m of methods) {
        const shortName = m.path.slice(m.path.indexOf('.') + 1);
        sidebar += `<a class="sb-method sb-sub" href="#${esc(m.fullPath)}" data-search="${esc(m.fullPath.toLowerCase())}">${esc(shortName)}</a>`;
      }
    }
    sidebar += `</div>`;

    // Main content
    content += `<section class="module" id="${esc(name)}">`;
    content += `<h2>${esc(name)}</h2>`;

    if (topLevel.length > 0) {
      for (const m of topLevel) {
        content += renderMethod(m);
      }
    }

    for (const [group, methods] of Object.entries(groups)) {
      content += `<h3 id="${esc(name)}.${esc(group)}">${esc(name)}.${esc(group)}</h3>`;
      for (const m of methods) {
        content += renderMethod(m);
      }
    }

    content += `</section>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>JSAF API Documentation</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #24292e;
  background: #fff;
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.sidebar {
  width: 260px;
  min-width: 260px;
  background: #1e2128;
  color: #c9d1d9;
  padding: 0;
  overflow-y: auto;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
}

.sb-header {
  padding: 20px 16px 12px;
  border-bottom: 1px solid #30363d;
}

.sb-header h1 {
  font-size: 18px;
  color: #f0f6fc;
  margin-bottom: 4px;
}

.sb-header p {
  font-size: 12px;
  color: #8b949e;
}

.sb-search {
  padding: 8px 16px;
  border-bottom: 1px solid #30363d;
}

.sb-search input {
  width: 100%;
  padding: 6px 10px;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  color: #c9d1d9;
  font-size: 13px;
  outline: none;
}

.sb-search input:focus {
  border-color: #58a6ff;
}

.sb-search input::placeholder {
  color: #484f58;
}

.sb-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.sb-module {
  margin-bottom: 4px;
}

.sb-module-name {
  display: block;
  padding: 6px 16px;
  font-weight: 600;
  font-size: 14px;
  color: #f0f6fc;
  text-decoration: none;
}

.sb-module-name:hover {
  background: #30363d;
}

.sb-group {
  padding: 4px 16px 2px 24px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #8b949e;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

.sb-method {
  display: block;
  padding: 2px 16px 2px 28px;
  font-size: 13px;
  color: #8b949e;
  text-decoration: none;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

.sb-method.sb-sub {
  padding-left: 36px;
}

.sb-method:hover {
  color: #58a6ff;
  background: rgba(56, 139, 253, 0.1);
}

.sb-method.hidden {
  display: none;
}

/* Main content */
.main {
  margin-left: 260px;
  flex: 1;
  padding: 32px 48px;
  max-width: 900px;
}

.main > h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.main > .subtitle {
  color: #57606a;
  margin-bottom: 32px;
  font-size: 15px;
}

.module {
  margin-bottom: 48px;
}

.module h2 {
  font-size: 22px;
  padding-bottom: 8px;
  border-bottom: 2px solid #d0d7de;
  margin-bottom: 20px;
  color: #1f2328;
}

.module h3 {
  font-size: 16px;
  color: #57606a;
  margin: 24px 0 12px;
  padding-bottom: 4px;
  border-bottom: 1px solid #d8dee4;
}

.method-card {
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  background: #f6f8fa;
}

.method-card:target {
  border-color: #58a6ff;
  box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.3);
}

.method-sig {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 14px;
  font-weight: 600;
  color: #0550ae;
  word-break: break-all;
}

.method-desc {
  margin-top: 6px;
  font-size: 14px;
  color: #24292e;
}

.method-returns {
  margin-top: 6px;
  font-size: 13px;
  color: #57606a;
}

.method-returns code {
  background: #eff1f3;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #0550ae;
}

.returns-label {
  font-weight: 600;
}

.args-table {
  margin-top: 10px;
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.args-table th {
  text-align: left;
  padding: 4px 12px 4px 0;
  color: #57606a;
  font-weight: 600;
  border-bottom: 1px solid #d8dee4;
}

.args-table td {
  padding: 4px 12px 4px 0;
  border-bottom: 1px solid #eef0f2;
  vertical-align: top;
}

.args-table td:first-child {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  color: #953800;
  white-space: nowrap;
}

/* Scroll offset for fixed sidebar */
:target {
  scroll-margin-top: 20px;
}
</style>
</head>
<body>

<div class="sidebar">
  <div class="sb-header">
    <h1>JSAF</h1>
    <p>API Documentation</p>
  </div>
  <div class="sb-search">
    <input type="text" id="search" placeholder="Search methods..." autocomplete="off">
  </div>
  <div class="sb-nav">
    ${sidebar}
  </div>
</div>

<div class="main">
  <h1>JSAF API Reference</h1>
  <p class="subtitle">JavaScript Automation Framework &mdash; all modules and methods</p>
  ${content}
</div>

<script>
(function() {
  var input = document.getElementById('search');
  var methods = document.querySelectorAll('.sb-method');
  var modules = document.querySelectorAll('.sb-module');
  var groups = document.querySelectorAll('.sb-group');

  input.addEventListener('input', function() {
    var q = this.value.toLowerCase().trim();
    if (!q) {
      methods.forEach(function(el) { el.classList.remove('hidden'); });
      groups.forEach(function(el) { el.style.display = ''; });
      return;
    }
    methods.forEach(function(el) {
      var s = el.getAttribute('data-search') || '';
      el.classList.toggle('hidden', s.indexOf(q) === -1);
    });
    // Hide group headers if all their methods are hidden
    groups.forEach(function(el) {
      var next = el.nextElementSibling;
      var anyVisible = false;
      while (next && next.classList.contains('sb-method')) {
        if (!next.classList.contains('hidden')) anyVisible = true;
        next = next.nextElementSibling;
      }
      el.style.display = anyVisible ? '' : 'none';
    });
  });

  // Highlight active on scroll
  if (location.hash) {
    var el = document.getElementById(CSS.escape(location.hash.slice(1)));
    if (el) setTimeout(function() { el.scrollIntoView(); }, 50);
  }
})();
</script>

</body>
</html>`;
}

function renderMethod(m) {
  let html = `<div class="method-card" id="${esc(m.fullPath)}">`;
  html += `<div class="method-sig">${esc(m.signature)}</div>`;
  if (m.desc) {
    html += `<div class="method-desc">${esc(m.desc)}</div>`;
  }
  if (m.returns) {
    html += `<div class="method-returns"><span class="returns-label">Returns:</span> <code>${esc(m.returns)}</code></div>`;
  }
  if (m.args.length > 0) {
    html += `<table class="args-table"><tr><th>Parameter</th><th>Description</th></tr>`;
    for (const arg of m.args) {
      html += `<tr><td>${esc(arg.name)}</td><td>${esc(arg.desc)}</td></tr>`;
    }
    html += `</table>`;
  }
  html += `</div>`;
  return html;
}

module.exports = { startHelpServer };
