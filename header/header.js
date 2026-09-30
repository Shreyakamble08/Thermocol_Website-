/**
 * Rishabh Thermocole — Common Header Component loader
 *
 * Usage on any page:
 *   <div id="header-mount"></div>
 *   <link rel="stylesheet" href="/header/header.css">
 *   <script src="/header/header.js" defer></script>
 *
 * Requires http(s) — fetch() cannot read local files via file://.
 */
(function () {
    'use strict';

    if (window.__rtHeaderBooted) return;
    window.__rtHeaderBooted = true;

    var MOUNT_SELECTOR = '#header-mount';
    var HEADER_PATH = '/header/header.html';
    var DESKTOP_MIN = 1024;
    var TAG = '[RT header]';

    function setState(value) {
        document.documentElement.setAttribute('data-rt-header', value);
    }
    function log() {
        try { console.info.apply(console, [TAG].concat([].slice.call(arguments))); } catch (e) { }
    }
    function safely(name, fn) {
        try { fn(); }
        catch (error) { console.error(TAG + ' "' + name + '" failed.', error); }
    }

    /* ----------------------------------------------------------------
       1. Mobile menu
       ---------------------------------------------------------------- */
    function getHeader() { return document.getElementById('site-header'); }

    function getMenu() {
        var all = document.querySelectorAll('#mobile-menu');
        if (!all.length) return null;

        var header = getHeader();
        var keep = (header && header.querySelector('#mobile-menu')) ||
            document.querySelector('#mobile-menu[data-rt-menu]') ||
            all[all.length - 1];

        all.forEach(function (el) {
            if (el !== keep && el.parentNode) el.parentNode.removeChild(el);
        });
        keep.setAttribute('data-rt-menu', '1');
        if (keep.parentNode !== document.body) document.body.appendChild(keep);
        return keep;
    }

    function setGroup(group, open) {
        var trigger = group.querySelector('.mobile-nav-trigger');
        var sub = group.querySelector('.mobile-sub');
        group.classList.toggle('is-open', open);
        if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (sub) {
            sub.classList.toggle('is-open', open);
            sub.setAttribute('aria-hidden', open ? 'false' : 'true');
        }
    }

    function openMenu() {
        var header = getHeader();
        var menu = getMenu();
        if (!header || !menu) return;

        var btn = document.getElementById('menu-toggle');
        var ham = document.getElementById('hamburger-icon');
        var backdrop = document.getElementById('mobile-backdrop');

        // NOTE: no paddingTop — the mobile menu is a right-side panel
        // that covers the viewport from the very top.
        menu.classList.add('is-open');
        menu.removeAttribute('inert');
        menu.setAttribute('aria-hidden', 'false');
        if (backdrop) backdrop.classList.add('is-open');
        if (ham) ham.classList.add('is-open');
        if (btn) {
            btn.setAttribute('aria-expanded', 'true');
            btn.setAttribute('aria-label', 'Close menu');
        }
        document.body.classList.add('mobile-menu-open');
    }

    function closeMenu() {
        var menu = getMenu();
        var btn = document.getElementById('menu-toggle');
        var ham = document.getElementById('hamburger-icon');
        var backdrop = document.getElementById('mobile-backdrop');

        // Return focus to toggle button BEFORE hiding the menu
        if (menu && menu.contains(document.activeElement)) {
            if (btn) btn.focus();
            else document.activeElement.blur();
        }

        if (menu) {
            menu.classList.remove('is-open');
            menu.setAttribute('aria-hidden', 'true');
            menu.setAttribute('inert', '');
        }
        if (backdrop) backdrop.classList.remove('is-open');
        if (ham) ham.classList.remove('is-open');
        if (btn) {
            btn.setAttribute('aria-expanded', 'false');
            btn.setAttribute('aria-label', 'Open menu');
        }
        document.body.classList.remove('mobile-menu-open');
    }

    function isMenuOpen() {
        var menu = getMenu();
        return !!(menu && menu.classList.contains('is-open'));
    }

    function onDocumentClick(event) {
        var target = event.target;
        if (!target || !target.closest) return;

        // (a) Close button (X) inside mobile menu head
        if (target.closest('#mobile-close')) {
            event.preventDefault();
            event.stopPropagation();
            closeMenu();
            return;
        }

        // (b) Click on the backdrop — close menu
        if (target.closest('#mobile-backdrop')) {
            event.preventDefault();
            closeMenu();
            return;
        }

        // (c) Hamburger toggle
        if (target.closest('#menu-toggle')) {
            event.preventDefault();
            event.stopPropagation();
            if (isMenuOpen()) closeMenu(); else openMenu();
            return;
        }

        // (d) Accordion trigger inside mobile menu
        var trigger = target.closest('#mobile-menu .mobile-nav-trigger');
        if (trigger) {
            var menu = trigger.closest('#mobile-menu');
            var group = trigger.closest('[data-accordion]');
            if (!menu || !group) return;
            event.preventDefault();
            event.stopPropagation();
            var willOpen = !group.classList.contains('is-open');
            menu.querySelectorAll('[data-accordion]').forEach(function (other) {
                if (other !== group) setGroup(other, false);
            });
            setGroup(group, willOpen);
            return;
        }

        // (e) Any link inside the mobile menu closes it
        if (target.closest('#mobile-menu a')) closeMenu();
    }

    function onKeydown(event) {
        if (event.key === 'Escape' && isMenuOpen()) closeMenu();
    }

    function onResize() {
        if (window.innerWidth >= DESKTOP_MIN) closeMenu();
    }

    document.addEventListener('click', onDocumentClick, true);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', function () { setTimeout(onResize, 120); });

    /* ----------------------------------------------------------------
       2. Loader
       ---------------------------------------------------------------- */
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

    function loadHeader() {
        var mount = document.querySelector(MOUNT_SELECTOR);
        if (!mount) { setState('error:no-#header-mount'); return; }
        if (mount.dataset.loaded === 'true') return;
        mount.dataset.loaded = 'true';

        setState('loading');

        fetch(HEADER_PATH, { cache: 'no-cache' })
            .then(function (response) {
                if (!response.ok) throw new Error('Header fetch failed: ' + response.status);
                return response.text();
            })
            .then(function (html) {
                mount.innerHTML = cleanMarkup(html);
                initHeader();
            })
            .catch(function (error) {
                mount.dataset.loaded = '';
                setState('error:' + (error && error.message ? error.message : 'fetch'));
                console.error(TAG + ' could not load header.', error);
            });
    }

    function initHeader() {
        var header = getHeader();
        if (!header) { setState('error:no-#site-header'); return; }

        getMenu();
        safely('mobile menu content', function () { ensureMobileGroups(header); });
        safely('active link', function () { setActiveLink(); });
        safely('desktop dropdowns', function () { initDropdowns(header); });
        safely('scroll shadow', function () { initScrollShadow(header); });
        safely('header offset', function () { setHeaderOffset(header); });

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () { setHeaderOffset(header); });
        }

        window.addEventListener('resize', function () { setHeaderOffset(header); });
        window.addEventListener('orientationchange', function () {
            setTimeout(function () { setHeaderOffset(header); }, 120);
        });

        setState('ready');
        log('ready');
    }

    /* ----------------------------------------------------------------
       3. Build mobile accordions from desktop nav
       ---------------------------------------------------------------- */
    var CARET_SVG = '<span class="mobile-caret" aria-hidden="true"></span>';

    function textOf(node) {
        var clone = node.cloneNode(true);
        clone.querySelectorAll('script, style, svg').forEach(function (el) {
            if (el.parentNode) el.parentNode.removeChild(el);
        });
        return (clone.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function ensureMobileGroups(header) {
        var menu = getMenu();
        var inner = menu && menu.querySelector('.mobile-inner');
        var items = header.querySelectorAll('.desktop-nav [data-dropdown]');
        if (!inner || !items.length) return;

        inner.querySelectorAll('[data-accordion]').forEach(function (g) {
            g.parentNode.removeChild(g);
        });

        var frag = document.createDocumentFragment();

        items.forEach(function (item, i) {
            var trigger = item.querySelector('.nav-trigger');
            var panel = item.querySelector('.dropdown');
            if (!trigger) return;

            var key = (trigger.getAttribute('aria-controls') || ('menu' + i)).replace(/^dd-/, '');
            var subId = 'm-' + key;

            var group = document.createElement('div');
            group.className = 'mobile-group';
            group.setAttribute('data-accordion', '');

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'mobile-nav-trigger';
            btn.setAttribute('aria-expanded', 'false');
            btn.setAttribute('aria-controls', subId);
            btn.appendChild(document.createTextNode(textOf(trigger)));
            btn.insertAdjacentHTML('beforeend', CARET_SVG);

            var sub = document.createElement('div');
            sub.id = subId;
            sub.className = 'mobile-sub';
            sub.setAttribute('aria-hidden', 'true');

            if (panel) {
                panel.querySelectorAll('a.dropdown-link').forEach(function (a) {
                    var link = document.createElement('a');
                    link.className = 'mobile-sub-link';
                    link.setAttribute('data-nav-link', '');
                    link.setAttribute('href', a.getAttribute('href') || '#');
                    var label = a.querySelector('.dropdown-label');
                    link.textContent = textOf(label || a);
                    sub.appendChild(link);
                });
            }

            group.appendChild(btn);
            group.appendChild(sub);
            frag.appendChild(group);
        });

        // Insert built groups AFTER the actions block
        var actions = inner.querySelector('.mobile-actions');
        if (actions) {
            actions.parentNode.insertBefore(frag, actions.nextSibling);
        } else {
            inner.insertBefore(frag, inner.firstChild);
        }
    }

    /* ----------------------------------------------------------------
       4. Utilities
       ---------------------------------------------------------------- */
    function setHeaderOffset(header) {
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                var h = header.getBoundingClientRect().height;
                if (h > 0) {
                    document.body.style.paddingTop = h + 'px';
                    document.documentElement.style.setProperty('--header-height', h + 'px');
                }
            });
        });
    }

    function setActiveLink() {
        var currentPath = window.location.pathname.replace(/\/$/, '') || '/index.php';
        var currentSearch = window.location.search;

        document.querySelectorAll('[data-nav-link]').forEach(function (link) {
            var href = link.getAttribute('href');
            if (!href) return;
            var url;
            try { url = new URL(href, window.location.origin); }
            catch (e) { return; }

            var linkPath = url.pathname.replace(/\/$/, '') || '/index.php';
            if (linkPath !== currentPath) return;
            if (url.search !== currentSearch) return;

            link.classList.add('is-active');
            var parentItem = link.closest('.nav-item');
            if (parentItem) parentItem.classList.add('is-active');
        });
    }

    function initDropdowns(header) {
        var items = header.querySelectorAll('[data-dropdown]');
        if (!items.length) return;
        var supportsHover = window.matchMedia('(hover: hover)').matches;
        var VIEWPORT_PADDING = 16;

        function closeAll(except) {
            items.forEach(function (item) {
                if (item === except) return;
                item.classList.remove('is-open', 'dropdown-open-left');
                var trigger = item.querySelector('.nav-trigger');
                var panel = item.querySelector('.dropdown');
                if (trigger) trigger.setAttribute('aria-expanded', 'false');
                if (panel) panel.setAttribute('aria-hidden', 'true');
            });
        }

        function positionPanel(item) {
            var panel = item.querySelector('.dropdown-panel');
            if (!panel) return;
            item.classList.remove('dropdown-open-left');
            requestAnimationFrame(function () {
                var rect = panel.getBoundingClientRect();
                if (rect.right > window.innerWidth - VIEWPORT_PADDING) {
                    item.classList.add('dropdown-open-left');
                }
            });
        }

        function open(item) {
            closeAll(item);
            item.classList.add('is-open');
            var trigger = item.querySelector('.nav-trigger');
            var panel = item.querySelector('.dropdown');
            if (trigger) trigger.setAttribute('aria-expanded', 'true');
            if (panel) panel.setAttribute('aria-hidden', 'false');
            positionPanel(item);
        }

        function close(item) {
            item.classList.remove('is-open', 'dropdown-open-left');
            var trigger = item.querySelector('.nav-trigger');
            var panel = item.querySelector('.dropdown');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
            if (panel) panel.setAttribute('aria-hidden', 'true');
        }

        items.forEach(function (item) {
            var trigger = item.querySelector('.nav-trigger');
            if (!trigger) return;

            trigger.addEventListener('click', function (event) {
                event.stopPropagation();
                if (item.classList.contains('is-open')) close(item);
                else open(item);
            });

            if (supportsHover) {
                item.addEventListener('mouseenter', function () { open(item); });
                item.addEventListener('mouseleave', function () { close(item); });
            }

            item.querySelectorAll('.dropdown-link').forEach(function (link) {
                link.addEventListener('click', function () { close(item); });
            });
        });

        document.addEventListener('click', function () { closeAll(null); });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') closeAll(null);
        });

        window.addEventListener('resize', function () {
            items.forEach(function (item) {
                if (item.classList.contains('is-open')) positionPanel(item);
            });
        });
    }

    function initScrollShadow(header) {
        function toggleShadow() {
            header.classList.toggle('is-scrolled', window.scrollY > 8);
        }
        toggleShadow();
        window.addEventListener('scroll', toggleShadow, { passive: true });
    }

    window.rtHeaderDebug = function () {
        var menu = document.getElementById('mobile-menu');
        return {
            state: document.documentElement.getAttribute('data-rt-header'),
            headerInDom: !!getHeader(),
            dropdowns: document.querySelectorAll('.desktop-nav [data-dropdown]').length,
            mobileGroups: document.querySelectorAll('#mobile-menu [data-accordion]').length,
            menuOpen: !!(menu && menu.classList.contains('is-open'))
        };
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadHeader);
    } else {
        loadHeader();
    }
})();