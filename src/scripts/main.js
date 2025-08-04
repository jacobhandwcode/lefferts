import '../styles/main.scss';

let animationsInitialized = false;
let scrollTriggersCreated = new Set();

function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const mobileItems = document.querySelector('.mobile-items');

  if (hamburger && mobileItems) {
    hamburger.addEventListener('click', function () {
      const isActive = hamburger.classList.contains('is-active');

      if (isActive) {
        mobileItems.classList.add('closing');
        setTimeout(() => {
          hamburger.classList.remove('is-active');
          mobileItems.classList.remove('closing');
        }, 350);
      } else {
        hamburger.classList.add('is-active');
        mobileItems.classList.remove('closing');
      }
    });
  }
}

function initShowArticles() {
  const show = document.querySelector('.show-articles');
  const imgs = document.querySelectorAll('.press-post');

  if (show) {
    show.addEventListener('click', () => {
      for (let i = 0; i < imgs.length; i++) {
        imgs[i].classList.add('show');
      }
      show.classList.add('hide');
    });
  }
}

function initHeroScrollEffects() {
  const hero = document.querySelector('.hero-section');
  const mainMenu = document.querySelector('.home-menu');

  if (!hero || !mainMenu) return;

  function isHomePage() {
    return (
      window.location.pathname === '/' ||
      window.location.pathname === '/index.html'
    );
  }

  if (window.heroScrollHandler) {
    window.removeEventListener('scroll', window.heroScrollHandler);
    window.heroScrollHandler = null;
  }

  if (isHomePage()) {
    const scrollThreshold = 100;

    function checkScrollPosition() {
      if (window.scrollY > scrollThreshold) {
        hero.classList.add('z-index-hero');
        mainMenu.classList.add('white-bg');
      } else {
        hero.classList.remove('z-index-hero');
        mainMenu.classList.remove('white-bg');
      }
    }

    window.heroScrollHandler = checkScrollPosition;
    window.addEventListener('scroll', window.heroScrollHandler);
    checkScrollPosition();
  } else {
    hero.classList.remove('z-index-hero');
    mainMenu.classList.remove('white-bg');
  }
}

function initReadMore() {
  const existingReadMoreBtns = document.querySelectorAll('.read-more-property');
  existingReadMoreBtns.forEach((btn) => {
    btn.replaceWith(btn.cloneNode(true));
  });

  const readMoreBtn = document.querySelector('.read-more-property');

  if (readMoreBtn) {
    const propertyInfo = document.querySelector('.property-info');
    if (!propertyInfo) {
      return;
    }

    const directParagraphs = Array.from(propertyInfo.children).filter(
      (child) =>
        child.tagName === 'P' ||
        (child.matches &&
          child.matches('div') &&
          child.innerHTML.includes('<p>'))
    );

    let contentParagraphs = [];
    const contentDiv = propertyInfo.querySelector('div:not(.details)');
    if (contentDiv) {
      contentParagraphs = Array.from(contentDiv.querySelectorAll('p'));
    } else {
      contentParagraphs = Array.from(propertyInfo.children).filter(
        (child) => child.tagName === 'P'
      );
    }

    const hiddenParagraphs = contentParagraphs.slice(1);

    if (hiddenParagraphs.length === 0) {
      readMoreBtn.style.display = 'none';
      return;
    }

    hiddenParagraphs.forEach((p) => {
      p.style.display = 'none';
      p.style.opacity = '0';
      p.style.transition = 'opacity 0.3s ease';
    });

    readMoreBtn.addEventListener('click', function (e) {
      e.preventDefault();

      const isHidden = hiddenParagraphs[0].style.display === 'none';

      if (isHidden) {
        hiddenParagraphs.forEach((p) => {
          p.style.display = 'block';
          setTimeout(() => {
            p.style.opacity = '1';
          }, 10);
        });
        readMoreBtn.textContent = 'Read Less';
      } else {
        hiddenParagraphs.forEach((p) => {
          p.style.opacity = '0';
          setTimeout(() => {
            p.style.display = 'none';
          }, 300);
        });
        readMoreBtn.textContent = 'Read More';
      }
    });
  }
}

