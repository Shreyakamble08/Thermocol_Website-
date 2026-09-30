/**
 * Rishabh Green BuildTech — Common Footer Component loader
 *
 * Usage on any page:
 *   <div id="footer-mount"></div>
 *   <link rel="stylesheet" href="/footer/footer.css">
 *   <script src="/footer/footer.js" defer></script>
 *
 * Requires http(s) — fetch() cannot read local files via file://.
 */
(function () {
  'use strict';

  if (window.__rgbFooterBooted) return;
  window.__rgbFooterBooted = true;

  var MOUNT_SELECTOR = '#footer-mount';
  var FOOTER_PATH = '/footer/footer.html';
  var TAG = '[RGB footer]';

  function setState(value) {
    document.documentElement.setAttribute('data-rgb-footer', value);
  }
  function log() {
    try { console.info.apply(console, [TAG].concat([].slice.call(arguments))); } catch (e) { }
  }

  function cleanMarkup(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script').forEach(function (s) {
      if (s.parentNode) s.parentNode.removeChild(s);
    });
    var walker = doc.createTreeWalker(doc.documentElement, NodeFilter.SHOW_COMMENT, null);
    var comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach(function (c) { if (c.parentNode) c.parentNode.removeChild(c); });
    return doc.body.innerHTML;
  }

  function loadFooter() {
    var mount = document.querySelector(MOUNT_SELECTOR);
    if (!mount) { setState('error:no-#footer-mount'); return; }
    if (mount.dataset.loaded === 'true') return;
    mount.dataset.loaded = 'true';

    setState('loading');

    fetch(FOOTER_PATH, { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('Footer fetch failed: ' + response.status);
        return response.text();
      })
      .then(function (html) {
        mount.innerHTML = cleanMarkup(html);
        setState('ready');
        log('ready');
      })
      .catch(function (error) {
        mount.dataset.loaded = '';
        setState('error:' + (error && error.message ? error.message : 'fetch'));
        console.error(TAG + ' could not load footer.', error);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFooter);
  } else {
    loadFooter();
  }
})();