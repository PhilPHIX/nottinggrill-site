// sticky header
    const header = document.getElementById('header');
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    onScroll(); window.addEventListener('scroll', onScroll, { passive:true });

    // mobile nav
    const nav = document.getElementById('nav');
    const toggle = document.getElementById('navToggle');
    const backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);
    const setNav = (open) => {
      nav.classList.toggle('open', open);
      backdrop.classList.toggle('show', open);
      toggle.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', () => setNav(!nav.classList.contains('open')));
    backdrop.addEventListener('click', () => setNav(false));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setNav(false)));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });

    // click-to-play videos (inline Google Drive player)
    document.querySelectorAll('.vcard[data-embed]').forEach(card => {
      card.addEventListener('click', () => {
        if (card.querySelector('iframe')) return;
        const thumb = card.querySelector('.vthumb');
        const iframe = document.createElement('iframe');
        iframe.src = card.dataset.embed;
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;';
        thumb.innerHTML = '';
        thumb.appendChild(iframe);
      });
    });

    // scroll reveal
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    // staggered children reveal
    document.querySelectorAll('[data-stagger]').forEach(grid => {
      [...grid.children].forEach((child, i) => { child.style.transitionDelay = (i * 0.09) + 's'; });
    });
    const ioStagger = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); ioStagger.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('[data-stagger]').forEach(el => ioStagger.observe(el));

    