function initHidePress() {
  const showLimit = 8;
  const pressPosts = document.querySelectorAll('.press-post');

  for (let i = showLimit; i < pressPosts.length; i++) {
    pressPosts[i].classList.add('press-post-hidden');
  }

  const loadMoreBtn = document.querySelector('.show-articles');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function () {
      const hiddenPosts = document.querySelectorAll('.press-post-hidden');
      for (let i = 0; i < hiddenPosts.length; i++) {
        hiddenPosts[i].classList.remove('press-post-hidden');
      }
      if (document.querySelectorAll('.press-post-hidden').length === 0) {
        loadMoreBtn.classList.add('hide');
      }
    });
  }
}

function initVideoHandling() {
  const videos = document.querySelectorAll('video');

  videos.forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;

    video.addEventListener('loadedmetadata', () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          document.addEventListener(
            'click',
            () => {
              video.play().catch(() => {});
            },
            { once: true }
          );
        });
      }
    });

    video.addEventListener('error', () => {});

    video.addEventListener('ended', () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    });
  });
}

function initHeroVideo() {
  const heroVideo = document.querySelector('.hero-vid video');

  if (heroVideo) {
    heroVideo.currentTime = 0;
    heroVideo.muted = true;
    heroVideo.playsInline = true;
    heroVideo.autoplay = true;
    heroVideo.loop = true;

    heroVideo.load();

    const attemptPlay = () => {
      const playPromise = heroVideo.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {})
          .catch(() => {
            const playOnInteraction = () => {
              heroVideo
                .play()
                .then(() => {
                  document.removeEventListener('click', playOnInteraction);
                  document.removeEventListener('touchstart', playOnInteraction);
                })
                .catch(() => {});
            };

            document.addEventListener('click', playOnInteraction, {
              once: true,
            });
            document.addEventListener('touchstart', playOnInteraction, {
              once: true,
            });
          });
      }
    };

    if (heroVideo.readyState >= 3) {
      attemptPlay();
    } else {
      heroVideo.addEventListener('canplay', attemptPlay, { once: true });
      heroVideo.addEventListener('loadeddata', attemptPlay, { once: true });
    }
  }
}

function handleViewTransitionVideos() {
  setTimeout(() => {
    initVideoHandling();
    initHeroVideo();
  }, 100);

  setTimeout(() => {
    const heroVideo = document.querySelector('.hero-vid video');
    if (heroVideo && heroVideo.paused) {
      heroVideo.currentTime = 0;
      heroVideo.play().catch(() => {});
    }
  }, 500);
}

function handlePageVisibility() {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setTimeout(() => {
        const videos = document.querySelectorAll('video');
        videos.forEach((video) => {
          if (video.paused) {
            video.play().catch(() => {});
          }
        });
      }, 200);
    }
  });
}

function applySafariFixes() {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  if (isSafari) {
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('playsinline', 'true');
      video.setAttribute('muted', 'true');
      video.setAttribute('autoplay', 'true');

      if (!video.style.width) {
        video.style.width = '100%';
        video.style.height = '100%';
      }
    });
  }
}

