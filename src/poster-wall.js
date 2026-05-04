// 游戏海报墙插件 — 在 game/fliu 页面的各年份标题下方渲染封面图片网格
(function() {
  // ── 常量 ──────────────────────────────────────────────────────────────────

  const POSTER_BASE_URL = 'https://game-poster.nerdliu.cyou/';
  // const POSTER_BASE_URL = 'posters/';  // 本地预览用，上线前换回 R2 URL
  const PAGE_HASH_REGEX = /^#\/game\/fliu(\?|$)/;
  const STYLE_ID = 'poster-wall-styles';

  if (POSTER_BASE_URL.indexOf('CHANGE_ME') !== -1) {
    console.warn('[poster-wall] POSTER_BASE_URL is still a placeholder — update it to your R2 URL');
  }

  // ── 插件注册 ───────────────────────────────────────────────────────────────

  var pendingTimer = null;

  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = (window.$docsify.plugins || []).concat(function(hook, vm) {
    hook.doneEach(function() {
      if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
      if (PAGE_HASH_REGEX.test(window.location.hash)) {
        pendingTimer = setTimeout(function() { pendingTimer = null; main(); }, 500);
      }
    });
  });

  // ── 样式注入 ───────────────────────────────────────────────────────────────

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .poster-wall {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin: 16px 0 24px 0;
      }
      .poster-wall .poster {
        height: 180px;
        border-radius: 6px;
        overflow: hidden;
        cursor: pointer;
        background: #fff;
        transition: transform 0.2s ease;
      }
      .poster-wall .poster:hover {
        transform: scale(1.05);
      }
      .poster-wall .poster img {
        height: 100%;
        width: auto;
        display: block;
      }
      .poster-wall + table tr,
      .poster-wall ~ table tr {
        transition: background 1s ease;
      }
      tr.poster-highlight {
        background: #fff3b0 !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ── 工具函数 ────────────────────────────────────────────────────────────────

  function stripBracketSuffix(raw) {
    var idx = raw.search(/[\[(（]/);
    return (idx === -1 ? raw : raw.slice(0, idx)).trim();
  }

  // ── slug 生成 ──────────────────────────────────────────────────────────────

  function buildSlug(rawDate, rawName) {
    const date = rawDate.trim().replace(/\//g, '-');
    if (!date) return null;

    const name = stripBracketSuffix(rawName).replace(/[\s　]+/g, '-');
    if (!name) return null;

    return `${date}_${name}.webp`;
  }

  // ── 行数据提取 ─────────────────────────────────────────────────────────────

  function extractRowData(tr, isSP) {
    const cells = tr.querySelectorAll('td');

    if (isSP) {
      if (cells.length < 1) return null;
      const rawName = cells[0].textContent;
      const name = stripBracketSuffix(rawName);
      if (!name) return null;
      const slugName = name.replace(/[\s　]+/g, '-');
      const rawComment = cells.length >= 2 ? cells[1].textContent : '';
      const scoreMatch = rawComment.match(/(\d+)\s*\/\s*10/);
      const score = scoreMatch ? scoreMatch[1] : '';
      return { name, score, slug: `SP_${slugName}.webp`, rowRef: tr };
    }

    if (cells.length < 3) return null;
    const rawDate = cells[0].textContent;
    const rawName = cells[1].textContent;
    const rawComment = cells[2].textContent;

    const slug = buildSlug(rawDate, rawName);
    if (!slug) return null;

    const name = stripBracketSuffix(rawName);

    const scoreMatch = rawComment.match(/(\d+)\s*\/\s*10/);
    const score = scoreMatch ? scoreMatch[1] : '';

    return { name, score, slug, rowRef: tr };
  }

  // ── 交互绑定 ───────────────────────────────────────────────────────────────

  function attachInteractions(poster, rowRef) {
    poster.addEventListener('click', function() {
      rowRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
      rowRef.classList.add('poster-highlight');
      setTimeout(function() {
        rowRef.classList.remove('poster-highlight');
      }, 1500);
    });
  }

  // ── 海报墙渲染 ─────────────────────────────────────────────────────────────

  function renderWall(h3, games, baseUrl) {
    if (!games.length) return null;

    const wall = document.createElement('div');
    wall.className = 'poster-wall';

    games.forEach(function(game) {
      const poster = document.createElement('div');
      poster.className = 'poster';
      poster.title = game.score ? `${game.name} — ${game.score}/10` : game.name;

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = game.name;
      img.src = baseUrl + encodeURIComponent(game.slug);
      img.onerror = function() {
        poster.remove();
        if (!wall.children.length) wall.remove();
      };

      attachInteractions(poster, game.rowRef);
      poster.appendChild(img);
      wall.appendChild(poster);
    });

    h3.parentNode.insertBefore(wall, h3.nextSibling);
    return wall;
  }

  // ── 清理旧海报墙 ───────────────────────────────────────────────────────────

  function cleanup() {
    document.querySelectorAll('.poster-wall').forEach(function(el) { el.remove(); });
  }

  // ── 主流程 ────────────────────────────────────────────────────────────────

  function main() {
    cleanup();
    injectStyles();

    const headings = document.querySelectorAll('h3');
    headings.forEach(function(h3) {
      const text = h3.textContent.trim();
      const isYear = /^\d{4}(-\d{4})?$/.test(text);
      const isSP = /^SP(\s|$)/i.test(text);
      if (!isYear && !isSP) return;

      let sibling = h3.nextElementSibling;
      let table = null;
      while (sibling && sibling.tagName !== 'H3') {
        if (sibling.tagName === 'TABLE') { table = sibling; break; }
        sibling = sibling.nextElementSibling;
      }
      if (!table) return;

      const rows = Array.from(table.querySelectorAll('tbody tr'));
      const data = rows.map(function(tr) { return extractRowData(tr, isSP); }).filter(Boolean);
      renderWall(h3, data, POSTER_BASE_URL);
    });
  }
})();
