(function () {
    'use strict';

    var slider = document.getElementById('heroSlider');
    if (!slider) return;

    var slides = slider.querySelectorAll('.hero-slide');
    var rails = slider.querySelectorAll('.hero-rail');
    var dots = slider.querySelectorAll('.hero-dot');
    var prevBtns = slider.querySelectorAll('[data-nav="prev"]');
    var nextBtns = slider.querySelectorAll('[data-nav="next"]');
    var counterDesktop = document.getElementById('heroCounter');
    var counterMobileTop = document.getElementById('heroCounterMobile');
    var counterMobileBottom = document.getElementById('heroCounterMobileBottom');
    var watermark = document.getElementById('heroWatermark');

    var current = 0;
    var total = slides.length;
    var AUTO_MS = 7000;
    var timer = null;
    var paused = false;

    function pad(n) { return String(n).padStart(2, '0'); }

    function updateUI() {
        // Slides
        slides.forEach(function (s, i) {
            s.classList.toggle('is-active', i === current);
        });

        // Rails (desktop)
        rails.forEach(function (r, i) {
            var isActive = i === current;
            r.classList.toggle('is-active', isActive);
            r.setAttribute('aria-selected', isActive ? 'true' : 'false');

            var bar = r.querySelector('.hero-rail-bar');
            if (bar) {
                bar.style.animation = 'none';
                void bar.offsetWidth;
                if (isActive) {
                    bar.style.animation = 'railBarFill ' + (AUTO_MS / 1000) + 's linear forwards';
                }
            }
        });

        // Dots (mobile)
        dots.forEach(function (d, i) {
            var isActive = i === current;
            d.classList.toggle('is-active', isActive);
            d.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        // Counters (all 3 places)
        var label = pad(current + 1);
        if (counterDesktop) counterDesktop.textContent = label;
        if (counterMobileTop) counterMobileTop.textContent = label;
        if (counterMobileBottom) counterMobileBottom.textContent = label;
        if (watermark) watermark.textContent = label;
    }

    function goTo(index) {
        var next = (index + total) % total;
        if (next === current) return;
        current = next;
        updateUI();
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function startAutoplay() {
        stopAutoplay();
        if (total < 2) return;
        timer = setTimeout(function loop() {
            if (!paused) next();
            timer = setTimeout(loop, AUTO_MS);
        }, AUTO_MS);
    }

    function stopAutoplay() {
        if (timer) { clearTimeout(timer); timer = null; }
    }

    function pause() {
        paused = true;
        var activeRail = rails[current];
        if (activeRail) {
            var bar = activeRail.querySelector('.hero-rail-bar');
            if (bar) bar.style.animationPlayState = 'paused';
        }
    }

    function resume() {
        if (!paused) return;
        paused = false;
        var activeRail = rails[current];
        if (activeRail) {
            var bar = activeRail.querySelector('.hero-rail-bar');
            if (bar) bar.style.animationPlayState = 'running';
        }
        startAutoplay();
    }

    function manualGoTo(index) {
        goTo(index);
        startAutoplay();
    }

    // ---- Arrow buttons (desktop + mobile) ----
    prevBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            manualGoTo(current - 1);
        });
    });

    nextBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            manualGoTo(current + 1);
        });
    });

    // ---- Rails (desktop) ----
    rails.forEach(function (r) {
        r.addEventListener('click', function () {
            manualGoTo(parseInt(r.getAttribute('data-dot'), 10));
        });
    });

    // ---- Dots (mobile) ----
    dots.forEach(function (d) {
        d.addEventListener('click', function () {
            manualGoTo(parseInt(d.getAttribute('data-dot'), 10));
        });
    });

    // ---- Keyboard ----
    document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') manualGoTo(current - 1);
        if (e.key === 'ArrowRight') manualGoTo(current + 1);
    });

    // ---- Pause on hover (desktop) ----
    slider.addEventListener('mouseenter', pause);
    slider.addEventListener('mouseleave', resume);

    // ---- Touch: pause + swipe (mobile) ----
    var touchStartX = 0;
    var touchStartY = 0;
    var SWIPE_THRESHOLD = 50;
    var SWIPE_MAX_VERTICAL = 80;

    slider.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        pause();
    }, { passive: true });

    slider.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].screenX - touchStartX;
        var dy = e.changedTouches[0].screenY - touchStartY;

        if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_MAX_VERTICAL) {
            if (dx < 0) manualGoTo(current + 1);   // swipe left → next
            else manualGoTo(current - 1);          // swipe right → prev
        } else {
            setTimeout(resume, 500);
        }
    }, { passive: true });

    // ---- Pause when tab is hidden ----
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) pause();
        else resume();
    });

    // ---- Init ----
    updateUI();
    startAutoplay();

    // ---- Debug helper ----
    window.rtHeroDebug = function () {
        return { current: current, total: total, paused: paused };
    };
})();