function initGalleryModal() {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isSafari) {
    return;
  }

  const modal = document.getElementById('galleryModal');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const closeBtn = document.querySelector('.close');

  if (!modal) {
    return;
  }

  if (!galleryItems.length) {
    return;
  }

  const existingSlides = modal.querySelectorAll('.glide__slide');

  if (window.modalGlide) {
    try {
      window.modalGlide.destroy();
    } catch (e) {}
    window.modalGlide = null;
  }

  const modalSlidesContainer = modal.querySelector('.glide__slides');
  if (modalSlidesContainer) {
    modalSlidesContainer.innerHTML = '';

    galleryItems.forEach((item, index) => {
      const slide = document.createElement('li');
      slide.className = 'glide__slide';

      if (item.tagName === 'IMG') {
        const img = document.createElement('img');
        img.className = 'modal-media';
        img.src = item.src;
        img.alt = item.alt || `Gallery image ${index + 1}`;
        img.style.maxWidth = '90vw';
        img.style.maxHeight = '90vh';
        img.style.objectFit = 'contain';
        img.style.display = 'block';
        slide.appendChild(img);
      } else if (item.tagName === 'DIV' && item.querySelector('video')) {
        const video = item.querySelector('video');
        const modalVideo = document.createElement('video');
        modalVideo.className = 'modal-media';
        modalVideo.setAttribute('playsinline', '');
        modalVideo.setAttribute('controls', '');
        modalVideo.style.maxWidth = '90vw';
        modalVideo.style.maxHeight = '90vh';
        modalVideo.style.objectFit = 'contain';
        modalVideo.style.display = 'block';

        const sources = video.querySelectorAll('source');
        sources.forEach((source) => {
          const newSource = document.createElement('source');
          newSource.src = source.src;
          newSource.type = source.type;
          modalVideo.appendChild(newSource);
        });

        slide.appendChild(modalVideo);
      } else if (item.tagName === 'DIV' && item.querySelector('img')) {
        const img = item.querySelector('img');
        const modalImg = document.createElement('img');
        modalImg.className = 'modal-media';
        modalImg.src = img.src;
        modalImg.alt = img.alt || `Gallery image ${index + 1}`;
        modalImg.style.maxWidth = '90vw';
        modalImg.style.maxHeight = '90vh';
        modalImg.style.objectFit = 'contain';
        modalImg.style.display = 'block';
        slide.appendChild(modalImg);
      }

      modalSlidesContainer.appendChild(slide);
    });
  }

  if (window.modalGlide) {
    try {
      window.modalGlide.destroy();
    } catch (e) {}
    window.modalGlide = null;
  }

  galleryItems.forEach((item, index) => {
    const newItem = item.cloneNode(true);
    const parent = item.parentNode;
    parent.replaceChild(newItem, item);

    newItem.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();

      const clickedIndex = parseInt(this.getAttribute('data-index')) || 0;

      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';

      setTimeout(() => {
        initModalSlider(clickedIndex);
      }, 50);
    });
  });

  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';

    if (window.modalGlide) {
      try {
        window.modalGlide.destroy();
      } catch (e) {}
      window.modalGlide = null;
    }
  }

  if (closeBtn) {
    closeBtn.onclick = closeModal;
  }

  modal.onclick = function (event) {
    if (event.target === modal) {
      closeModal();
    }
  };

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && modal.style.display === 'block') {
      closeModal();
    }
  });
}

function initGlideSliders() {
  if (typeof Glide === 'undefined') {
    return;
  }

  if (window.galleryGlide) {
    try {
      window.galleryGlide.destroy();
    } catch (e) {}
    window.galleryGlide = null;
  }

  if (window.projectsGlide) {
    try {
      window.projectsGlide.destroy();
    } catch (e) {}
    window.projectsGlide = null;
  }

  const gallerySlider = document.querySelector('.glide-gallery');
  if (gallerySlider) {
    try {
      window.galleryGlide = new Glide('.glide-gallery', {
        type: 'carousel',
        startAt: 0,
        perView: 1,
        gap: 0,
        autoplay: false,
        hoverpause: true,
        keyboard: true,
        swipeThreshold: 80,
        dragThreshold: 120,
      }).mount();
    } catch (error) {}
  }

  const projectsSlider = document.querySelector('.glide-posts');
  if (projectsSlider) {
    try {
      window.projectsGlide = new Glide('.glide-posts', {
        type: 'carousel',
        startAt: 0,
        perView: 4,
        gap: 0,
        autoplay: false,
        hoverpause: true,
        keyboard: true,
        swipeThreshold: 80,
        dragThreshold: 120,
        bound: true,
        rewind: false,
        breakpoints: {
          1200: {
            perView: 3,
            gap: 0,
          },
          768: {
            perView: 2,
            gap: 0,
          },
          480: {
            perView: 1,
            gap: 0,
          },
        },
      }).mount();

      setTimeout(() => {
        ensureSlideConsistency();
      }, 100);
    } catch (error) {}
  }
}

