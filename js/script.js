(function () {
  'use strict';

  var contactModalLastFocus = null;

  function closeContactModal() {
    var dlg = document.getElementById('contact-form-dialog');
    if (!dlg || !dlg.classList.contains('contact-modal--open')) return;
    dlg.classList.remove('contact-modal--open');
    dlg.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (contactModalLastFocus && typeof contactModalLastFocus.focus === 'function') {
      contactModalLastFocus.focus();
    }
    contactModalLastFocus = null;
  }

  function initMobileNav() {
    var hamburger = document.querySelector('.hamburger');
    var nav = document.getElementById('primary-nav');
    if (!hamburger || !nav) return;

    var mq = window.matchMedia('(max-width: 768px)');

    function setOpen(open) {
      hamburger.classList.toggle('open', open);
      nav.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open && mq.matches ? 'hidden' : '';
    }

    function close() {
      setOpen(false);
    }

    hamburger.addEventListener('click', function () {
      setOpen(!nav.classList.contains('open'));
    });

    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });

    mq.addEventListener('change', function (e) {
      if (!e.matches) close();
      else document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var mortgageDialog = document.getElementById('mortgage-calculator-dialog');
        var contactShell = document.getElementById('contact-form-dialog');
        if (mortgageDialog && mortgageDialog.open) return;
        if (contactShell && contactShell.classList.contains('contact-modal--open')) {
          closeContactModal();
          return;
        }
        close();
      }
    });
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      var href = anchor.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;
      var target = document.querySelector(href);
      if (!target) return;
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (history.replaceState) history.replaceState(null, '', href);
      });
    });
  }

  function formatMoney(n) {
    if (!isFinite(n) || n < 0) n = 0;
    return (
      '$' +
      n.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  }

  function formatMoneyCents(n) {
    if (!isFinite(n) || n < 0) n = 0;
    return n.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function monthlyPI(principal, annualRatePct, years) {
    var n = Math.round(years * 12);
    if (principal <= 0 || n <= 0) return 0;
    var r = annualRatePct / 100 / 12;
    if (r === 0) return principal / n;
    return (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
  }

  function initMortgageModal() {
    var dialog = document.getElementById('mortgage-calculator-dialog');
    if (!dialog || typeof dialog.showModal !== 'function') return;

    var triggers = document.querySelectorAll('[data-mortgage-modal-open]');
    var lastFocus = null;

    function openModal() {
      lastFocus = document.activeElement;
      try {
        dialog.showModal();
      } catch (err) {
        return;
      }
      var first = document.getElementById('mc-price');
      if (first) window.setTimeout(function () { first.focus(); }, 0);
    }

    triggers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        openModal();
      });
    });

    var closeBtn = dialog.querySelector('.mortgage-modal__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dialog.close();
      });
    }

    dialog.addEventListener(
      'click',
      function (e) {
        if (e.target && e.target.closest && e.target.closest('.mortgage-modal__close')) {
          e.preventDefault();
          if (dialog.open) dialog.close();
        }
      },
      true
    );

    dialog.addEventListener('click', function (e) {
      if (e.target === dialog && dialog.open) {
        dialog.close();
      }
    });

    dialog.addEventListener('close', function () {
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
      }
    });
  }

  function initMortgageCalculator() {
    var root = document.querySelector('.mortgage-calculator');
    if (!root) return;

    var priceEl = document.getElementById('mc-price');
    var downEl = document.getElementById('mc-down-percent');
    var rateEl = document.getElementById('mc-rate');
    var termEl = document.getElementById('mc-term');
    var taxEl = document.getElementById('mc-tax-annual');
    var insEl = document.getElementById('mc-insurance-annual');
    var loanOut = document.getElementById('mc-loan-amount');
    var piOut = document.getElementById('mc-payment-pi');
    var escrowOut = document.getElementById('mc-payment-escrow');
    var totalOut = document.getElementById('mc-payment-total');
    var escrowRow = document.getElementById('mc-escrow-row');
    var totalRow = document.getElementById('mc-total-row');

    function readNum(el, fallback) {
      var v = parseFloat(String(el.value).replace(/,/g, ''));
      return isFinite(v) ? v : fallback;
    }

    function update() {
      var price = readNum(priceEl, 0);
      var downPct = readNum(downEl, 0);
      var rate = readNum(rateEl, 0);
      var years = readNum(termEl, 30);

      var downPay = price * (downPct / 100);
      var principal = Math.max(0, price - downPay);
      var pi = monthlyPI(principal, rate, years);

      var taxAnnual = taxEl && taxEl.value !== '' ? readNum(taxEl, 0) : 0;
      var insAnnual = insEl && insEl.value !== '' ? readNum(insEl, 0) : 0;
      var escrowMonthly = (taxAnnual + insAnnual) / 12;
      var hasEscrow = taxAnnual > 0 || insAnnual > 0;

      loanOut.textContent = formatMoney(principal);
      piOut.textContent = formatMoneyCents(pi);

      if (hasEscrow) {
        escrowRow.hidden = false;
        totalRow.hidden = false;
        escrowOut.textContent = formatMoneyCents(escrowMonthly);
        totalOut.textContent = formatMoneyCents(pi + escrowMonthly);
      } else {
        escrowRow.hidden = true;
        totalRow.hidden = true;
      }
    }

    root.addEventListener('input', update);
    root.addEventListener('change', update);
    update();
  }

  /** Same ID as in the Formspree dashboard / form URL path */
  var FORMSPREE_FORM_ID = 'xqegdjvw';

  function contactPageHref() {
    var path = window.location.pathname || '';
    return /[/\\]blog[/\\][^/\\]+\.html$/i.test(path) ? '../contact.html' : 'contact.html';
  }

  /**
   * Vanilla JS (Ajax) per Formspree: @formspree/ajax from CDN + initForm.
   * Loads after https://unpkg.com/@formspree/ajax@1 (see HTML). If the script
   * is blocked, forms still POST via their action URL (Basic HTML fallback).
   */
  function initFormspreeAjax() {
    if (typeof window.formspree !== 'function') return;

    function clearFsNode(el) {
      if (!el) return;
      el.removeAttribute('data-fs-active');
      if (el.hasAttribute('data-fs-server-content')) {
        el.textContent = '';
        el.removeAttribute('data-fs-server-content');
      }
    }

    function renderSuccessContactPage(ctx, msg) {
      var form = ctx.form;
      var successEl = form.querySelector('[data-fs-success]');
      var formErrEl = form.querySelector('[data-fs-error=""]');
      if (msg === null) {
        clearFsNode(successEl);
        return;
      }
      clearFsNode(formErrEl);
      if (successEl) {
        successEl.textContent =
          msg === 'Thank you!'
            ? 'Thank you—your message was sent. Michael will follow up soon.'
            : msg;
        successEl.setAttribute('data-fs-active', '');
      }
    }

    function renderFormErrorContactPage(ctx, msg) {
      var form = ctx.form;
      var successEl = form.querySelector('[data-fs-success]');
      var formErrEl = form.querySelector('[data-fs-error=""]');
      if (msg === null) {
        clearFsNode(formErrEl);
        return;
      }
      clearFsNode(successEl);
      if (formErrEl) {
        formErrEl.textContent =
          msg || 'Could not send. Please try again or call (515) 707-4982.';
        formErrEl.setAttribute('data-fs-active', '');
      }
    }

    function renderSuccessModal(ctx, msg) {
      var form = ctx.form;
      var successEl = form.querySelector('[data-fs-success]');
      var formErrEl = form.querySelector('[data-fs-error=""]');
      if (msg === null) {
        clearFsNode(successEl);
        return;
      }
      clearFsNode(formErrEl);
      if (successEl) {
        clearFsNode(successEl);
      }
    }

    function renderFormErrorModal(ctx, msg) {
      var form = ctx.form;
      var successEl = form.querySelector('[data-fs-success]');
      var formErrEl = form.querySelector('[data-fs-error=""]');
      if (msg === null) {
        clearFsNode(formErrEl);
        return;
      }
      clearFsNode(successEl);
      if (formErrEl) {
        formErrEl.textContent =
          msg || 'Send failed. Try again or call (515) 707-4982.';
        formErrEl.setAttribute('data-fs-active', '');
      }
    }

    function renderSuccessNewsletter(ctx, msg) {
      var form = ctx.form;
      var successEl = form.querySelector('[data-fs-success]');
      var formErrEl = form.querySelector('[data-fs-error=""]');
      if (msg === null) {
        clearFsNode(successEl);
        return;
      }
      clearFsNode(formErrEl);
      if (successEl) {
        successEl.textContent = msg === 'Thank you!' ? 'Thanks—you are on the list.' : msg;
        successEl.setAttribute('data-fs-active', '');
      }
    }

    function renderFormErrorNewsletter(ctx, msg) {
      var form = ctx.form;
      var successEl = form.querySelector('[data-fs-success]');
      var formErrEl = form.querySelector('[data-fs-error=""]');
      if (msg === null) {
        clearFsNode(formErrEl);
        return;
      }
      clearFsNode(successEl);
      if (formErrEl) {
        formErrEl.textContent =
          msg || 'Could not subscribe. Try again or call (515) 707-4982.';
        formErrEl.setAttribute('data-fs-active', '');
      }
    }

    var contactForm = document.getElementById('contact-page-form');
    if (contactForm && !contactForm.dataset.fsAjaxBound) {
      contactForm.dataset.fsAjaxBound = '1';
      window.formspree('initForm', {
        formElement: contactForm,
        formId: FORMSPREE_FORM_ID,
        useDefaultStyles: false,
        data: {
          _subject: 'Website inquiry — contact page',
          _replyto: function () {
            var el = contactForm.querySelector('[name="email"]');
            return el ? el.value.trim() : '';
          },
        },
        renderSuccess: renderSuccessContactPage,
        renderFormError: renderFormErrorContactPage,
        onSuccess: function (ctx) {
          ctx.form.reset();
          var ok = ctx.form.querySelector('[data-fs-success]');
          if (ok) ok.focus();
        },
      });
    }

    var valuationForm = document.getElementById('sell-valuation-form');
    if (valuationForm && !valuationForm.dataset.fsAjaxBound) {
      valuationForm.dataset.fsAjaxBound = '1';
      window.formspree('initForm', {
        formElement: valuationForm,
        formId: FORMSPREE_FORM_ID,
        useDefaultStyles: false,
        data: {
          _subject: 'Home valuation request — website (sell page)',
          _replyto: function () {
            var el = valuationForm.querySelector('[name="email"]');
            return el ? el.value.trim() : '';
          },
        },
        renderSuccess: renderSuccessContactPage,
        renderFormError: renderFormErrorContactPage,
        onSuccess: function (ctx) {
          ctx.form.reset();
          var ok = ctx.form.querySelector('[data-fs-success]');
          if (ok) ok.focus();
        },
      });
    }

    var modalForm = document.getElementById('contact-modal-form');
    if (modalForm && !modalForm.dataset.fsAjaxBound) {
      modalForm.dataset.fsAjaxBound = '1';
      window.formspree('initForm', {
        formElement: modalForm,
        formId: FORMSPREE_FORM_ID,
        useDefaultStyles: false,
        data: {
          _subject: 'Website inquiry — popup',
          _replyto: function () {
            var el = modalForm.querySelector('[name="email"]');
            return el ? el.value.trim() : '';
          },
        },
        renderSuccess: renderSuccessModal,
        renderFormError: renderFormErrorModal,
        onSuccess: function (ctx) {
          window.setTimeout(function () {
            closeContactModal();
            ctx.form.reset();
          }, 200);
        },
      });
    }

    document.querySelectorAll('.footer-newsletter-form').forEach(function (form) {
      if (form.dataset.fsAjaxBound) return;
      form.dataset.fsAjaxBound = '1';
      window.formspree('initForm', {
        formElement: form,
        formId: FORMSPREE_FORM_ID,
        useDefaultStyles: false,
        data: {
          _subject: 'Newsletter signup — website',
          message: 'Please add this address to the newsletter list.',
          _replyto: function () {
            var el = form.querySelector('[name="email"]');
            return el ? el.value.trim() : '';
          },
        },
        renderSuccess: renderSuccessNewsletter,
        renderFormError: renderFormErrorNewsletter,
        onSuccess: function (ctx) {
          ctx.form.reset();
          var ok = ctx.form.querySelector('[data-fs-success]');
          if (ok) ok.focus();
        },
      });
    });
  }

  function initContactModal() {
    var dialog = document.getElementById('contact-form-dialog');
    if (dialog && dialog.tagName === 'DIALOG') {
      dialog.remove();
      dialog = null;
    }
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.className = 'contact-modal contact-modal--root';
      dialog.id = 'contact-form-dialog';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'contact-modal-title');
      dialog.setAttribute('aria-hidden', 'true');
      dialog.innerHTML =
        '<div class="contact-modal__backdrop" data-contact-modal-backdrop aria-hidden="true"></div>' +
        '<div class="contact-modal__panel">' +
        '<div class="contact-modal__top">' +
        '<h2 id="contact-modal-title" class="contact-modal__title">Send Michael a message</h2>' +
        '<button type="button" class="contact-modal__close" aria-label="Close form">&times;</button>' +
        '</div>' +
        '<p class="contact-modal__lead">Michael will follow up using the details below. For office address and social links, see the <a class="contact-modal__full-link" href="contact.html">full contact page</a>.</p>' +
        '<form id="contact-modal-form" class="contact-modal-form" action="https://formspree.io/f/xqegdjvw" method="POST">' +
        '<p data-fs-error="" class="contact-modal__form-alert form-feedback" role="alert"></p>' +
        '<p data-fs-success class="contact-modal__form-alert form-feedback" role="status" tabindex="-1"></p>' +
        '<input type="hidden" name="company" value="—" />' +
        '<label for="cmf-name">Name <abbr title="required" class="contact-modal__req">*</abbr></label>' +
        '<input type="text" id="cmf-name" name="name" required autocomplete="name" data-fs-field />' +
        '<span class="contact-modal__field-error" data-fs-error="name" role="alert"></span>' +
        '<label for="cmf-email">Email <abbr title="required" class="contact-modal__req">*</abbr></label>' +
        '<input type="email" id="cmf-email" name="email" required autocomplete="email" data-fs-field />' +
        '<span class="contact-modal__field-error" data-fs-error="email" role="alert"></span>' +
        '<label for="cmf-phone">Phone <abbr title="required" class="contact-modal__req">*</abbr></label>' +
        '<input type="tel" id="cmf-phone" name="phone" required autocomplete="tel" data-fs-field />' +
        '<span class="contact-modal__field-error" data-fs-error="phone" role="alert"></span>' +
        '<label for="cmf-message">Message <abbr title="required" class="contact-modal__req">*</abbr></label>' +
        '<textarea id="cmf-message" name="message" required rows="4" placeholder="How can Michael help you?" data-fs-field></textarea>' +
        '<span class="contact-modal__field-error" data-fs-error="message" role="alert"></span>' +
        '<button type="submit" class="btn contact-modal__submit" data-fs-submit-btn>Send message</button>' +
        '</form>' +
        '</div>';
      document.body.appendChild(dialog);
    }

    var fullLink = dialog.querySelector('.contact-modal__full-link');
    if (fullLink) {
      fullLink.setAttribute('href', contactPageHref());
    }

    var contactCloseBtn = dialog.querySelector('.contact-modal__close');
    if (contactCloseBtn) {
      contactCloseBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeContactModal();
      });
    }

    dialog.addEventListener(
      'click',
      function (e) {
        if (e.target && e.target.closest && e.target.closest('.contact-modal__close')) {
          e.preventDefault();
          closeContactModal();
        }
      },
      true
    );

    var backdrop = dialog.querySelector('[data-contact-modal-backdrop]');
    if (backdrop) {
      backdrop.addEventListener('click', function () {
        closeContactModal();
      });
    }

    document.querySelectorAll('[data-contact-modal-open]').forEach(function (el) {
      if (el.dataset.contactModalBound) return;
      el.dataset.contactModalBound = '1';
      el.addEventListener('click', function (e) {
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        contactModalLastFocus = el;
        dialog.querySelectorAll('[data-fs-success], [data-fs-error]').forEach(function (node) {
          node.removeAttribute('data-fs-active');
          if (node.hasAttribute('data-fs-server-content')) {
            node.textContent = '';
            node.removeAttribute('data-fs-server-content');
          }
        });
        dialog.querySelectorAll('[data-fs-field][aria-invalid="true"]').forEach(function (inp) {
          inp.removeAttribute('aria-invalid');
        });
        dialog.classList.add('contact-modal--open');
        dialog.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        var first = document.getElementById('cmf-name');
        if (first) window.setTimeout(function () { first.focus(); }, 0);
      });
    });
  }

  function initActiveNav() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links > li > a').forEach(function (a) {
      var href = a.getAttribute('href').split('/').pop().split('#')[0];
      if (href === path) a.classList.add('nav-active');
    });
  }

  function initDropdowns() {
    document.querySelectorAll('.nav-has-dropdown').forEach(function (li) {
      var topLink = li.querySelector(':scope > a');
      if (!topLink) return;

      // Mobile: toggle on tap of parent link
      topLink.addEventListener('click', function (e) {
        if (window.innerWidth > 768) return;
        e.preventDefault();
        li.classList.toggle('dropdown-open');
      });

      // Close when a dropdown item is clicked (mobile nav close handled by existing code)
      li.querySelectorAll('.nav-dropdown a').forEach(function (a) {
        a.addEventListener('click', function () {
          li.classList.remove('dropdown-open');
        });
      });
    });

    // Close dropdowns on outside click (e.target may be a Text node — no .closest)
    document.addEventListener('click', function (e) {
      var t = e.target;
      var el = t && t.nodeType === 1 ? t : t && t.parentElement;
      if (!el || typeof el.closest !== 'function') return;
      if (!el.closest('.nav-has-dropdown')) {
        document.querySelectorAll('.nav-has-dropdown.dropdown-open').forEach(function (li) {
          li.classList.remove('dropdown-open');
        });
      }
    });
  }

  function clearPlaceholders(root) {
    root.querySelectorAll('*').forEach(function (el) {
      if (el.children.length === 0 && el.textContent.trim() === '{Description}') {
        el.textContent = '';
      }
    });
  }

  /** Des Moines area cards — in-section detail + back (About page) */
  var DM_AREA_DETAIL = {
    'altoona': {
      title: 'Altoona',
      body:
        '<p>Altoona pairs a small-city feel with big metro convenience—known for family-friendly neighborhoods, recreation, and strong east-side access toward Des Moines.</p>' +
        '<ul class="dm-areas-detail__list">' +
        '<li>Mix of established streets and newer development</li>' +
        '<li>Retail and entertainment draws for the whole region</li>' +
        '<li>Straightforward commute options toward downtown DSM</li>' +
        '</ul>'
    },
    'ankeny': {
      title: 'Ankeny',
      body:
        '<p>Ankeny combines rapid growth with a strong local identity—excellent for buyers who want newer homes, big-school programming, and a straight shot toward Des Moines or Ames.</p>' +
        '<ul class="dm-areas-detail__list">' +
        '<li>Wide range of new and resale homes at many price points</li>' +
        '<li>Major employers and retail along the I-35 corridor</li>' +
        '<li>Popular with commuters and relocating professionals</li>' +
        '</ul>'
    },
    'clive': {
      title: 'Clive',
      body:
        '<p>Clive is prized for mature trees, the Greenbelt trail system, and a central location between West Des Moines and Urbandale—often a fit for buyers who want balance and established curb appeal.</p>' +
        '<ul class="dm-areas-detail__list">' +
        '<li>Strong trail and park access woven through the community</li>' +
        '<li>Blend of classic homes and thoughtful infill</li>' +
        '<li>Quick hops to major job and retail corridors</li>' +
        '</ul>'
    },
    'des-moines': {
      title: 'Des Moines',
      body:
        '<p>Iowa’s capital mixes downtown energy with residential pockets that feel worlds apart—historic districts, river trails, and mature neighborhoods are often only minutes from major employers and medical centers.</p>' +
        '<ul class="dm-areas-detail__list">' +
        '<li>Choices from urban condos to spacious single-family streets</li>' +
        '<li>Strong arts, dining, and events without giving up Midwest ease</li>' +
        '<li>Quick freeway access to the rest of the metro</li>' +
        '</ul>'
    },
    'johnston': {
      title: 'Johnston',
      body:
        '<p>Johnston is a sought-after northwest suburb, especially for buyers who prioritize highly rated schools, newer subdivisions, and a quieter residential pace while staying close to the city.</p>' +
        '<ul class="dm-areas-detail__list">' +
        '<li>Well-regarded district and active family community</li>' +
        '<li>Green space, trails, and golf nearby</li>' +
        '<li>Convenient northwest positioning for many commutes</li>' +
        '</ul>'
    },
    'norwalk': {
      title: 'Norwalk',
      body:
        '<p>Norwalk offers a Warren County lifestyle with room to breathe—popular with buyers who want newer construction, a bit more space, and a manageable drive into the metro.</p>' +
        '<ul class="dm-areas-detail__list">' +
        '<li>Growing roster of subdivisions and amenities</li>' +
        '<li>Small-city services with access to larger retail nearby</li>' +
        '<li>Commute-friendly positioning for south-metro employers</li>' +
        '</ul>'
    },
    'urbandale': {
      title: 'Urbandale',
      body:
        '<p>Urbandale sits near the geographic heart of the metro—ideal if you want shorter drives in almost every direction while still enjoying established trees, parks, and stable neighborhoods.</p>' +
        '<ul class="dm-areas-detail__list">' +
        '<li>Mix of classic ranch homes and newer infill</li>' +
        '<li>Strong parks system and trail connections</li>' +
        '<li>Central location for work, school, and weekend trips</li>' +
        '</ul>'
    },
    'waukee': {
      title: 'Waukee',
      body:
        '<p>Waukee has been one of the fastest-growing communities in the metro, drawing families who want newer schools, trails, and a small-city feel with room to spread out.</p>' +
        '<ul class="dm-areas-detail__list">' +
        '<li>Abundant new construction and planned neighborhoods</li>' +
        '<li>Family-oriented parks and youth sports culture</li>' +
        '<li>Growing retail and services as the population expands</li>' +
        '</ul>'
    },
    'west-des-moines': {
      title: 'West Des Moines',
      body:
        '<p>West Des Moines is known for polished retail corridors, newer office and medical development, and neighborhoods that balance commute convenience with suburban space.</p>' +
        '<ul class="dm-areas-detail__list">' +
        '<li>Popular with buyers who want newer builds and amenity-rich pockets</li>' +
        '<li>Strong shopping, dining, and services clustered along major corridors</li>' +
        '<li>Still a straightforward drive to downtown DSM</li>' +
        '</ul>'
    },
    'windsor-heights': {
      title: 'Windsor Heights',
      body:
        '<p>Windsor Heights is a compact, tree-heavy community tucked against Des Moines—ideal for buyers who want short commutes, walkable pockets, and a tight-knit neighborhood feel.</p>' +
        '<ul class="dm-areas-detail__list">' +
        '<li>Minutes from downtown and major medical employers</li>' +
        '<li>Mature lots and mid-century charm alongside updates</li>' +
        '<li>Easy access to regional trails and parks</li>' +
        '</ul>'
    },
    'grimes': {
      title: 'Grimes',
      body:
        '<p>Grimes has grown quickly along the northwest corridor, attracting buyers who want newer homes, strong schools, and a little more elbow room while staying inside realistic commuting distance.</p>' +
        '<ul class="dm-areas-detail__list">' +
        '<li>Plenty of new construction and master-planned pockets</li>' +
        '<li>Family-oriented amenities and youth activities</li>' +
        '<li>Northwest positioning toward Waukee and the western job belt</li>' +
        '</ul>'
    },
    'indianola': {
      title: 'Indianola',
      body:
        '<p>Indianola is the Warren County seat—home to Simpson College, a classic town square, and a more relaxed pace while still reachable for south-metro work and weekend trips back into DSM.</p>' +
        '<ul class="dm-areas-detail__list">' +
        '<li>Blend of historic homes, ranches, and newer subdivisions</li>' +
        '<li>Local shops, festivals, and community traditions</li>' +
        '<li>Popular with buyers who want value and small-city charm</li>' +
        '</ul>'
    },
    'pleasant-hill': {
      title: 'Pleasant Hill',
      body:
        '<p>Pleasant Hill sits southeast of Des Moines with a mix of established neighborhoods and newer growth—often chosen for schools, parks, and a straight shot toward downtown or the interstate.</p>' +
        '<ul class="dm-areas-detail__list">' +
        '<li>Convenient for many east- and south-metro employers</li>' +
        '<li>Retail and services clustered along major corridors</li>' +
        '<li>Balance of resale inventory and new builds</li>' +
        '</ul>'
    },
    'bondurant': {
      title: 'Bondurant',
      body:
        '<p>Bondurant blends small-town roots with metro growth—buyers get newer subdivisions and local schools while keeping northeast Des Moines and Ankeny within an easy drive.</p>' +
        '<ul class="dm-areas-detail__list">' +
        '<li>Community events and youth sports are part of daily life</li>' +
        '<li>Growing housing variety from starter homes to larger plans</li>' +
        '<li>Popular with commuters heading toward the northeast job belt</li>' +
        '</ul>'
    },
    'adel': {
      title: 'Adel',
      body:
        '<p>Adel is the Dallas County hub west of the metro—known for its courthouse square, local dining, and a steady stream of buyers who want a quieter pace with Waukee and West Des Moines still close.</p>' +
        '<ul class="dm-areas-detail__list">' +
        '<li>Mix of historic downtown living and suburban subdivisions</li>' +
        '<li>County services and schools anchor the community</li>' +
        '<li>Reasonable drive to the western retail and employment corridor</li>' +
        '</ul>'
    },
    'newton': {
      title: 'Newton',
      body:
        '<p>Newton (Jasper County) sits slightly beyond the day-to-day “inner” ring—appealing when you want affordability, space, and a distinct downtown while still connecting to Greater DSM for work or weekends.</p>' +
        '<ul class="dm-areas-detail__list">' +
        '<li>Historic architecture and a walkable core</li>' +
        '<li>Arts and trail assets that punch above the city’s size</li>' +
        '<li>Commute planning matters—Michael can help you weigh drive times</li>' +
        '</ul>'
    }
  };

  function initDmAreaDetails() {
    var section = document.querySelector('#des-moines-areas.dm-areas-section');
    if (!section) return;

    var wrap = section.querySelector('.dm-areas-grid-wrap');
    var grids = section.querySelectorAll('.dm-areas-grid');
    var detail = section.querySelector('.dm-areas-detail');
    var backBtn = section.querySelector('.dm-areas-detail__back');
    var titleEl = section.querySelector('.dm-areas-detail__title');
    var bodyEl = section.querySelector('.dm-areas-detail__body');
    if (!wrap || !grids.length || !detail || !backBtn || !titleEl || !bodyEl) return;

    var cards = section.querySelectorAll('.dm-area-card[data-area]');
    if (!cards.length) return;

    var lastCard = null;

    function isContactModalOpen() {
      var dlg = document.getElementById('contact-form-dialog');
      return !!(dlg && dlg.classList.contains('contact-modal--open'));
    }

    function setExpanded(key) {
      cards.forEach(function (btn) {
        var on = btn.getAttribute('data-area') === key;
        btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      });
    }

    function stripCommunityQuery() {
      if (!history.replaceState) return;
      try {
        var u = new URL(window.location.href);
        if (!u.searchParams.has('community')) return;
        u.searchParams.delete('community');
        var qs = u.searchParams.toString();
        history.replaceState(null, '', u.pathname + (qs ? '?' + qs : '') + (u.hash || ''));
      } catch (err) {
        /* ignore */
      }
    }

    function closeDetail() {
      wrap.classList.remove('dm-areas-grid-wrap--detail-open');
      detail.setAttribute('hidden', '');
      detail.setAttribute('aria-hidden', 'true');
      grids.forEach(function (g) {
        g.removeAttribute('aria-hidden');
      });
      titleEl.textContent = '';
      bodyEl.innerHTML = '';
      cards.forEach(function (btn) {
        btn.setAttribute('aria-expanded', 'false');
      });
      stripCommunityQuery();
      if (lastCard && typeof lastCard.focus === 'function') {
        lastCard.focus();
      }
      lastCard = null;
    }

    function openDetail(key, triggerBtn) {
      var data = DM_AREA_DETAIL[key];
      if (!data) return;
      lastCard = triggerBtn;
      titleEl.textContent = data.title;
      bodyEl.innerHTML = data.body;
      wrap.classList.add('dm-areas-grid-wrap--detail-open');
      detail.removeAttribute('hidden');
      detail.setAttribute('aria-hidden', 'false');
      grids.forEach(function (g) {
        g.setAttribute('aria-hidden', 'true');
      });
      setExpanded(key);
      backBtn.focus();
    }

    cards.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-area');
        if (!key) return;
        openDetail(key, btn);
      });
    });

    backBtn.addEventListener('click', function () {
      closeDetail();
    });

    document.addEventListener(
      'keydown',
      function (e) {
        if (e.key !== 'Escape') return;
        if (!wrap.classList.contains('dm-areas-grid-wrap--detail-open')) return;
        if (isContactModalOpen()) return;
        closeDetail();
        e.preventDefault();
        e.stopPropagation();
      },
      true
    );

    function openDetailFromQuery() {
      var params;
      try {
        params = new URLSearchParams(window.location.search);
      } catch (err) {
        return;
      }
      var key = params.get('community');
      if (!key || !DM_AREA_DETAIL[key]) return;
      var trigger = section.querySelector('.dm-area-card[data-area="' + key + '"]');
      if (!trigger) return;
      window.setTimeout(function () {
        openDetail(key, trigger);
      }, 0);
    }

    openDetailFromQuery();
  }

  function initSellerTabs() {
    // Handle each independent tab group separately
    document.querySelectorAll('[role="tablist"]').forEach(function (tablist) {
      var tabs = tablist.querySelectorAll('.seller-tab');
      if (!tabs.length) return;
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          tabs.forEach(function (t) {
            t.classList.remove('seller-tab--active');
            t.setAttribute('aria-selected', 'false');
          });
          // Hide all panels in this group
          tabs.forEach(function (t) {
            var p = document.getElementById(t.getAttribute('aria-controls'));
            if (p) p.classList.add('seller-tab-panel--hidden');
          });
          tab.classList.add('seller-tab--active');
          tab.setAttribute('aria-selected', 'true');
          var target = document.getElementById(tab.getAttribute('aria-controls'));
          if (target) {
            target.classList.remove('seller-tab-panel--hidden');
            // Trigger credit bar animation if this panel contains bars not yet animated
            target.querySelectorAll('.credit-bar-fill:not(.bar-animated)').forEach(function (bar) {
              bar.classList.add('bar-animated');
            });
          }
        });
      });
    });
  }

  function initBuyerInteractive() {
    // Flip cards — click or Enter/Space to toggle
    document.querySelectorAll('.myth-card').forEach(function (card) {
      function toggle() {
        var flipped = card.classList.toggle('is-flipped');
        card.setAttribute('aria-pressed', flipped ? 'true' : 'false');
      }
      card.addEventListener('click', toggle);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });

    // Credit bars — animate when scrolled into view (only if not hidden in a tab)
    var barsContainer = document.querySelector('[data-animate-bars]');
    if (!barsContainer) return;
    // If inside a hidden tab panel, the tab click handler will trigger animation instead
    if (barsContainer.closest('.seller-tab-panel--hidden')) return;
    if (!('IntersectionObserver' in window)) {
      barsContainer.querySelectorAll('.credit-bar-fill').forEach(function (bar) {
        bar.classList.add('bar-animated');
      });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.credit-bar-fill').forEach(function (bar) {
            bar.classList.add('bar-animated');
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    observer.observe(barsContainer);
  }

  function initIntouchCleanup() {
    var blogSection = document.querySelector('.blog-feed-section');
    if (!blogSection) return;
    var container = blogSection.querySelector('#intouch-container');
    if (!container) return;
    clearPlaceholders(container);
    var observer = new MutationObserver(function () {
      clearPlaceholders(container);
    });
    observer.observe(container, { childList: true, subtree: true });
  }

  function remainingBalance(principal, annualRatePct, totalYears, paymentsMade) {
    var r = annualRatePct / 100 / 12;
    var pmt = monthlyPI(principal, annualRatePct, totalYears);
    if (r === 0) return Math.max(0, principal - pmt * paymentsMade);
    var bal = principal * Math.pow(1 + r, paymentsMade) - pmt * (Math.pow(1 + r, paymentsMade) - 1) / r;
    return Math.max(0, bal);
  }

  function bindInputs(ids, fn) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', fn);
    });
  }

  function bindSelects(ids, fn) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', fn);
    });
  }

  function setNeg(id, val) {
    document.getElementById(id).textContent = '\u2212' + formatMoney(val);
  }

  function setMon(id, val) {
    document.getElementById(id).textContent = formatMoney(val);
  }

  function initFinancialTools() {
    var menu = document.getElementById('fin-menu');
    if (!menu) return;

    var calcMap = {};

    // Tool card → panel
    document.querySelectorAll('.fin-tool-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var tool = card.getAttribute('data-tool');
        var panel = document.getElementById('fin-panel-' + tool);
        if (!panel) return;
        menu.hidden = true;
        panel.hidden = false;
        var section = document.getElementById('seller-resources');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (calcMap[tool]) calcMap[tool]();
      });
    });

    // Back buttons
    document.querySelectorAll('[data-fin-back]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var panel = btn.closest('.fin-tools__panel');
        if (panel) panel.hidden = true;
        menu.hidden = false;
      });
    });

    // ── 1. Unpaid Balance ──────────────────────────────────────────────────────
    function updateUnpaidBalance() {
      var amount  = parseFloat(document.getElementById('fin-ub-amount').value) || 0;
      var rate    = parseFloat(document.getElementById('fin-ub-rate').value)   || 0;
      var term    = parseFloat(document.getElementById('fin-ub-term').value)   || 30;
      var paid    = parseInt(document.getElementById('fin-ub-paid').value, 10) || 0;
      var pmt     = monthlyPI(amount, rate, term);
      var bal     = remainingBalance(amount, rate, term, paid);
      var princPaid = Math.max(0, amount - bal);
      var totalPaid = pmt * Math.min(paid, Math.round(term * 12));
      var intPaid   = Math.max(0, totalPaid - princPaid);
      document.getElementById('fin-ub-r-payment').textContent   = formatMoneyCents(pmt);
      document.getElementById('fin-ub-r-totalpaid').textContent = formatMoney(totalPaid);
      document.getElementById('fin-ub-r-principal').textContent = formatMoney(princPaid);
      document.getElementById('fin-ub-r-interest').textContent  = formatMoney(intPaid);
      document.getElementById('fin-ub-r-balance').textContent   = formatMoney(bal);
    }
    calcMap['unpaid-balance'] = updateUnpaidBalance;
    bindInputs(['fin-ub-amount','fin-ub-rate','fin-ub-term','fin-ub-paid'], updateUnpaidBalance);

    // ── 2. High-Low Estimate ───────────────────────────────────────────────────
    function updateHighLow() {
      var low      = parseFloat(document.getElementById('fin-hl-low').value)        || 0;
      var high     = parseFloat(document.getElementById('fin-hl-high').value)       || 0;
      var mortgage = parseFloat(document.getElementById('fin-hl-mortgage').value)   || 0;
      var commPct  = parseFloat(document.getElementById('fin-hl-commission').value) || 0;
      var closePct = parseFloat(document.getElementById('fin-hl-closing').value)    || 0;

      function calc(price) {
        var costs = price * (commPct + closePct) / 100 + mortgage;
        return { net: price - costs, costs: costs };
      }
      var lo = calc(low), hi = calc(high);

      document.getElementById('fin-hl-r-low-price').textContent  = formatMoney(low);
      document.getElementById('fin-hl-r-low-costs').textContent  = '\u2212' + formatMoney(lo.costs);
      var loNetEl = document.getElementById('fin-hl-r-low-net');
      loNetEl.textContent = lo.net >= 0 ? formatMoney(lo.net) : '\u2212' + formatMoney(Math.abs(lo.net));
      loNetEl.style.color = lo.net < 0 ? '#b94040' : '';

      document.getElementById('fin-hl-r-high-price').textContent = formatMoney(high);
      document.getElementById('fin-hl-r-high-costs').textContent = '\u2212' + formatMoney(hi.costs);
      var hiNetEl = document.getElementById('fin-hl-r-high-net');
      hiNetEl.textContent = hi.net >= 0 ? formatMoney(hi.net) : '\u2212' + formatMoney(Math.abs(hi.net));
      hiNetEl.style.color = hi.net < 0 ? '#b94040' : '';

      document.getElementById('fin-hl-r-diff').textContent = formatMoney(Math.abs(hi.net - lo.net));
    }
    calcMap['high-low'] = updateHighLow;
    bindInputs(['fin-hl-low','fin-hl-high','fin-hl-mortgage','fin-hl-commission','fin-hl-closing'], updateHighLow);

    // ── 3. Hold or Sell & Buy ──────────────────────────────────────────────────
    function updateHoldOrSell() {
      var value      = parseFloat(document.getElementById('fin-hs-value').value)      || 0;
      var balance    = parseFloat(document.getElementById('fin-hs-balance').value)    || 0;
      var appreciate = parseFloat(document.getElementById('fin-hs-appreciate').value) || 0;
      var years      = parseFloat(document.getElementById('fin-hs-years').value)      || 0;
      var commPct    = parseFloat(document.getElementById('fin-hs-commission').value)  || 0;

      var futureValue  = value * Math.pow(1 + appreciate / 100, years);
      var holdEquity   = Math.max(0, futureValue - balance);
      var sellNet      = Math.max(0, value - value * commPct / 100 - balance);

      setMon('fin-hs-r-future-value', futureValue);
      setMon('fin-hs-r-hold-equity',  holdEquity);
      setMon('fin-hs-r-net',          sellNet);
      setMon('fin-hs-r-sell-equity',  sellNet);
    }
    calcMap['hold-or-sell'] = updateHoldOrSell;
    bindInputs(['fin-hs-value','fin-hs-balance','fin-hs-appreciate','fin-hs-years','fin-hs-commission'], updateHoldOrSell);

    // ── 4. Refinance Analysis ──────────────────────────────────────────────────
    function updateRefinance() {
      var bal         = parseFloat(document.getElementById('fin-rf-balance').value)       || 0;
      var curRate     = parseFloat(document.getElementById('fin-rf-current-rate').value)  || 0;
      var curTerm     = parseFloat(document.getElementById('fin-rf-current-term').value)  || 30;
      var newRate     = parseFloat(document.getElementById('fin-rf-new-rate').value)      || 0;
      var newTerm     = parseFloat(document.getElementById('fin-rf-new-term').value)      || 30;
      var costs       = parseFloat(document.getElementById('fin-rf-costs').value)         || 0;

      var curPmt  = monthlyPI(bal, curRate, curTerm);
      var newPmt  = monthlyPI(bal, newRate, newTerm);
      var savings = curPmt - newPmt;
      var breakEven = savings > 0 ? Math.ceil(costs / savings) : null;

      var curTotalInt = curPmt * curTerm * 12 - bal;
      var newTotalInt = newPmt * newTerm * 12 - bal;

      document.getElementById('fin-rf-r-current').textContent    = formatMoneyCents(curPmt);
      document.getElementById('fin-rf-r-new').textContent        = formatMoneyCents(newPmt);
      var savEl = document.getElementById('fin-rf-r-savings');
      savEl.textContent = savings >= 0 ? formatMoneyCents(savings) : '\u2212' + formatMoneyCents(Math.abs(savings));
      savEl.style.color = savings < 0 ? '#b94040' : '';
      document.getElementById('fin-rf-r-breakeven').textContent  = breakEven !== null ? breakEven + ' months' : 'N/A';
      document.getElementById('fin-rf-r-int-current').textContent = formatMoney(Math.max(0, curTotalInt));
      document.getElementById('fin-rf-r-int-new').textContent     = formatMoney(Math.max(0, newTotalInt));
    }
    calcMap['refinance'] = updateRefinance;
    bindInputs(['fin-rf-balance','fin-rf-current-rate','fin-rf-current-term','fin-rf-new-rate','fin-rf-new-term','fin-rf-costs'], updateRefinance);

    // ── 5. 2/1 Buydown ────────────────────────────────────────────────────────
    function updateBuydown() {
      var amount = parseFloat(document.getElementById('fin-bd-amount').value) || 0;
      var rate   = parseFloat(document.getElementById('fin-bd-rate').value)   || 0;
      var term   = parseFloat(document.getElementById('fin-bd-term').value)   || 30;
      var rate1  = Math.max(0, rate - 2);
      var rate2  = Math.max(0, rate - 1);
      var pay1   = monthlyPI(amount, rate1, term);
      var pay2   = monthlyPI(amount, rate2, term);
      var pay3   = monthlyPI(amount, rate,  term);
      var savings = (pay3 - pay1) * 12 + (pay3 - pay2) * 12;

      document.getElementById('fin-bd-r-rate1').textContent   = rate1.toFixed(2) + '%';
      document.getElementById('fin-bd-r-pay1').textContent    = formatMoneyCents(pay1);
      document.getElementById('fin-bd-r-rate2').textContent   = rate2.toFixed(2) + '%';
      document.getElementById('fin-bd-r-pay2').textContent    = formatMoneyCents(pay2);
      document.getElementById('fin-bd-r-rate3').textContent   = rate.toFixed(2) + '%';
      document.getElementById('fin-bd-r-pay3').textContent    = formatMoneyCents(pay3);
      document.getElementById('fin-bd-r-savings').textContent = formatMoney(Math.max(0, savings));
    }
    calcMap['buydown'] = updateBuydown;
    bindInputs(['fin-bd-amount','fin-bd-rate','fin-bd-term'], updateBuydown);

    // ── 6. Financing Concessions ───────────────────────────────────────────────
    function updateConcessions() {
      var price      = parseFloat(document.getElementById('fin-fc-price').value)      || 0;
      var concession = parseFloat(document.getElementById('fin-fc-concession').value) || 0;
      var mortgage   = parseFloat(document.getElementById('fin-fc-mortgage').value)   || 0;
      var commPct    = parseFloat(document.getElementById('fin-fc-commission').value)  || 0;
      var closePct   = parseFloat(document.getElementById('fin-fc-closing').value)    || 0;
      var commission = price * commPct / 100;
      var closing    = price * closePct / 100;
      var net        = price - concession - commission - closing - mortgage;

      setMon('fin-fc-r-price', price);
      setNeg('fin-fc-r-concession', concession);
      setNeg('fin-fc-r-commission', commission);
      setNeg('fin-fc-r-closing',    closing);
      setNeg('fin-fc-r-mortgage',   mortgage);
      var netEl = document.getElementById('fin-fc-r-net');
      netEl.textContent = net >= 0 ? formatMoney(net) : '\u2212' + formatMoney(Math.abs(net));
      netEl.style.color = net < 0 ? '#b94040' : '';
    }
    calcMap['concessions'] = updateConcessions;
    bindInputs(['fin-fc-price','fin-fc-concession','fin-fc-mortgage','fin-fc-commission','fin-fc-closing'], updateConcessions);

    // ── 7. 80/10/10 Comparison ────────────────────────────────────────────────
    function update801010() {
      var price  = parseFloat(document.getElementById('fin-80-price').value) || 0;
      var rate1  = parseFloat(document.getElementById('fin-80-rate1').value) || 0;
      var rate2  = parseFloat(document.getElementById('fin-80-rate2').value) || 0;
      var term   = parseFloat(document.getElementById('fin-80-term').value)  || 30;
      var pmi    = parseFloat(document.getElementById('fin-80-pmi').value)   || 0;
      var loan80  = price * 0.80;
      var loan10  = price * 0.10;
      var loan90  = price * 0.90;
      var pay1    = monthlyPI(loan80, rate1, term);
      var pay2    = monthlyPI(loan10, rate2, term);
      var pay90   = monthlyPI(loan90, rate1, term);
      var total80 = pay1 + pay2;
      var total90 = pay90 + pmi;

      document.getElementById('fin-80-r-pay1').textContent    = formatMoneyCents(pay1);
      document.getElementById('fin-80-r-pay2').textContent    = formatMoneyCents(pay2);
      document.getElementById('fin-80-r-total80').textContent = formatMoneyCents(total80);
      document.getElementById('fin-80-r-pay90').textContent   = formatMoneyCents(pay90);
      document.getElementById('fin-80-r-pmi').textContent     = formatMoneyCents(pmi);
      document.getElementById('fin-80-r-total90').textContent = formatMoneyCents(total90);
      var diff = total90 - total80;
      var diffEl = document.getElementById('fin-80-r-diff');
      diffEl.textContent = diff >= 0
        ? formatMoneyCents(diff) + ' more with PMI'
        : formatMoneyCents(Math.abs(diff)) + ' more with 80/10/10';
      diffEl.style.color = diff < 0 ? '#b94040' : '';
    }
    calcMap['comp-80-10-10'] = update801010;
    bindInputs(['fin-80-price','fin-80-rate1','fin-80-rate2','fin-80-term','fin-80-pmi'], update801010);

    // ── 8. Income Estimator ────────────────────────────────────────────────────
    function updateIncome() {
      var price  = parseFloat(document.getElementById('fin-ie-price').value)  || 0;
      var down   = parseFloat(document.getElementById('fin-ie-down').value)   || 0;
      var rate   = parseFloat(document.getElementById('fin-ie-rate').value)   || 0;
      var term   = parseFloat(document.getElementById('fin-ie-term').value)   || 30;
      var debts  = parseFloat(document.getElementById('fin-ie-debts').value)  || 0;
      var dti    = parseFloat(document.getElementById('fin-ie-dti').value)    || 43;
      var loan   = price * (1 - down / 100);
      var pi     = monthlyPI(loan, rate, term);
      var totalDebt  = pi + debts;
      var reqMonthly = dti > 0 ? totalDebt / (dti / 100) : 0;
      var reqAnnual  = reqMonthly * 12;

      setMon('fin-ie-r-loan',       loan);
      document.getElementById('fin-ie-r-pi').textContent         = formatMoneyCents(pi);
      setMon('fin-ie-r-debts',      debts);
      setMon('fin-ie-r-total-debt', totalDebt);
      setMon('fin-ie-r-monthly',    reqMonthly);
      setMon('fin-ie-r-annual',     reqAnnual);
    }
    calcMap['income'] = updateIncome;
    bindInputs(['fin-ie-price','fin-ie-down','fin-ie-rate','fin-ie-term','fin-ie-debts','fin-ie-dti'], updateIncome);

    // ── 9. Assumption Comparison ───────────────────────────────────────────────
    function updateAssumption() {
      var assumeBal   = parseFloat(document.getElementById('fin-as-balance').value)      || 0;
      var assumeRate  = parseFloat(document.getElementById('fin-as-assume-rate').value)  || 0;
      var assumeTerm  = parseFloat(document.getElementById('fin-as-assume-term').value)  || 25;
      var buyPrice    = parseFloat(document.getElementById('fin-as-price').value)        || 0;
      var newRate     = parseFloat(document.getElementById('fin-as-new-rate').value)     || 0;
      var newTerm     = parseFloat(document.getElementById('fin-as-new-term').value)     || 30;

      var assumePmt  = monthlyPI(assumeBal, assumeRate, assumeTerm);
      var gap        = Math.max(0, buyPrice - assumeBal);
      var secondPmt  = monthlyPI(gap, newRate, newTerm);
      var totalAssume = assumePmt + secondPmt;
      var newLoanPmt  = monthlyPI(buyPrice, newRate, newTerm);
      var savings     = newLoanPmt - totalAssume;

      document.getElementById('fin-as-r-assume-pay').textContent  = formatMoneyCents(assumePmt);
      document.getElementById('fin-as-r-second-pay').textContent  = formatMoneyCents(secondPmt);
      document.getElementById('fin-as-r-assume-total').textContent = formatMoneyCents(totalAssume);
      document.getElementById('fin-as-r-new-pay').textContent     = formatMoneyCents(newLoanPmt);
      var savEl = document.getElementById('fin-as-r-savings');
      savEl.textContent = savings >= 0 ? formatMoneyCents(savings) + '/mo' : '\u2212' + formatMoneyCents(Math.abs(savings)) + '/mo';
      savEl.style.color = savings < 0 ? '#b94040' : '';
    }
    calcMap['assumption'] = updateAssumption;
    bindInputs(['fin-as-balance','fin-as-assume-rate','fin-as-assume-term','fin-as-price','fin-as-new-rate','fin-as-new-term'], updateAssumption);

    // ── helpers for buy-page tools ─────────────────────────────────────────────
    function moToStr(n) {
      var yr = Math.floor(n / 12), mo = n % 12;
      return mo === 0 ? yr + ' yr' : yr + ' yr ' + mo + ' mo';
    }

    function accelMonths(principal, annualRatePct, totalYears, extraPmt) {
      var r = annualRatePct / 100 / 12;
      var pmt = monthlyPI(principal, annualRatePct, totalYears) + extraPmt;
      if (pmt <= 0 || principal <= 0) return Math.round(totalYears * 12);
      if (r === 0) return Math.ceil(principal / pmt);
      var n = -Math.log(1 - r * principal / pmt) / Math.log(1 + r);
      return isFinite(n) ? Math.ceil(n) : Math.round(totalYears * 12);
    }

    function dynTable(wrap, headers, rows, highlightIdx) {
      if (!wrap) return;
      var th = headers.map(function (h) { return '<th>' + h + '</th>'; }).join('');
      var tr = rows.map(function (r, i) {
        var cls = (i === highlightIdx) ? ' class="fin-table-highlight"' : '';
        return '<tr' + cls + '>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
      }).join('');
      wrap.innerHTML = '<table class="fin-dynamic-table"><thead><tr>' + th + '</tr></thead><tbody>' + tr + '</tbody></table>';
    }

    // ── 1. Mortgage Payment ────────────────────────────────────────────────────
    function updateMortgagePayment() {
      var price = parseFloat(document.getElementById('b-mp-price').value) || 0;
      var down  = parseFloat(document.getElementById('b-mp-down').value)  || 0;
      var rate  = parseFloat(document.getElementById('b-mp-rate').value)  || 0;
      var term  = parseFloat(document.getElementById('b-mp-term').value)  || 30;
      var tax   = parseFloat(document.getElementById('b-mp-tax').value)   || 0;
      var ins   = parseFloat(document.getElementById('b-mp-ins').value)   || 0;
      var loan  = price * (1 - down / 100);
      var pi    = monthlyPI(loan, rate, term);
      var taxMo = tax / 12, insMo = ins / 12;
      setMon('b-mp-r-loan',  loan);
      document.getElementById('b-mp-r-pi').textContent    = formatMoneyCents(pi);
      document.getElementById('b-mp-r-tax').textContent   = formatMoneyCents(taxMo);
      document.getElementById('b-mp-r-ins').textContent   = formatMoneyCents(insMo);
      document.getElementById('b-mp-r-total').textContent = formatMoneyCents(pi + taxMo + insMo);
    }
    calcMap['mortgage-payment'] = updateMortgagePayment;
    bindInputs(['b-mp-price','b-mp-down','b-mp-rate','b-mp-term','b-mp-tax','b-mp-ins'], updateMortgagePayment);

    // ── 2. Rent vs. Own ────────────────────────────────────────────────────────
    function updateRentVsOwn() {
      var price      = parseFloat(document.getElementById('b-ro-price').value)      || 0;
      var down       = parseFloat(document.getElementById('b-ro-down').value)       || 0;
      var rate       = parseFloat(document.getElementById('b-ro-rate').value)       || 0;
      var term       = parseFloat(document.getElementById('b-ro-term').value)       || 30;
      var rent       = parseFloat(document.getElementById('b-ro-rent').value)       || 0;
      var appreciate = parseFloat(document.getElementById('b-ro-appreciate').value) || 0;
      var years      = parseFloat(document.getElementById('b-ro-years').value)      || 1;
      var loan       = price * (1 - down / 100);
      var pi         = monthlyPI(loan, rate, term);
      var totalPI    = pi * 12 * years;
      var homeValue  = price * Math.pow(1 + appreciate / 100, years);
      var balance    = remainingBalance(loan, rate, term, Math.round(years * 12));
      var equity     = Math.max(0, homeValue - balance);
      var totalRent  = rent * 12 * years;
      var advantage  = equity - totalPI + totalRent;
      document.getElementById('b-ro-r-pi').textContent         = formatMoneyCents(pi);
      setMon('b-ro-r-total-pi',   totalPI);
      setMon('b-ro-r-home-value', homeValue);
      setMon('b-ro-r-equity',     equity);
      setMon('b-ro-r-total-rent', totalRent);
      var advEl = document.getElementById('b-ro-r-advantage');
      advEl.textContent = advantage >= 0 ? formatMoney(advantage) : '\u2212' + formatMoney(Math.abs(advantage));
      advEl.style.color = advantage < 0 ? '#b94040' : '';
    }
    calcMap['rent-vs-own'] = updateRentVsOwn;
    bindInputs(['b-ro-price','b-ro-down','b-ro-rate','b-ro-term','b-ro-rent','b-ro-appreciate','b-ro-years'], updateRentVsOwn);

    // ── 3. Initial Qualifier ───────────────────────────────────────────────────
    function updateQualifier() {
      var income = parseFloat(document.getElementById('b-iq-income').value) || 0;
      var debts  = parseFloat(document.getElementById('b-iq-debts').value)  || 0;
      var down   = parseFloat(document.getElementById('b-iq-down').value)   || 0;
      var rate   = parseFloat(document.getElementById('b-iq-rate').value)   || 0;
      var term   = parseFloat(document.getElementById('b-iq-term').value)   || 30;
      var maxFront   = income * 0.28;
      var maxBack    = Math.max(0, income * 0.43 - debts);
      var loanFront  = maxFront > 0 ? maxFront / (monthlyPI(1, rate, term) || 1) : 0;
      var loanBack   = maxBack  > 0 ? maxBack  / (monthlyPI(1, rate, term) || 1) : 0;
      var maxLoan    = Math.min(loanFront, loanBack);
      var maxPrice   = maxLoan + down;
      document.getElementById('b-iq-r-max-housing').textContent = formatMoneyCents(maxFront);
      setMon('b-iq-r-loan-front', loanFront);
      document.getElementById('b-iq-r-max-back').textContent    = formatMoneyCents(maxBack);
      setMon('b-iq-r-loan-back',  loanBack);
      setMon('b-iq-r-price',      maxPrice);
    }
    calcMap['qualifier'] = updateQualifier;
    bindInputs(['b-iq-income','b-iq-debts','b-iq-down','b-iq-rate','b-iq-term'], updateQualifier);

    // ── 4. Homeowner's Analysis ────────────────────────────────────────────────
    function updateHomeowner() {
      var price      = parseFloat(document.getElementById('b-ha-price').value)      || 0;
      var down       = parseFloat(document.getElementById('b-ha-down').value)       || 0;
      var rate       = parseFloat(document.getElementById('b-ha-rate').value)       || 0;
      var term       = parseFloat(document.getElementById('b-ha-term').value)       || 30;
      var taxPct     = parseFloat(document.getElementById('b-ha-tax').value)        || 0;
      var ins        = parseFloat(document.getElementById('b-ha-ins').value)        || 0;
      var maintPct   = parseFloat(document.getElementById('b-ha-maint').value)      || 0;
      var appreciate = parseFloat(document.getElementById('b-ha-appreciate').value) || 0;
      var years      = parseFloat(document.getElementById('b-ha-years').value)      || 1;
      var loan       = price * (1 - down / 100);
      var pi         = monthlyPI(loan, rate, term);
      var taxMo      = price * taxPct / 100 / 12;
      var insMo      = ins / 12;
      var maintMo    = price * maintPct / 100 / 12;
      var total      = pi + taxMo + insMo + maintMo;
      var homeValue  = price * Math.pow(1 + appreciate / 100, years);
      var balance    = remainingBalance(loan, rate, term, Math.round(years * 12));
      var equity     = Math.max(0, homeValue - balance);
      document.getElementById('b-ha-r-pi').textContent    = formatMoneyCents(pi);
      document.getElementById('b-ha-r-tax').textContent   = formatMoneyCents(taxMo);
      document.getElementById('b-ha-r-ins').textContent   = formatMoneyCents(insMo);
      document.getElementById('b-ha-r-maint').textContent = formatMoneyCents(maintMo);
      document.getElementById('b-ha-r-total').textContent = formatMoneyCents(total);
      setMon('b-ha-r-home-value', homeValue);
      setMon('b-ha-r-equity',     equity);
      document.querySelectorAll('.b-ha-yr').forEach(function (el) { el.textContent = years; });
    }
    calcMap['homeowner'] = updateHomeowner;
    bindInputs(['b-ha-price','b-ha-down','b-ha-rate','b-ha-term','b-ha-tax','b-ha-ins','b-ha-maint','b-ha-appreciate','b-ha-years'], updateHomeowner);

    // ── 5. Equity Accelerator ──────────────────────────────────────────────────
    function updateEquityAccel() {
      var amount = parseFloat(document.getElementById('b-ea-amount').value) || 0;
      var rate   = parseFloat(document.getElementById('b-ea-rate').value)   || 0;
      var term   = parseFloat(document.getElementById('b-ea-term').value)   || 30;
      var extra  = parseFloat(document.getElementById('b-ea-extra').value)  || 0;
      var pmt       = monthlyPI(amount, rate, term);
      var normMo    = Math.round(term * 12);
      var normInt   = pmt * normMo - amount;
      var fastMo    = accelMonths(amount, rate, term, extra);
      var fastInt   = (pmt + extra) * fastMo - amount;
      document.getElementById('b-ea-r-pmt').textContent          = formatMoneyCents(pmt);
      document.getElementById('b-ea-r-months-normal').textContent = moToStr(normMo);
      document.getElementById('b-ea-r-int-normal').textContent    = formatMoney(Math.max(0, normInt));
      document.getElementById('b-ea-r-months-fast').textContent   = moToStr(fastMo);
      document.getElementById('b-ea-r-int-fast').textContent      = formatMoney(Math.max(0, fastInt));
      setMon('b-ea-r-saved', Math.max(0, normInt - fastInt));
    }
    calcMap['equity-accel'] = updateEquityAccel;
    bindInputs(['b-ea-amount','b-ea-rate','b-ea-term','b-ea-extra'], updateEquityAccel);

    // ── 6. Adjustable Rate Comparison ──────────────────────────────────────────
    function updateArmCompare() {
      var amount    = parseFloat(document.getElementById('b-ac-amount').value)     || 0;
      var fixedRate = parseFloat(document.getElementById('b-ac-fixed-rate').value) || 0;
      var armRate   = parseFloat(document.getElementById('b-ac-arm-rate').value)   || 0;
      var armPeriod = parseFloat(document.getElementById('b-ac-arm-period').value) || 5;
      var adjRate   = parseFloat(document.getElementById('b-ac-adj-rate').value)   || 0;
      var term      = parseFloat(document.getElementById('b-ac-term').value)       || 30;
      var fixedPmt  = monthlyPI(amount, fixedRate, term);
      var armInit   = monthlyPI(amount, armRate, term);
      var armBal    = remainingBalance(amount, armRate, term, armPeriod * 12);
      var remTerm   = term - armPeriod;
      var armAdj    = remTerm > 0 ? monthlyPI(armBal, adjRate, remTerm) : 0;
      var fixedInt  = fixedPmt * term * 12 - amount;
      var armInt    = armInit * armPeriod * 12 + armAdj * remTerm * 12 - amount;
      document.getElementById('b-ac-r-fixed-pmt').textContent = formatMoneyCents(fixedPmt);
      document.getElementById('b-ac-r-fixed-int').textContent = formatMoney(Math.max(0, fixedInt));
      document.getElementById('b-ac-r-arm-init').textContent  = formatMoneyCents(armInit);
      document.getElementById('b-ac-r-arm-adj').textContent   = formatMoneyCents(armAdj);
      document.getElementById('b-ac-r-arm-int').textContent   = formatMoney(Math.max(0, armInt));
      document.getElementById('b-ac-r-savings').textContent   = formatMoneyCents(Math.max(0, fixedPmt - armInit));
    }
    calcMap['arm-compare'] = updateArmCompare;
    bindInputs(['b-ac-amount','b-ac-fixed-rate','b-ac-arm-rate','b-ac-arm-period','b-ac-adj-rate','b-ac-term'], updateArmCompare);

    // ── 7. 30 vs. 15 ──────────────────────────────────────────────────────────
    function update30v15() {
      var amount  = parseFloat(document.getElementById('b-15-amount').value)  || 0;
      var rate30  = parseFloat(document.getElementById('b-15-rate30').value)  || 0;
      var rate15  = parseFloat(document.getElementById('b-15-rate15').value)  || 0;
      var pay30   = monthlyPI(amount, rate30, 30);
      var pay15   = monthlyPI(amount, rate15, 15);
      var int30   = pay30 * 360 - amount;
      var int15   = pay15 * 180 - amount;
      document.getElementById('b-15-r-pay30').textContent = formatMoneyCents(pay30);
      document.getElementById('b-15-r-int30').textContent = formatMoney(Math.max(0, int30));
      document.getElementById('b-15-r-pay15').textContent = formatMoneyCents(pay15);
      document.getElementById('b-15-r-int15').textContent = formatMoney(Math.max(0, int15));
      setMon('b-15-r-saved', Math.max(0, int30 - int15));
      document.getElementById('b-15-r-diff').textContent  = formatMoneyCents(Math.max(0, pay15 - pay30));
    }
    calcMap['30v15'] = update30v15;
    bindInputs(['b-15-amount','b-15-rate30','b-15-rate15'], update30v15);

    // ── 8. Cost of Waiting ─────────────────────────────────────────────────────
    function updateCostWait() {
      var price      = parseFloat(document.getElementById('b-cw-price').value)      || 0;
      var appreciate = parseFloat(document.getElementById('b-cw-appreciate').value) || 0;
      var rateNow    = parseFloat(document.getElementById('b-cw-rate-now').value)   || 0;
      var rateFut    = parseFloat(document.getElementById('b-cw-rate-future').value)|| 0;
      var down       = parseFloat(document.getElementById('b-cw-down').value)       || 0;
      var months     = parseFloat(document.getElementById('b-cw-months').value)     || 12;
      var term       = parseFloat(document.getElementById('b-cw-term').value)       || 30;
      var loanNow    = price * (1 - down / 100);
      var payNow     = monthlyPI(loanNow, rateNow, term);
      var futurePrice = price * Math.pow(1 + appreciate / 100, months / 12);
      var loanFut    = futurePrice * (1 - down / 100);
      var payFut     = monthlyPI(loanFut, rateFut, term);
      var extraMo    = payFut - payNow;
      var extraTotal = payFut * term * 12 - loanFut - (payNow * term * 12 - loanNow);
      setMon('b-cw-r-price-now',    price);
      document.getElementById('b-cw-r-pay-now').textContent    = formatMoneyCents(payNow);
      setMon('b-cw-r-future-price', futurePrice);
      document.getElementById('b-cw-r-pay-future').textContent = formatMoneyCents(payFut);
      var exMoEl = document.getElementById('b-cw-r-extra-monthly');
      exMoEl.textContent = extraMo >= 0 ? formatMoneyCents(extraMo) : '\u2212' + formatMoneyCents(Math.abs(extraMo));
      exMoEl.style.color = extraMo > 0 ? '#b94040' : '';
      setMon('b-cw-r-extra-total', Math.max(0, extraTotal));
    }
    calcMap['cost-wait'] = updateCostWait;
    bindInputs(['b-cw-price','b-cw-appreciate','b-cw-rate-now','b-cw-rate-future','b-cw-down','b-cw-months','b-cw-term'], updateCostWait);

    // ── 9. Your Best Investment ────────────────────────────────────────────────
    function updateBestInvest() {
      var price     = parseFloat(document.getElementById('b-bi-price').value)       || 0;
      var down      = parseFloat(document.getElementById('b-bi-down').value)        || 0;
      var rate      = parseFloat(document.getElementById('b-bi-rate').value)        || 0;
      var term      = parseFloat(document.getElementById('b-bi-term').value)        || 30;
      var homeApp   = parseFloat(document.getElementById('b-bi-home-app').value)    || 0;
      var investRet = parseFloat(document.getElementById('b-bi-invest-ret').value)  || 0;
      var years     = parseFloat(document.getElementById('b-bi-years').value)       || 1;
      var loan      = price - down;
      var homeValue = price * Math.pow(1 + homeApp / 100, years);
      var balance   = loan > 0 ? remainingBalance(loan, rate, term, Math.round(years * 12)) : 0;
      var equity    = Math.max(0, homeValue - balance);
      var portfolio = down * Math.pow(1 + investRet / 100, years);
      setMon('b-bi-r-home-value',  homeValue);
      setMon('b-bi-r-mort-bal',    balance);
      setMon('b-bi-r-home-equity', equity);
      setMon('b-bi-r-invest',      portfolio);
      var winEl = document.getElementById('b-bi-r-winner');
      if (equity > portfolio) {
        winEl.textContent = 'Home by ' + formatMoney(equity - portfolio);
        winEl.style.color = '';
      } else if (portfolio > equity) {
        winEl.textContent = 'Investment by ' + formatMoney(portfolio - equity);
        winEl.style.color = '#b94040';
      } else {
        winEl.textContent = 'Tied';
        winEl.style.color = '';
      }
    }
    calcMap['best-invest'] = updateBestInvest;
    bindInputs(['b-bi-price','b-bi-down','b-bi-rate','b-bi-term','b-bi-home-app','b-bi-invest-ret','b-bi-years'], updateBestInvest);

    // ── 10. If the Rate Goes Up ────────────────────────────────────────────────
    function updateRateUp() {
      var amount = parseFloat(document.getElementById('b-ru-amount').value) || 0;
      var base   = parseFloat(document.getElementById('b-ru-rate').value)   || 0;
      var term   = parseFloat(document.getElementById('b-ru-term').value)   || 30;
      var wrap   = document.getElementById('b-ru-table-wrap');
      var rows   = [0, 0.5, 1.0, 1.5, 2.0].map(function (inc) {
        var r   = base + inc;
        var pmt = monthlyPI(amount, r, term);
        var diff = monthlyPI(amount, r, term) - monthlyPI(amount, base, term);
        return [
          r.toFixed(2) + '%',
          formatMoneyCents(pmt),
          inc === 0 ? '—' : '+' + formatMoneyCents(diff)
        ];
      });
      dynTable(wrap, ['Rate', 'Monthly Payment', 'vs. Base Rate'], rows, 0);
    }
    calcMap['rate-up'] = updateRateUp;
    bindInputs(['b-ru-amount','b-ru-rate','b-ru-term'], updateRateUp);

    // ── 11. Isn't It Worth It ──────────────────────────────────────────────────
    function updateWorthIt() {
      var price      = parseFloat(document.getElementById('b-wi-price').value)      || 0;
      var down       = parseFloat(document.getElementById('b-wi-down').value)       || 0;
      var rate       = parseFloat(document.getElementById('b-wi-rate').value)       || 0;
      var term       = parseFloat(document.getElementById('b-wi-term').value)       || 30;
      var appreciate = parseFloat(document.getElementById('b-wi-appreciate').value) || 0;
      var rent       = parseFloat(document.getElementById('b-wi-rent').value)       || 0;
      var years      = parseFloat(document.getElementById('b-wi-years').value)      || 1;
      var loan       = price * (1 - down / 100);
      var pi         = monthlyPI(loan, rate, term);
      var homeValue  = price * Math.pow(1 + appreciate / 100, years);
      var balance    = remainingBalance(loan, rate, term, Math.round(years * 12));
      var equity     = Math.max(0, homeValue - balance);
      var totalPI    = pi * 12 * years;
      var totalRent  = rent * 12 * years;
      var advantage  = equity - totalPI + totalRent;
      setMon('b-wi-r-home-value', homeValue);
      setMon('b-wi-r-balance',    balance);
      setMon('b-wi-r-equity',     equity);
      setMon('b-wi-r-total-pi',   totalPI);
      setMon('b-wi-r-rent',       totalRent);
      var advEl = document.getElementById('b-wi-r-advantage');
      advEl.textContent = advantage >= 0 ? formatMoney(advantage) : '\u2212' + formatMoney(Math.abs(advantage));
      advEl.style.color = advantage < 0 ? '#b94040' : '';
    }
    calcMap['worth-it'] = updateWorthIt;
    bindInputs(['b-wi-price','b-wi-down','b-wi-rate','b-wi-term','b-wi-appreciate','b-wi-rent','b-wi-years'], updateWorthIt);

    // ── 12. Interest Affects the Price ─────────────────────────────────────────
    function updateRatePrice() {
      var budget  = parseFloat(document.getElementById('b-rp-budget').value)    || 0;
      var down    = parseFloat(document.getElementById('b-rp-down').value)      || 0;
      var term    = parseFloat(document.getElementById('b-rp-term').value)      || 30;
      var base    = parseFloat(document.getElementById('b-rp-base-rate').value) || 0;
      var wrap    = document.getElementById('b-rp-table-wrap');
      var offsets = [-1, -0.5, 0, 0.5, 1.0];
      var rows    = offsets.map(function (off) {
        var r    = Math.max(0.01, base + off);
        var mo   = monthlyPI(1, r, term);
        var loan = mo > 0 ? budget / mo : 0;
        var price = loan + down;
        return [
          r.toFixed(2) + '%',
          formatMoney(loan),
          formatMoney(price)
        ];
      });
      dynTable(wrap, ['Rate', 'Max Loan', 'Max Home Price'], rows, 2);
    }
    calcMap['rate-price'] = updateRatePrice;
    bindInputs(['b-rp-budget','b-rp-down','b-rp-term','b-rp-base-rate'], updateRatePrice);

    // ── 13. Will Points Make a Difference ─────────────────────────────────────
    function updatePoints() {
      var amount    = parseFloat(document.getElementById('b-pt-amount').value)    || 0;
      var rate      = parseFloat(document.getElementById('b-pt-rate').value)      || 0;
      var points    = parseFloat(document.getElementById('b-pt-points').value)    || 0;
      var costPct   = parseFloat(document.getElementById('b-pt-cost').value)      || 1;
      var reduction = parseFloat(document.getElementById('b-pt-reduction').value) || 0.25;
      var term      = parseFloat(document.getElementById('b-pt-term').value)      || 30;
      var newRate   = Math.max(0, rate - points * reduction);
      var pmtBefore = monthlyPI(amount, rate, term);
      var pmtAfter  = monthlyPI(amount, newRate, term);
      var cost      = amount * points * costPct / 100;
      var savings   = pmtBefore - pmtAfter;
      var breakEven = savings > 0 ? Math.ceil(cost / savings) : null;
      document.getElementById('b-pt-r-rate-before').textContent = rate.toFixed(2) + '%';
      document.getElementById('b-pt-r-pmt-before').textContent  = formatMoneyCents(pmtBefore);
      document.getElementById('b-pt-r-rate-after').textContent  = newRate.toFixed(2) + '%';
      document.getElementById('b-pt-r-pmt-after').textContent   = formatMoneyCents(pmtAfter);
      setMon('b-pt-r-cost',    cost);
      document.getElementById('b-pt-r-savings').textContent     = formatMoneyCents(Math.max(0, savings));
      document.getElementById('b-pt-r-breakeven').textContent   = breakEven !== null ? breakEven + ' months' : 'N/A';
    }
    calcMap['points'] = updatePoints;
    bindInputs(['b-pt-amount','b-pt-rate','b-pt-points','b-pt-cost','b-pt-reduction','b-pt-term'], updatePoints);

    // ── 14. Amortization Schedule ──────────────────────────────────────────────
    function updateAmortization() {
      var principal = parseFloat(document.getElementById('b-am-amount').value) || 0;
      var rate      = parseFloat(document.getElementById('b-am-rate').value)   || 0;
      var term      = parseFloat(document.getElementById('b-am-term').value)   || 30;
      var wrap      = document.getElementById('b-am-table-wrap');
      var r         = rate / 100 / 12;
      var pmt       = monthlyPI(principal, rate, term);
      var balance   = principal;
      var rows      = [];
      for (var yr = 1; yr <= term; yr++) {
        var beg = balance, yrInt = 0, yrPrinc = 0;
        for (var m = 0; m < 12; m++) {
          if (balance <= 0) break;
          var intPart   = balance * r;
          var princPart = Math.min(pmt - intPart, balance);
          yrInt   += intPart;
          yrPrinc += princPart;
          balance  = Math.max(0, balance - princPart);
        }
        rows.push([yr, formatMoney(beg), formatMoney(yrPrinc), formatMoney(yrInt), formatMoney(balance)]);
        if (balance <= 0) break;
      }
      dynTable(wrap, ['Year', 'Beg. Balance', 'Principal Paid', 'Interest Paid', 'End Balance'], rows, -1);
    }
    calcMap['amortization'] = updateAmortization;
    bindInputs(['b-am-amount','b-am-rate','b-am-term'], updateAmortization);
  }

  function boot() {
    initContactModal();
    initFormspreeAjax();
    initMobileNav();
    initSmoothScroll();
    initMortgageModal();
    initMortgageCalculator();
    initActiveNav();
    initDropdowns();
    initSellerTabs();
    initDmAreaDetails();
    initBuyerInteractive();
    initIntouchCleanup();
    initFinancialTools();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
