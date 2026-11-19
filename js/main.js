document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header');
    const menuToggle = document.querySelector('#menu-icon');
    const menuToggleIcon = menuToggle ? menuToggle.querySelector('i') : null;
    const navbar = document.querySelector('.navbar');
    const sections = Array.from(document.querySelectorAll('main section[id]'));
    const navLinks = Array.from(document.querySelectorAll('header nav a'));

    const setMenuOpen = (isOpen) => {
        if (!menuToggle || !navbar) return;
        navbar.classList.toggle('active', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        menuToggle.setAttribute('aria-label', isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi');
        if (menuToggleIcon) {
            menuToggleIcon.classList.toggle('bx-x', isOpen);
            menuToggleIcon.classList.toggle('bx-menu', !isOpen);
        }
    };

    if (menuToggle && navbar) {
        menuToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const isOpen = !navbar.classList.contains('active');
            setMenuOpen(isOpen);
        });

        navLinks.forEach((link) => {
            link.addEventListener('click', () => setMenuOpen(false));
        });

        document.addEventListener('click', (event) => {
            if (navbar.classList.contains('active') && !header.contains(event.target)) {
                setMenuOpen(false);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && navbar.classList.contains('active')) {
                setMenuOpen(false);
                menuToggle.focus();
            }
        });
    }

    // Scroll reveal with IntersectionObserver (guarantees bottom sections always reveal)
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('show-animate');
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -40px 0px',
            }
        );

        sections.forEach((sec) => {
            if (!sec.classList.contains('show-animate')) {
                revealObserver.observe(sec);
            }
        });
    } else {
        sections.forEach((sec) => sec.classList.add('show-animate'));
    }

    // Active navigation link & header scrolled state
    const setActiveLink = (sectionId) => {
        navLinks.forEach((link) => {
            const isActive = link.getAttribute('href') === `#${sectionId}`;
            link.classList.toggle('active', isActive);
        });
    };

    let lastScrollY = window.scrollY;
    let isTicking = false;

    const updateOnScroll = () => {
        const scrollY = window.scrollY;

        if (header) {
            header.classList.toggle('header-scrolled', scrollY > 50);
        }

        // Close mobile menu only after intentional scrolling
        if (navbar && navbar.classList.contains('active') && Math.abs(scrollY - lastScrollY) > 25) {
            setMenuOpen(false);
        }
        lastScrollY = scrollY;

        // If user reached the bottom of the page, activate the last section (#kontak)
        const nearBottom = window.innerHeight + scrollY >= document.documentElement.scrollHeight - 24;
        if (nearBottom && sections.length > 0) {
            const lastSection = sections[sections.length - 1];
            lastSection.classList.add('show-animate');
            setActiveLink(lastSection.id);
        } else {
            const headerOffset = (header ? header.offsetHeight : 72) + 80;
            let currentSectionId = sections[0] ? sections[0].id : '';

            for (const sec of sections) {
                if (scrollY + headerOffset >= sec.offsetTop) {
                    currentSectionId = sec.id;
                }
            }

            if (currentSectionId) {
                setActiveLink(currentSectionId);
            }
        }

        isTicking = false;
    };

    window.addEventListener(
        'scroll',
        () => {
            if (!isTicking) {
                window.requestAnimationFrame(updateOnScroll);
                isTicking = true;
            }
        },
        { passive: true }
    );

    updateOnScroll();

    // Menu Category Filtering System (race-condition safe, preserves CSS hover)
    const menuSection = document.querySelector('#menu');
    const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
    const menuBoxes = Array.from(document.querySelectorAll('.menu-box'));
    const hideTimers = new WeakMap();

    filterBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const filterValue = btn.getAttribute('data-filter');

            if (menuSection) {
                menuSection.classList.add('filter-interacted');
            }

            filterBtns.forEach((b) => {
                const isSelected = b === btn;
                b.classList.toggle('active', isSelected);
                b.setAttribute('aria-pressed', String(isSelected));
            });

            menuBoxes.forEach((box) => {
                const existingTimer = hideTimers.get(box);
                if (existingTimer) {
                    clearTimeout(existingTimer);
                    hideTimers.delete(box);
                }

                const category = box.getAttribute('data-category');
                const shouldShow = filterValue === 'all' || category === filterValue;

                if (shouldShow) {
                    box.classList.remove('menu-box--hidden');
                    // Force reflow before removing hiding class for smooth transition
                    void box.offsetWidth;
                    box.classList.remove('menu-box--hiding');
                } else {
                    box.classList.add('menu-box--hiding');
                    const timerId = setTimeout(() => {
                        box.classList.add('menu-box--hidden');
                        hideTimers.delete(box);
                    }, 220);
                    hideTimers.set(box, timerId);
                }
            });
        });
    });

    // Automatic Open/Closed status based on WITA (Asia/Makassar, 08:00 - 00:00)
    const openStatusEl = document.querySelector('#open-status');
    const openStatusText = openStatusEl ? openStatusEl.querySelector('.status-text') : null;

    const updateOpenStatus = () => {
        if (!openStatusEl || !openStatusText) return;

        let hourWita;
        try {
            const parts = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Makassar',
                hour: '2-digit',
                hour12: false,
            }).formatToParts(new Date());
            const hourPart = parts.find((p) => p.type === 'hour');
            hourWita = hourPart ? parseInt(hourPart.value, 10) % 24 : new Date().getHours();
        } catch {
            // Fallback to UTC+8 if Intl timeZone is unavailable
            const now = new Date();
            hourWita = (now.getUTCHours() + 8) % 24;
        }

        const isOpen = hourWita >= 8 && hourWita < 24;
        openStatusEl.classList.toggle('open-status--open', isOpen);
        openStatusEl.classList.toggle('open-status--closed', !isOpen);
        openStatusText.textContent = isOpen
            ? 'Buka Sekarang · Tutup 00.00 WITA'
            : 'Sedang Tutup · Buka 08.00 WITA';
    };

    updateOpenStatus();
    setInterval(updateOpenStatus, 60000);
});