function ensureSlideConsistency() {
  const projectsSlider = document.querySelector('.glide-posts');
  if (!projectsSlider) return;

  const slides = projectsSlider.querySelectorAll('.glide__slide');
  if (slides.length === 0) return;

  slides.forEach((slide) => {
    const slider = slide.querySelector('.building-slider');
    if (slider) {
      slider.style.height = '400px';
      slider.style.backgroundSize = 'cover';
      slider.style.backgroundPosition = 'center';
      slider.style.backgroundRepeat = 'no-repeat';
    }

    slide.style.marginLeft = '10px';
    slide.style.marginRight = '10px';
    slide.style.boxSizing = 'border-box';
    slide.style.flexShrink = '0';

    const viewportWidth = window.innerWidth;
    let slideWidth;

    if (viewportWidth <= 480) {
      slideWidth = 'calc(100% - 20px)';
    } else if (viewportWidth <= 768) {
      slideWidth = 'calc(50% - 20px)';
    } else if (viewportWidth <= 1200) {
      slideWidth = 'calc(33.333% - 20px)';
    } else {
      slideWidth = 'calc(25% - 20px)';
    }

    slide.style.width = slideWidth;
  });

  if (window.projectsGlide) {
    try {
      window.projectsGlide.update();
    } catch (e) {}
  }
}

function initModalSlider(startIndex = 0) {
  if (typeof Glide === 'undefined') {
    return;
  }

  const modalSlider = document.querySelector('.glide-modal');
  if (!modalSlider) {
    return;
  }

  const slides = modalSlider.querySelectorAll('.glide__slide');

  if (slides.length === 0) {
    return;
  }

  const validIndex = Math.max(0, Math.min(startIndex, slides.length - 1));

  if (window.modalGlide) {
    try {
      window.modalGlide.destroy();
    } catch (e) {}
    window.modalGlide = null;
  }

  try {
    window.modalGlide = new Glide('.glide-modal', {
      type: 'carousel',
      startAt: validIndex,
      perView: 1,
      gap: 0,
      autoplay: false,
      keyboard: true,
      rewind: true,
      animationDuration: 300,
    }).mount();
  } catch (error) {}
}

function handleImagesSidebarLayout() {
  const imagesSidebars = document.querySelectorAll('.images-sidebar');

  imagesSidebars.forEach((sidebar) => {
    const directImages = sidebar.querySelectorAll(':scope > img');

    if (directImages.length < 3) {
      sidebar.style.gridTemplateColumns = 'none';
    } else {
      sidebar.style.gridTemplateColumns = '';
    }
  });
}

class CountUp {
  constructor(el) {
    this.el = el;
    this.setVars();
    this.init();
  }

