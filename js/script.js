(function () {
  'use strict';

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
        var contactDialog = document.getElementById('contact-form-dialog');
        if ((mortgageDialog && mortgageDialog.open) || (contactDialog && contactDialog.open)) return;
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
      dialog.showModal();
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
            var d = document.getElementById('contact-form-dialog');
            if (d && d.open) d.close();
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
    var probe = document.createElement('dialog');
    if (typeof probe.showModal !== 'function') {
      return;
    }

    var dialog = document.getElementById('contact-form-dialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'contact-modal';
      dialog.id = 'contact-form-dialog';
      dialog.setAttribute('aria-labelledby', 'contact-modal-title');
      dialog.innerHTML =
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

    var lastFocus = null;

    var contactCloseBtn = dialog.querySelector('.contact-modal__close');
    if (contactCloseBtn) {
      contactCloseBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dialog.close();
      });
    }

    dialog.addEventListener(
      'click',
      function (e) {
        if (e.target && e.target.closest && e.target.closest('.contact-modal__close')) {
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

    document.querySelectorAll('[data-contact-modal-open]').forEach(function (el) {
      if (el.dataset.contactModalBound) return;
      el.dataset.contactModalBound = '1';
      el.addEventListener('click', function (e) {
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        lastFocus = el;
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
        dialog.showModal();
        var first = document.getElementById('cmf-name');
        if (first) window.setTimeout(function () { first.focus(); }, 0);
      });
    });
  }

  function boot() {
    initContactModal();
    initFormspreeAjax();
    initMobileNav();
    initSmoothScroll();
    initMortgageModal();
    initMortgageCalculator();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
