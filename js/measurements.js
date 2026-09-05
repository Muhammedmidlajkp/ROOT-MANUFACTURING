/**
 * ROOTS — CUSTOM MEASUREMENTS PAGE
 * Vanilla JS | Zero dependencies | Progressive, accessible, no framework
 *
 * -------------------------------------------------------------------------
 * BACKEND INTEGRATION REQUIRED
 * -------------------------------------------------------------------------
 * ROOTS currently has NO submission endpoint. The homepage contact form has
 * no `action`, no fetch and no mail transport — it only prints a thank-you
 * message client-side, which means those enquiries are never delivered.
 *
 * This page does NOT repeat that. Until `CONFIG.endpoint` is set to a real
 * URL, the page will never claim the specification reached ROOTS. It builds
 * the payload, validates it, and hands the user three delivery routes that
 * genuinely work offline (download, clipboard, prefilled email).
 *
 * To enable real submission, set CONFIG.endpoint to a POST URL that accepts
 * JSON. Server-side validation, spam protection, rate limiting and CSRF
 * remain the backend's responsibility — client-side checks are not enough.
 * -------------------------------------------------------------------------
 */

(function () {
  'use strict';

  /* =======================================================================
     CONFIG
     ======================================================================= */
  var CONFIG = {
    // Set to a real POST endpoint to enable automatic submission.
    // e.g. 'https://api.rootsbusiness.in/measurements'
    endpoint: null,
    recipient: 'rootsbusinessconnect@gmail.com',
    // Sanity bounds only — NOT a ROOTS specification. They exist to catch
    // typos (a stray zero), not to constrain real garment dimensions.
    sanityMinCm: 0.1,
    sanityMaxCm: 500
  };

  /* =======================================================================
     MEASUREMENT SPECIFICATION
     -----------------------------------------------------------------------
     Single source of truth for the form fields AND their link to the
     technical drawing. To add, rename or remove a measurement, edit this
     array only — the form, the review sheet, the payload and the drawing
     highlight all follow. `svgId` must match a group id in the inline SVG.

     status: 'confirmed' — named by the client
             'pending'   — CLIENT INPUT REQUIRED, shown but never required
     ======================================================================= */
  var MEASUREMENTS = [
    {
      id: 'chestWidth',
      group: 'body',
      label: 'Chest width',
      svgId: 'dim-chestWidth',
      status: 'confirmed',
      required: true,
      desc: 'Flat, edge to edge across the chest, 2.5 cm below the armhole.'
    },
    {
      id: 'bodyLength',
      group: 'body',
      label: 'Body length',
      svgId: 'dim-bodyLength',
      status: 'pending',
      required: false,
      desc: 'From the high point of the shoulder straight down to the hem.'
    },
    {
      id: 'hemWidth',
      group: 'body',
      label: 'Hem width',
      svgId: 'dim-hemWidth',
      status: 'pending',
      required: false,
      desc: 'Flat, edge to edge across the bottom opening.'
    },
    {
      id: 'shoulder',
      group: 'body',
      label: 'Shoulder',
      svgId: 'dim-shoulder',
      status: 'confirmed',
      required: true,
      desc: 'From the collar corner to the shoulder point, along the shoulder seam.'
    },
    {
      id: 'sleeveLength',
      group: 'sleeves',
      label: 'Sleeve length',
      svgId: 'dim-sleeveLength',
      status: 'confirmed',
      required: true,
      desc: 'From the shoulder point to the end of the cuff.'
    },
    {
      id: 'bicep',
      group: 'sleeves',
      label: 'Bicep',
      svgId: 'dim-bicep',
      status: 'pending',
      required: false,
      desc: 'Flat, straight across the sleeve just below the armhole.'
    },
    {
      id: 'cuff',
      group: 'sleeves',
      label: 'Cuff',
      svgId: 'dim-cuff',
      status: 'pending',
      required: false,
      desc: 'Flat, across the cuff opening when fastened.'
    },
    {
      id: 'neckWidth',
      group: 'collar',
      label: 'Neck width',
      svgId: 'dim-neckWidth',
      status: 'pending',
      required: false,
      desc: 'Flat, seam to seam across the neckline.'
    },
    {
      id: 'collarHeight',
      group: 'collar',
      label: 'Collar height',
      svgId: 'dim-collarHeight',
      status: 'pending',
      required: false,
      desc: 'Height of the collar band at the centre back.'
    }
  ];

  var GARMENT_FIELDS = [
    { id: 'garmentType', label: 'Garment type' },
    { id: 'styleReference', label: 'Style / reference' },
    { id: 'size', label: 'Size label' }
  ];

  var CONTACT_FIELDS = [
    { id: 'contactName', label: 'Name' },
    { id: 'company', label: 'Brand / company' },
    { id: 'email', label: 'Email' }
  ];

  var CM_PER_INCH = 2.54;

  /* =======================================================================
     DOM
     ======================================================================= */
  var form = document.getElementById('ms-form');
  if (!form) return;

  var svg = document.getElementById('ms-svg');
  var reviewSection = document.getElementById('ms-review');
  var reviewBody = document.getElementById('ms-review-body');
  var resultSection = document.getElementById('ms-result');
  var resultBody = document.getElementById('ms-result-body');
  var resultStep = document.getElementById('ms-result-step');
  var resultTitle = document.getElementById('ms-result-title');
  var formStatus = document.getElementById('ms-form-status');
  var submitStatus = document.getElementById('ms-submit-status');
  var clearBtn = document.getElementById('ms-clear');
  var editBtn = document.getElementById('ms-edit');
  var submitBtn = document.getElementById('ms-submit');

  var currentUnit = 'cm';

  /* =======================================================================
     1. BUILD THE MEASUREMENT FIELDS FROM THE SPEC
     ======================================================================= */
  function buildFields() {
    var containers = {};
    Array.prototype.forEach.call(form.querySelectorAll('.ms-measure-list'), function (el) {
      containers[el.getAttribute('data-group')] = el;
      el.innerHTML = '';
    });

    MEASUREMENTS.forEach(function (m) {
      var host = containers[m.group];
      if (!host) return;

      var row = document.createElement('div');
      row.className = 'ms-measure';
      row.setAttribute('data-measure', m.id);

      var inputId = 'ms-' + m.id;
      var descId = inputId + '-desc';
      var errId = 'err-' + m.id;

      var label = document.createElement('label');
      label.className = 'ms-measure-label';
      label.setAttribute('for', inputId);
      label.textContent = m.label;
      if (m.required) {
        var req = document.createElement('abbr');
        req.title = 'required';
        req.textContent = ' *';
        label.appendChild(req);
      } else {
        var tag = document.createElement('span');
        tag.className = 'ms-measure-tag';
        tag.textContent = 'PENDING';
        tag.title = 'CLIENT INPUT REQUIRED — measurement point not yet confirmed by ROOTS';
        label.appendChild(tag);
      }

      var wrap = document.createElement('span');
      wrap.className = 'ms-measure-input';

      var input = document.createElement('input');
      input.type = 'number';
      input.id = inputId;
      input.name = m.id;
      input.step = '0.1';
      input.min = '0';
      input.inputMode = 'decimal';
      input.autocomplete = 'off';
      input.placeholder = '0.0';
      input.setAttribute('data-measure-input', m.id);
      input.setAttribute('aria-describedby', descId);
      if (m.required) input.required = true;

      var unit = document.createElement('span');
      unit.className = 'ms-measure-unit';
      unit.setAttribute('data-unit-label', '');
      unit.textContent = currentUnit;

      wrap.appendChild(input);
      wrap.appendChild(unit);

      var desc = document.createElement('p');
      desc.className = 'ms-measure-desc';
      desc.id = descId;
      desc.textContent = m.desc;

      var err = document.createElement('p');
      err.className = 'ms-error';
      err.id = errId;
      err.setAttribute('role', 'alert');
      err.hidden = true;

      row.appendChild(label);
      row.appendChild(wrap);
      row.appendChild(desc);
      row.appendChild(err);
      host.appendChild(row);
    });
  }

  /* =======================================================================
     2. DRAWING <-> FORM INTERACTION
     ======================================================================= */
  function svgGroup(id) {
    var m = findMeasure(id);
    return m && svg ? svg.querySelector('#' + m.svgId) : null;
  }

  function fieldRow(id) {
    return form.querySelector('[data-measure="' + id + '"]');
  }

  function setActive(id, on) {
    var g = svgGroup(id);
    var row = fieldRow(id);
    if (g) g.classList.toggle('is-active', !!on);
    if (row) row.classList.toggle('is-active', !!on);
  }

  function clearAllActive() {
    MEASUREMENTS.forEach(function (m) { setActive(m.id, false); });
  }

  function bindInteraction() {
    // Form field -> drawing
    MEASUREMENTS.forEach(function (m) {
      var input = form.querySelector('[data-measure-input="' + m.id + '"]');
      if (!input) return;
      input.addEventListener('focus', function () { clearAllActive(); setActive(m.id, true); });
      input.addEventListener('blur', function () { setActive(m.id, false); });
      input.addEventListener('input', function () { clearError(m.id); });
    });

    if (!svg) return;

    // Drawing -> form
    Array.prototype.forEach.call(svg.querySelectorAll('.ms-dim'), function (g) {
      var id = g.getAttribute('data-field');
      if (!id) return;

      g.addEventListener('mouseenter', function () { setActive(id, true); });
      g.addEventListener('mouseleave', function () {
        var input = form.querySelector('[data-measure-input="' + id + '"]');
        if (document.activeElement !== input) setActive(id, false);
      });

      var focusField = function (e) {
        e.preventDefault();
        var input = form.querySelector('[data-measure-input="' + id + '"]');
        if (input) {
          input.focus({ preventScroll: false });
          input.select();
        }
      };

      g.addEventListener('click', focusField);
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') focusField(e);
      });
      g.addEventListener('focus', function () { setActive(id, true); });
      g.addEventListener('blur', function () { setActive(id, false); });
    });
  }

  /* =======================================================================
     3. UNIT SWITCHING (converts values already entered)
     ======================================================================= */
  function bindUnitToggle() {
    Array.prototype.forEach.call(form.querySelectorAll('input[name="unit"]'), function (radio) {
      radio.addEventListener('change', function () {
        if (!radio.checked) return;
        var next = radio.value;
        if (next === currentUnit) return;

        MEASUREMENTS.forEach(function (m) {
          var input = form.querySelector('[data-measure-input="' + m.id + '"]');
          if (!input || input.value === '') return;
          var v = parseFloat(input.value);
          if (isNaN(v)) return;
          var converted = next === 'in' ? v / CM_PER_INCH : v * CM_PER_INCH;
          input.value = String(Math.round(converted * 10) / 10);
        });

        currentUnit = next;
        Array.prototype.forEach.call(form.querySelectorAll('[data-unit-label]'), function (el) {
          el.textContent = currentUnit;
        });
        setStatus(formStatus, 'Unit changed to ' + (currentUnit === 'cm' ? 'centimetres' : 'inches') +
          '. Existing values were converted.', false);
      });
    });
  }

  /* =======================================================================
     4. VALIDATION
     ======================================================================= */
  function findMeasure(id) {
    for (var i = 0; i < MEASUREMENTS.length; i++) {
      if (MEASUREMENTS[i].id === id) return MEASUREMENTS[i];
    }
    return null;
  }

  function showError(id, message) {
    var err = document.getElementById('err-' + id);
    var input = document.getElementById('ms-' + id);
    var row = fieldRow(id) || (input ? input.closest('.ms-field') : null);
    if (err) { err.textContent = message; err.hidden = false; }
    if (row) row.classList.add('has-error');
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby',
        (input.getAttribute('aria-describedby') || '').replace('err-' + id, '').trim() + ' err-' + id);
    }
  }

  function clearError(id) {
    var err = document.getElementById('err-' + id);
    var input = document.getElementById('ms-' + id);
    var row = fieldRow(id) || (input ? input.closest('.ms-field') : null);
    if (err) { err.textContent = ''; err.hidden = true; }
    if (row) row.classList.remove('has-error');
    if (input) input.removeAttribute('aria-invalid');
  }

  function clearAllErrors() {
    MEASUREMENTS.forEach(function (m) { clearError(m.id); });
    ['garmentType', 'contactName', 'company', 'email'].forEach(clearError);
  }

  function validate() {
    clearAllErrors();
    var errors = [];

    // Garment type
    var garment = document.getElementById('ms-garmentType');
    if (!garment.value) {
      showError('garmentType', 'Please select the garment type.');
      errors.push(garment);
    }

    // Measurements
    MEASUREMENTS.forEach(function (m) {
      var input = form.querySelector('[data-measure-input="' + m.id + '"]');
      if (!input) return;
      var raw = input.value.trim();

      if (raw === '') {
        if (m.required) {
          showError(m.id, 'Please enter a valid ' + m.label.toLowerCase() + ' measurement.');
          errors.push(input);
        }
        return;
      }

      if (!/^\d*\.?\d+$/.test(raw)) {
        showError(m.id, m.label + ' must be a number, for example 54.0. Remove any units or letters.');
        errors.push(input);
        return;
      }

      var value = parseFloat(raw);
      if (isNaN(value) || value <= 0) {
        showError(m.id, m.label + ' must be greater than zero.');
        errors.push(input);
        return;
      }

      var cm = currentUnit === 'in' ? value * CM_PER_INCH : value;
      if (cm < CONFIG.sanityMinCm || cm > CONFIG.sanityMaxCm) {
        showError(m.id, m.label + ' looks out of range. Check the value and the selected unit (' +
          currentUnit + ').');
        errors.push(input);
      }
    });

    // Contact
    var name = document.getElementById('ms-contactName');
    if (!name.value.trim()) {
      showError('contactName', 'Please enter your name so ROOTS can reply.');
      errors.push(name);
    }
    var company = document.getElementById('ms-company');
    if (!company.value.trim()) {
      showError('company', 'Please enter your brand or company name.');
      errors.push(company);
    }
    var email = document.getElementById('ms-email');
    var emailValue = email.value.trim();
    if (!emailValue) {
      showError('email', 'Please enter an email address for the reply.');
      errors.push(email);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      showError('email', 'Please enter a valid email address, for example name@brand.com.');
      errors.push(email);
    }

    return errors;
  }

  /* =======================================================================
     5. SERIALISATION
     ======================================================================= */
  function buildPayload() {
    var measurements = {};
    MEASUREMENTS.forEach(function (m) {
      var input = form.querySelector('[data-measure-input="' + m.id + '"]');
      var raw = input ? input.value.trim() : '';
      if (raw === '') return;
      measurements[m.id] = parseFloat(raw);
    });

    return {
      reference: currentReference,
      submittedAt: new Date().toISOString(),
      garmentType: document.getElementById('ms-garmentType').value,
      styleReference: document.getElementById('ms-styleReference').value.trim(),
      size: document.getElementById('ms-size').value.trim(),
      unit: currentUnit,
      measurements: measurements,
      contact: {
        name: document.getElementById('ms-contactName').value.trim(),
        company: document.getElementById('ms-company').value.trim(),
        email: document.getElementById('ms-email').value.trim()
      },
      notes: document.getElementById('ms-notes').value.trim()
    };
  }

  var currentReference = '';

  function makeReference() {
    var d = new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var stamp = String(d.getFullYear()) + pad(d.getMonth() + 1) + pad(d.getDate());
    var rand = Math.floor(Math.random() * 46656).toString(36).toUpperCase();
    while (rand.length < 3) rand = '0' + rand;
    return 'ROOTS-MS-' + stamp + '-' + rand;
  }

  function payloadToText(p) {
    var lines = [];
    lines.push('ROOTS — GARMENT MEASUREMENT SPECIFICATION');
    lines.push('Reference: ' + p.reference);
    lines.push('Prepared: ' + p.submittedAt);
    lines.push('');
    lines.push('GARMENT');
    lines.push('  Type: ' + (p.garmentType || '—'));
    lines.push('  Style / reference: ' + (p.styleReference || '—'));
    lines.push('  Size label: ' + (p.size || '—'));
    lines.push('  Unit: ' + p.unit);
    lines.push('');
    lines.push('MEASUREMENTS (' + p.unit + ')');
    MEASUREMENTS.forEach(function (m) {
      if (Object.prototype.hasOwnProperty.call(p.measurements, m.id)) {
        lines.push('  ' + m.label + ': ' + p.measurements[m.id].toFixed(1) + ' ' + p.unit +
          (m.status === 'pending' ? '  [point pending ROOTS confirmation]' : ''));
      }
    });
    lines.push('');
    lines.push('CONTACT');
    lines.push('  Name: ' + p.contact.name);
    lines.push('  Brand / company: ' + p.contact.company);
    lines.push('  Email: ' + p.contact.email);
    if (p.notes) {
      lines.push('');
      lines.push('PRODUCTION NOTES');
      lines.push('  ' + p.notes.replace(/\n/g, '\n  '));
    }
    return lines.join('\n');
  }

  /* =======================================================================
     6. REVIEW
     ======================================================================= */
  function renderReview(p) {
    reviewBody.innerHTML = '';

    var groups = [
      {
        title: 'Garment',
        rows: [
          ['Garment type', p.garmentType || null],
          ['Style / reference', p.styleReference || null],
          ['Size label', p.size || null],
          ['Unit', p.unit === 'cm' ? 'Centimetres' : 'Inches']
        ]
      },
      { title: 'Body', rows: measureRows('body', p) },
      { title: 'Sleeves', rows: measureRows('sleeves', p) },
      { title: 'Collar', rows: measureRows('collar', p) },
      {
        title: 'Contact',
        rows: [
          ['Name', p.contact.name],
          ['Brand / company', p.contact.company],
          ['Email', p.contact.email],
          ['Production notes', p.notes || null]
        ]
      }
    ];

    groups.forEach(function (g) {
      if (!g.rows.length) return;
      var section = document.createElement('div');
      section.className = 'ms-review-group';

      var h = document.createElement('h3');
      h.textContent = g.title;
      section.appendChild(h);

      var dl = document.createElement('dl');
      g.rows.forEach(function (row) {
        var dt = document.createElement('dt');
        dt.textContent = row[0];
        var dd = document.createElement('dd');
        if (row[1] === null || row[1] === '' || typeof row[1] === 'undefined') {
          dd.textContent = 'Not provided';
          dd.className = 'is-empty';
        } else {
          dd.textContent = row[1];
        }
        dl.appendChild(dt);
        dl.appendChild(dd);
      });
      section.appendChild(dl);
      reviewBody.appendChild(section);
    });
  }

  function measureRows(group, p) {
    return MEASUREMENTS.filter(function (m) { return m.group === group; }).map(function (m) {
      var has = Object.prototype.hasOwnProperty.call(p.measurements, m.id);
      return [m.label, has ? p.measurements[m.id].toFixed(1) + ' ' + p.unit : null];
    });
  }

  /* =======================================================================
     7. SUBMISSION
     ======================================================================= */
  function setStatus(el, message, isError) {
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('is-error', !!isError);
  }

  function download(filename, content, type) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function renderDeliveryState(p) {
    resultStep.textContent = 'DELIVERY';
    resultTitle.textContent = 'SPECIFICATION READY.';
    resultBody.innerHTML = '';

    var ref = document.createElement('div');
    ref.className = 'ms-ref';
    ref.innerHTML = '<span>Specification reference</span>';
    var strong = document.createElement('strong');
    strong.textContent = p.reference;
    ref.appendChild(strong);
    resultBody.appendChild(ref);

    // Visitor-facing copy only. The instruction for wiring up a real endpoint
    // lives in the CONFIG block at the top of this file, where a developer will
    // see it — a prospective client should never be told to edit a script.
    var callout = document.createElement('div');
    callout.className = 'ms-callout';
    callout.innerHTML =
      '<h3>One more step to send it</h3>' +
      '<p>Your specification is complete, but it has <strong>not</strong> been sent to ROOTS yet. ' +
      'Choose a delivery option below and it reaches us straight away.</p>' +
      '<p>Keep your reference number — quote it in any follow-up and we can match your enquiry immediately.</p>';
    resultBody.appendChild(callout);

    var note = document.createElement('p');
    note.className = 'ms-result-note';
    note.textContent = 'Your entries remain in the form above and are not lost by choosing any option below.';
    resultBody.appendChild(note);

    var actions = document.createElement('div');
    actions.className = 'ms-delivery';

    var mailBtn = document.createElement('button');
    mailBtn.type = 'button';
    mailBtn.className = 'ms-btn ms-btn--primary';
    mailBtn.innerHTML = 'OPEN EMAIL TO ROOTS <span aria-hidden="true">→</span>';
    mailBtn.addEventListener('click', function () {
      var subject = 'Garment measurement specification ' + p.reference + ' — ' + p.contact.company;
      var body = payloadToText(p);
      window.location.href = 'mailto:' + CONFIG.recipient +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
      setStatus(submitStatus, 'An email draft was opened in your mail application. ' +
        'The specification is only delivered once you send it.', false);
    });

    var jsonBtn = document.createElement('button');
    jsonBtn.type = 'button';
    jsonBtn.className = 'ms-btn ms-btn--quiet';
    jsonBtn.textContent = 'DOWNLOAD JSON';
    jsonBtn.addEventListener('click', function () {
      download(p.reference + '.json', JSON.stringify(p, null, 2), 'application/json');
    });

    var txtBtn = document.createElement('button');
    txtBtn.type = 'button';
    txtBtn.className = 'ms-btn ms-btn--quiet';
    txtBtn.textContent = 'DOWNLOAD SPEC SHEET';
    txtBtn.addEventListener('click', function () {
      download(p.reference + '.txt', payloadToText(p), 'text/plain');
    });

    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'ms-btn ms-btn--quiet';
    copyBtn.textContent = 'COPY TO CLIPBOARD';
    copyBtn.addEventListener('click', function () {
      var text = payloadToText(p);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          setStatus(submitStatus, 'Specification copied to the clipboard.', false);
        }, function () {
          setStatus(submitStatus, 'Could not access the clipboard. Use “Download spec sheet” instead.', true);
        });
      } else {
        setStatus(submitStatus, 'Clipboard is unavailable in this browser. Use “Download spec sheet” instead.', true);
      }
    });

    actions.appendChild(mailBtn);
    actions.appendChild(jsonBtn);
    actions.appendChild(txtBtn);
    actions.appendChild(copyBtn);
    resultBody.appendChild(actions);
  }

  function renderSuccessState(p, serverRef) {
    resultStep.textContent = 'CONFIRMED';
    resultTitle.textContent = 'MEASUREMENTS RECEIVED.';
    resultBody.innerHTML = '';

    var note = document.createElement('p');
    note.className = 'ms-result-note';
    note.textContent = 'Your garment specifications have been submitted to ROOTS. Our team will use these ' +
      'measurements for your manufacturing requirements and will reply to ' + p.contact.email + '.';
    resultBody.appendChild(note);

    var ref = document.createElement('div');
    ref.className = 'ms-ref';
    ref.innerHTML = '<span>Reference</span>';
    var strong = document.createElement('strong');
    strong.textContent = serverRef || p.reference;
    ref.appendChild(strong);
    resultBody.appendChild(ref);
  }

  function submitSpecification(p) {
    if (!CONFIG.endpoint) {
      renderDeliveryState(p);
      reveal(resultSection);
      setStatus(submitStatus, '', false);
      return;
    }

    submitBtn.disabled = true;
    setStatus(submitStatus, 'Sending specification…', false);

    fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json().catch(function () { return {}; });
    }).then(function (data) {
      renderSuccessState(p, data && data.reference);
      reveal(resultSection);
      setStatus(submitStatus, '', false);
    }).catch(function (err) {
      setStatus(submitStatus, 'The specification could not be sent (' + err.message +
        '). Nothing has reached ROOTS. Please try again, or email ' + CONFIG.recipient + '.', true);
      renderDeliveryState(p);
      reveal(resultSection);
    }).finally(function () {
      submitBtn.disabled = false;
    });
  }

  /* =======================================================================
     8. FLOW
     ======================================================================= */
  function reveal(section) {
    section.hidden = false;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Honeypot — silently drop automated submissions
    var hp = document.getElementById('ms-hp');
    if (hp && hp.value.trim().length > 0) return;

    var errors = validate();
    if (errors.length) {
      resultSection.hidden = true;
      reviewSection.hidden = true;
      setStatus(formStatus,
        errors.length === 1
          ? 'One field needs attention. It is marked below.'
          : errors.length + ' fields need attention. They are marked below.',
        true);
      errors[0].focus();
      errors[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    setStatus(formStatus, '', false);
    resultSection.hidden = true;
    currentReference = currentReference || makeReference();
    renderReview(buildPayload());
    reveal(reviewSection);
  });

  if (editBtn) {
    editBtn.addEventListener('click', function () {
      reviewSection.hidden = true;
      resultSection.hidden = true;
      setStatus(submitStatus, '', false);
      var first = form.querySelector('[data-measure-input]');
      if (first) {
        first.focus();
        first.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', function () {
      var errors = validate();
      if (errors.length) {
        reviewSection.hidden = true;
        setStatus(formStatus, 'The specification changed and is no longer valid. Please correct the marked fields.', true);
        errors[0].focus();
        return;
      }
      submitSpecification(buildPayload());
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      form.reset();
      currentUnit = 'cm';
      Array.prototype.forEach.call(form.querySelectorAll('[data-unit-label]'), function (el) {
        el.textContent = 'cm';
      });
      clearAllErrors();
      clearAllActive();
      currentReference = '';
      reviewSection.hidden = true;
      resultSection.hidden = true;
      setStatus(formStatus, 'Form cleared.', false);
      setStatus(submitStatus, '', false);
    });
  }

  /* =======================================================================
     9. ENLARGE THE TECHNICAL DRAWING (mobile / close inspection)
     ======================================================================= */
  function bindEnlarge() {
    var btn = document.getElementById('ms-enlarge');
    var diagram = document.getElementById('ms-diagram');
    if (!btn || !diagram) return;

    function close() {
      diagram.classList.remove('is-enlarged');
      document.body.classList.remove('ms-locked');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = 'ENLARGE DRAWING';
      btn.focus();
    }

    btn.addEventListener('click', function () {
      var open = !diagram.classList.contains('is-enlarged');
      diagram.classList.toggle('is-enlarged', open);
      document.body.classList.toggle('ms-locked', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'CLOSE DRAWING' : 'ENLARGE DRAWING';
      if (open) {
        var stage = document.getElementById('ms-diagram-stage');
        if (stage) stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && diagram.classList.contains('is-enlarged')) close();
    });
  }

  /* =======================================================================
     10. CENTRE THE DRAWING WHEN IT IS WIDER THAN ITS CONTAINER
     On narrow screens the technical flat scrolls horizontally; open it on the
     garment rather than against one edge.
     ======================================================================= */
  function centreDrawing() {
    var stage = document.getElementById('ms-diagram-stage');
    if (!stage) return;
    var centre = function () {
      var over = stage.scrollWidth - stage.clientWidth;
      if (over > 0) stage.scrollLeft = over / 2;
    };
    centre();
    window.addEventListener('resize', centre, { passive: true });
  }

  /* =======================================================================
     INIT
     ======================================================================= */
  buildFields();
  bindInteraction();
  bindUnitToggle();
  bindEnlarge();
  centreDrawing();
})();