  setVars() {
    this.number = this.el.querySelectorAll('[data-countup-number]');
    this.observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1,
    };
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target.getAttribute('data-countup-animated') === 'true') {
          return;
        }

        const end = parseFloat(
          entry.target.getAttribute('data-countup-number').replace(/,/g, '')
        );
        const decimals = this.countDecimals(end);

        if (entry.isIntersecting) {
          entry.target.setAttribute('data-countup-animated', 'true');
          this.iterateValue(entry.target, end, decimals);
        }
      });
    }, this.observerOptions);
  }

  init() {
    if (this.number.length > 0) {
      this.number.forEach((el) => {
        this.observer.observe(el);
      });
    }
  }

  iterateValue(el, end, decimals) {
    const start = 0;
    const duration = 4500;
    let startTimestamp = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsedPercent = (timestamp - startTimestamp) / duration;
      const easedProgress = Math.min(this.easeOutQuint(elapsedPercent), 1);
      let interimNumber = Math.abs(easedProgress * (end - start) + start);

      el.textContent = this.formatNumber(interimNumber, decimals);

      if (easedProgress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  easeOutQuad(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  easeOutQuint(x) {
    return 1 - Math.pow(1 - x, 5);
  }

  countDecimals(val) {
    if (Math.floor(val) === val) return 0;
    return val.toString().split('.')[1].length || 0;
  }

  formatNumber(val, decimals) {
    return val.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

let countUpInstances = [];

function initCountUp() {
  countUpInstances.forEach((instance) => {
    if (instance && instance.destroy) {
      instance.destroy();
    }
  });
  countUpInstances = [];

  const allCountUpNumbers = document.querySelectorAll('[data-countup-number]');
  allCountUpNumbers.forEach((el) => {
    el.removeAttribute('data-countup-animated');
    const originalNumber = el.getAttribute('data-countup-number');
    el.textContent = originalNumber;
  });

  const dataModules = document.querySelectorAll('[data-module="countup"]');
  dataModules.forEach((element) => {
    element.removeAttribute('data-countup-initialized');
  });

  dataModules.forEach((element) => {
    const instance = new CountUp(element);
    countUpInstances.push(instance);
    element.setAttribute('data-countup-initialized', 'true');
  });
}

function initSmoothScroll() {
  const arrowAnchor = document.querySelector('.arrow .down-arrow');

  if (arrowAnchor) {
    arrowAnchor.addEventListener('click', function (event) {
      event.preventDefault();
      const targetId = arrowAnchor.getAttribute('href')?.substring(1);
      const targetElement = targetId ? document.getElementById(targetId) : null;

      if (targetElement) {
        const offsetTop =
          targetElement.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth',
        });
      }
    });
  }
}

function loadGlide() {
  return new Promise((resolve, reject) => {
    if (typeof Glide !== 'undefined') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src =
      'https://cdn.jsdelivr.net/npm/@glidejs/glide@3.6.0/dist/glide.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Glide.js'));
    document.head.appendChild(script);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://cdn.jsdelivr.net/npm/@glidejs/glide@3.6.0/dist/css/glide.core.min.css';
    document.head.appendChild(link);
  });
}

function loadGSAP() {
  return new Promise((resolve, reject) => {
    if (typeof gsap !== 'undefined') {
      resolve();
      return;
    }

    const gsapScript = document.createElement('script');
    gsapScript.src =
      'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
    gsapScript.onload = () => {
      const scrollTriggerScript = document.createElement('script');
      scrollTriggerScript.src =
        'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js';
      scrollTriggerScript.onload = () => {
        gsap.registerPlugin(ScrollTrigger);
        resolve();
      };
      scrollTriggerScript.onerror = () =>
        reject(new Error('Failed to load ScrollTrigger'));
      document.head.appendChild(scrollTriggerScript);
    };
    gsapScript.onerror = () => reject(new Error('Failed to load GSAP'));
    document.head.appendChild(gsapScript);
  });
}

function initHomepageAnimations() {
  if (typeof gsap === 'undefined') {
    return;
  }

  const isHomePage =
    window.location.pathname === '/' ||
    window.location.pathname === '/index.html';
  if (!isHomePage) return;

  if (animationsInitialized) {
    return;
  }
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  scrollTriggersCreated.clear();

  animateHero();
  animateHeadingText();
  animateFeaturedProperties();
  animateTextboxes();

  animationsInitialized = true;
  ScrollTrigger.refresh();
}

function animateHero() {
  const heroContent = document.querySelector('.hero-content h1');
  const heroArrow = document.querySelector('.arrow');

  if (!heroContent) return;

  if (heroContent.dataset.animated === 'true') {
    return;
  }

  gsap.set(heroContent, {
    opacity: 0,
    y: 50,
    scale: 0.9,
  });

  if (heroArrow) {
    gsap.set(heroArrow, {
      opacity: 0,
      y: 30,
    });
  }

  const heroTl = gsap.timeline({
    delay: 0.5,
    onComplete: () => {
      heroContent.dataset.animated = 'true';
      if (heroArrow) heroArrow.dataset.animated = 'true';
    },
  });

  heroTl.to(heroContent, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.5,
    ease: 'sine.out',
  });

  if (heroArrow) {
    heroTl.to(heroArrow, {
      opacity: 1,
      y: 0,
      duration: 2.5,
      ease: 'power3.out',
    });
  }
}

function animateHeadingText() {
  const headingText = document.querySelector('.heading-txt h2');

  if (!headingText) return;

  const triggerKey = 'heading-text';
  if (scrollTriggersCreated.has(triggerKey)) {
    return;
  }

  gsap.set(headingText, {
    opacity: 0,
    y: 40,
  });

  gsap.to(headingText, {
    opacity: 1,
    y: 0,
    duration: 1,
    ease: 'sine.out',
    scrollTrigger: {
      trigger: '.heading-txt',
      start: 'top 80%',
      end: 'bottom 20%',
      toggleActions: 'play none none none',
      once: true,
      onToggle: (self) => {
        if (self.isActive) {
          headingText.dataset.animated = 'true';
        }
      },
    },
  });

  scrollTriggersCreated.add(triggerKey);
}

function animateFeaturedProperties() {
  const propertiesContainer = document.querySelector('.property-imgs');
  const propertyItems = document.querySelectorAll('.property-home');
  const propertyDivider = document.querySelector('.property-divider');

  if (!propertiesContainer || !propertyItems.length) return;

  const triggerKey = 'featured-properties';
  if (scrollTriggersCreated.has(triggerKey)) {
    return;
  }

  if (propertiesContainer.dataset.animated === 'true') {
    return;
  }

  propertyItems.forEach((property) => {
    const img = property.querySelector('img');
    const text = property.querySelector('p');

    if (img) {
      gsap.set(img, {
        opacity: 0,
        scale: 1.05,
        y: 25,
        force3D: true,
      });
    }

    if (text) {
      gsap.set(text, {
        opacity: 0,
        y: 15,
        force3D: true,
      });
    }
  });

  if (propertyDivider) {
    gsap.set(propertyDivider, {
      opacity: 0,
      scaleY: 0,
      force3D: true,
    });
  }

  const propertiesTl = gsap.timeline({
    scrollTrigger: {
      trigger: propertiesContainer,
      start: 'top 80%',
      toggleActions: 'play none none none',
      once: true,
      onToggle: (self) => {
        if (self.isActive) {
          propertiesContainer.dataset.animated = 'true';
        }
      },
    },
  });

  const allImgs = propertiesContainer.querySelectorAll('.property-home img');
  const allTexts = propertiesContainer.querySelectorAll('.property-home p');

  if (allImgs.length) {
    propertiesTl.to(allImgs, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.5,
      ease: 'power1.out',
      force3D: true,
    });
  }

  if (allTexts.length) {
    propertiesTl.to(
      allTexts,
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power1.out',
        force3D: true,
      },
      '-=0.2'
    );
  }

  if (propertyDivider) {
    propertiesTl.to(
      propertyDivider,
      {
        opacity: 1,
        scaleY: 1,
        duration: 0.4,
        ease: 'power1.out',
        force3D: true,
      },
      '-=0.4'
    );
  }

  scrollTriggersCreated.add(triggerKey);
}

function animateTextboxes() {
  const textboxes = document.querySelectorAll('.textbox');

  if (!textboxes.length) return;

  textboxes.forEach((textbox, index) => {
    const heading = textbox.querySelector('h3');
    const content = textbox.querySelector('.textbox-content');

    if (!heading || !content) return;

    const triggerKey = `textbox-${index}`;
    if (scrollTriggersCreated.has(triggerKey)) {
      return;
    }

    if (textbox.dataset.animated === 'true') {
      return;
    }

    gsap.set(heading, {
      opacity: 0,
      x: -30,
      y: 20,
      force3D: true,
    });

    gsap.set(content, {
      opacity: 0,
      x: 30,
      y: 20,
      force3D: true,
    });

    const textboxTl = gsap.timeline({
      scrollTrigger: {
        trigger: textbox,
        start: 'top 80%',
        toggleActions: 'play none none none',
        once: true,
        onToggle: (self) => {
          if (self.isActive) {
            textbox.dataset.animated = 'true';
          }
        },
      },
    });

    textboxTl.to(heading, {
      opacity: 1,
      x: 0,
      y: 0,
      duration: 0.6,
      ease: 'power1.out',
      force3D: true,
    });

    textboxTl.to(
      content,
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'power1.out',
        force3D: true,
      },
      '-=0.3'
    );

    const paragraphs = content.querySelectorAll('p, h4, ul');
    if (paragraphs.length) {
      gsap.set(paragraphs, {
        opacity: 0,
        y: 15,
        force3D: true,
      });

      textboxTl.to(
        paragraphs,
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: 'power1.out',
          force3D: true,
        },
        '-=0.2'
      );
    }

    scrollTriggersCreated.add(triggerKey);
  });
}

function resetAnimationsForNewPage() {
  animationsInitialized = false;
  scrollTriggersCreated.clear();

  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }

  countUpInstances.forEach((instance) => {
    if (instance && instance.destroy) {
      instance.destroy();
    }
  });
  countUpInstances = [];

  const animatedElements = document.querySelectorAll('[data-animated="true"]');
  animatedElements.forEach((el) => {
    el.removeAttribute('data-animated');
  });

  const countupElements = document.querySelectorAll('[data-countup-animated]');
  countupElements.forEach((el) => {
    el.removeAttribute('data-countup-animated');
  });

  const countupModules = document.querySelectorAll(
    '[data-countup-initialized]'
  );
  countupModules.forEach((el) => {
    el.removeAttribute('data-countup-initialized');
  });
}

function reinitializeAnimations() {
  resetAnimationsForNewPage();

  setTimeout(() => {
    initHomepageAnimations();
  }, 100);
}

async function initializeWithAnimations() {
  try {
    await loadGSAP();
    initHomepageAnimations();
  } catch (error) {}
}

function reinitializeAfterTransition() {
  initMobileMenu();
  initShowArticles();
  initHeroScrollEffects();
  initReadMore();
  initHidePress();
  initSmoothScroll();

  handleViewTransitionVideos();
  applySafariFixes();
  reinitializeAnimations();

  setTimeout(() => {
    initCountUp();
  }, 150);

  setTimeout(() => {
    const modal = document.getElementById('galleryModal');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const imagesSidebar = document.querySelector('.images-sidebar');

    initGalleryModal();
    initGlideSliders();
    handleImagesSidebarLayout();

    setTimeout(() => {
      const galleryItemsAfter = document.querySelectorAll('.gallery-item');
    }, 100);
  }, 300);
}

ready(async () => {
  try {
    await loadGlide();

    initMobileMenu();
    initShowArticles();
    initHeroScrollEffects();
    initReadMore();
    initHidePress();
    initCountUp();
    initSmoothScroll();
    initGlideSliders();

    initVideoHandling();
    initHeroVideo();
    applySafariFixes();
    handlePageVisibility();

    setTimeout(() => {
      initGalleryModal();
      handleImagesSidebarLayout();
    }, 100);

    await initializeWithAnimations();

    document.addEventListener('astro:after-swap', () => {
      reinitializeAfterTransition();
    });

    document.addEventListener('astro:before-preparation', () => {
      const videos = document.querySelectorAll('video');
      videos.forEach((video) => {
        video.pause();
      });
    });

    document.addEventListener('astro:page-load', () => {});
    document.addEventListener('astro:before-swap', () => {});

    window.addEventListener('resize', () => {
      setTimeout(() => {
        ensureSlideConsistency();
      }, 100);
    });
  } catch (error) {
    initMobileMenu();
    initShowArticles();
    initHeroScrollEffects();
    initReadMore();
    initHidePress();
    initCountUp();
    initSmoothScroll();
    initVideoHandling();
    initHeroVideo();
    initGalleryModal();
    handleImagesSidebarLayout();
  }
});

window.reinitializeSliders = initGlideSliders;
window.reinitializeGallery = initGalleryModal;
window.reinitializeAnimations = reinitializeAnimations;
window.initHomepageAnimations = initHomepageAnimations;
window.initVideoHandling = initVideoHandling;
window.initHeroVideo = initHeroVideo;
window.resetAnimationsForNewPage = resetAnimationsForNewPage;
window.handleImagesSidebarLayout = handleImagesSidebarLayout;
