/**
 * ROOTS — CUSTOM MEASUREMENTS PAGE
 * Vanilla JS | Zero dependencies | Progressive, accessible, no framework
 *
 * -------------------------------------------------------------------------
 * SUBMISSION
 * -------------------------------------------------------------------------
 * `CONFIG.endpoint` IS configured: a Google Apps Script web app that appends
 * the specification to a sheet and sends an email alert. The homepage contact
 * form posts to the same endpoint (see GOOGLE_SHEET_URL in js/main.js).
 *
 * The one rule this file will not break: it never tells a visitor the
 * specification reached ROOTS unless the endpoint has said so. Success
 * requires `status === 'success'` in the parsed reply — POSITIVE confirmation,
 * not merely the absence of an error. An Apps Script whose access is not set
 * to "Anyone" answers HTTP 200 with an HTML authorisation page; treating that
 * as success would tell a client their spec was saved when it was not.
 *
 * Anything else — a non-2xx, an unparseable body, a missing status — falls
 * through to the delivery options (download, clipboard, prefilled email),
 * which work offline and put the specification in the visitor's own hands.
 * That is the correct fail-closed behaviour: never lose the lead silently.
 *
 * Server-side validation, spam protection and rate limiting remain the
 * backend's responsibility — the client-side checks here are not enough.
 * -------------------------------------------------------------------------
 */

(function () {
  'use strict';

  /* =======================================================================
     CONFIG
     ======================================================================= */
  var CONFIG = {
    // Google Sheets Webhook URL for custom garment measurements
    endpoint: 'https://script.google.com/macros/s/AKfycbzAuIVChWKgNyISkzhc2uXSMK55eT3yduKzA5TsJ5pn-mZuQEui5FCD3e6CU3mDk6-Jpg/exec',
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
      status: 'confirmed',
      required: true,
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
  var isSubmitting = false;
  var originalSubmitBtnHtml = submitBtn ? submitBtn.innerHTML : 'SUBMIT SPECIFICATIONS <span aria-hidden="true">→</span>';

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
  /* Canonical centimetre value per field, kept off-screen.
     -----------------------------------------------------------------------
     The visible input is a ROUNDED view (one decimal). Converting the visible
     number and writing it back made that rounded view the new source of truth,
     so every unit toggle lost precision permanently and irreversibly:

         54 cm  ->  21.3 in  ->  54.1 cm     (1 mm gained, never recoverable)
         3.5 cm ->   1.4 in  ->   3.6 cm     (1 mm gained on a collar height)

     A garment specification that silently edits the client's own figures is
     worse than one that refuses to convert. So the centimetre value the user
     actually committed is stored here, and the field is re-rendered from it —
     a cm -> in -> cm round trip now returns exactly what was typed. */
  var canonicalCm = {};

  // What renderFromCanonical last wrote into each field. A field still showing
  // exactly that string has not been edited since, so its canonical value is
  // still authoritative and must NOT be re-derived from the rounded display —
  // doing so reintroduces the very drift this exists to prevent.
  var lastRendered = {};

  function readCanonical(input, id) {
    var v = parseFloat(input.value);
    if (input.value === '' || isNaN(v)) {
      delete canonicalCm[id];
      delete lastRendered[id];
      return;
    }
    canonicalCm[id] = currentUnit === 'in' ? v * CM_PER_INCH : v;
    lastRendered[id] = input.value;
  }

  function renderFromCanonical(id, unit) {
    var input = form.querySelector('[data-measure-input="' + id + '"]');
    if (!input) return;
    if (!(id in canonicalCm)) { input.value = ''; delete lastRendered[id]; return; }
    var shown = unit === 'in' ? canonicalCm[id] / CM_PER_INCH : canonicalCm[id];
    input.value = String(Math.round(shown * 10) / 10);
    lastRendered[id] = input.value;
  }

  function bindCanonicalTracking() {
    MEASUREMENTS.forEach(function (m) {
      var input = form.querySelector('[data-measure-input="' + m.id + '"]');
      if (!input) return;
      input.addEventListener('input', function () { readCanonical(input, m.id); });
    });
  }

  function bindUnitToggle() {
    Array.prototype.forEach.call(form.querySelectorAll('input[name="unit"]'), function (radio) {
      radio.addEventListener('change', function () {
        if (!radio.checked) return;
        var next = radio.value;
        if (next === currentUnit) return;

        // Anything typed but not yet seen by the input listener (autofill,
        // paste, a programmatic set) is captured before the unit flips — but
        // ONLY where the field no longer matches what was last rendered into
        // it. Re-reading an untouched field would take the rounded display as
        // the new truth and drift by a millimetre on every toggle.
        MEASUREMENTS.forEach(function (m) {
          var input = form.querySelector('[data-measure-input="' + m.id + '"]');
          if (input && input.value !== lastRendered[m.id]) readCanonical(input, m.id);
        });

        currentUnit = next;
        MEASUREMENTS.forEach(function (m) { renderFromCanonical(m.id, next); });

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
    ['garmentType', 'styleReference', 'size', 'contactName', 'company', 'email', 'phone', 'notes'].forEach(clearError);
  }

  function validate() {
    clearAllErrors();
    var errors = [];

    // Garment type, Style Reference & Size
    var garment = document.getElementById('ms-garmentType');
    if (!garment.value) {
      showError('garmentType', 'Please select the garment type.');
      errors.push(garment);
    }
    var styleRef = document.getElementById('ms-styleReference');
    if (styleRef && !styleRef.value.trim()) {
      showError('styleReference', 'Please enter your style or reference code.');
      errors.push(styleRef);
    }
    var sizeLabel = document.getElementById('ms-size');
    if (sizeLabel && !sizeLabel.value.trim()) {
      showError('size', 'Please enter a size label (e.g. M / 40).');
      errors.push(sizeLabel);
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

      if (!/^-?\d*\.?\d+$/.test(raw)) {
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
      showError('contactName', 'Please enter your full name.');
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
      showError('email', 'Please enter an email address for reply.');
      errors.push(email);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      showError('email', 'Please enter a valid email address (e.g. name@brand.com).');
      errors.push(email);
    }
    var phone = document.getElementById('ms-phone');
    if (phone) {
      var phoneVal = phone.value.trim();
      if (!phoneVal) {
        showError('phone', 'Please enter your phone or WhatsApp number.');
        errors.push(phone);
      } else if (phoneVal.replace(/\D/g, '').length < 7) {
        showError('phone', 'Please enter a valid phone number with at least 7 digits.');
        errors.push(phone);
      }
    }
    var notes = document.getElementById('ms-notes');
    if (notes && !notes.value.trim()) {
      showError('notes', 'Please provide production notes, quantities, or fabric details.');
      errors.push(notes);
    } else if (notes && notes.value.trim().length < 5) {
      showError('notes', 'Please provide a little more detail in production notes (at least 5 characters).');
      errors.push(notes);
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
        email: document.getElementById('ms-email').value.trim(),
        phone: document.getElementById('ms-phone') ? document.getElementById('ms-phone').value.trim() : ''
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
    if (p.contact.phone) {
      lines.push('  Phone: ' + p.contact.phone);
    }
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
          ['Phone', p.contact.phone || null],
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
      // "and it reaches us straight away" was not true of three of the four
      // options: download, copy and save-JSON all leave the file on the
      // visitor's own device. Only the email route puts it in front of ROOTS,
      // and only once the visitor presses send in their mail client. Saying
      // otherwise is the same lead-loss failure the top of this file exists to
      // prevent.
      '<p>Your specification is complete, but it has <strong>not</strong> been sent to ROOTS yet. ' +
      'Use <strong>Open email to ROOTS</strong> to send it — the other options save a copy to ' +
      'your device, which you can then attach to an email or a WhatsApp message yourself.</p>' +
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

    if (isSubmitting) return;
    isSubmitting = true;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.innerHTML = 'SAVING SPECIFICATIONS… <span class="ms-btn-spinner" aria-hidden="true">⏳</span>';
    }
    if (editBtn) editBtn.disabled = true;

    setStatus(submitStatus, 'Saving specifications to Google Sheets…', false);

    // Explicitly flag as measurement submission
    p.formType = 'measurements';

    fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(p)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      // Do NOT swallow a parse failure into {}. An Apps Script deployment whose
      // access is not set to "Anyone" answers 200 with an HTML authorisation
      // page; res.json() then throws, {} has no `status`, and the old check —
      // which only rejected status === 'error' — read that as success and told
      // the visitor their specification had been saved. It had not.
      return res.text().then(function (body) {
        try { return JSON.parse(body); }
        catch (e) { throw new Error('endpoint did not return JSON'); }
      });
    }).then(function (data) {
      // Positive confirmation only: the script must actually say "success".
      // Absence of an error is not evidence that anything was stored.
      if (!data || data.status !== 'success') {
        throw new Error((data && data.message) || 'endpoint did not confirm the save');
      }
      var finalRef = (data && data.reference) || p.reference;
      renderSuccessState(p, finalRef);
      reveal(resultSection);
      setStatus(submitStatus, 'Specification saved to Google Sheet successfully.', false);

      // Permanently lock submit button in completed state so it cannot be clicked again
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.removeAttribute('aria-busy');
        submitBtn.classList.add('is-submitted');
        submitBtn.innerHTML = 'SPECIFICATIONS SUBMITTED <span aria-hidden="true">✓</span>';
      }

      // Launch Luxury Animated Popup Modal for Measurements
      showMeasurementSuccessModal({
        eyebrow: 'TECH-PACK CONFIRMED',
        title: 'SPECIFICATIONS SUBMITTED.',
        name: p.contact ? p.contact.name : '',
        company: p.contact ? p.contact.company : '',
        email: p.contact ? p.contact.email : '',
        phone: p.contact ? p.contact.phone : '',
        garment: (p.garmentType || 'Garment') + (p.size ? (' (' + p.size + ')') : ''),
        reference: finalRef,
        ctaText: 'REVIEW TECH-PACK'
      });
    }).catch(function (err) {
      isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');
        submitBtn.innerHTML = originalSubmitBtnHtml;
      }
      if (editBtn) editBtn.disabled = false;

      setStatus(submitStatus, 'Could not save directly to Google Sheets (' + err.message +
        '). Please use the delivery options below to share your specification.', true);
      renderDeliveryState(p);
      reveal(resultSection);
    });
  }

  function showMeasurementSuccessModal(data) {
    var existing = document.getElementById('roots-success-modal');
    if (existing) existing.remove();

    var backdrop = document.createElement('div');
    backdrop.className = 'roots-modal-backdrop';
    backdrop.id = 'roots-success-modal';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-labelledby', 'roots-modal-title');

    var summaryRows = [];
    if (data.reference) summaryRows.push(['Specification Ref', data.reference]);
    if (data.company) summaryRows.push(['Brand / Company', data.company]);
    if (data.garment) summaryRows.push(['Garment Spec', data.garment]);
    if (data.email) summaryRows.push(['Email Contact', data.email]);
    if (data.phone) summaryRows.push(['Phone Number', data.phone]);

    var summaryHtml = summaryRows.length ? 
      '<div class="roots-modal-summary">' +
        summaryRows.map(function (row) {
          return '<div class="roots-modal-summary-row">' +
            '<span class="roots-modal-summary-label">' + row[0] + '</span>' +
            '<span class="roots-modal-summary-val">' + row[1] + '</span>' +
          '</div>';
        }).join('') +
      '</div>' : '';

    var desc = 'Thank you' + (data.name ? ', <strong>' + data.name + '</strong>' : '') + 
      '. Your custom garment measurements' + (data.company ? ' for <strong>' + data.company + '</strong>' : '') + 
      ' have been received and saved directly to the ROOTS production schedule. Our pattern masters will review the specs and reach out shortly.';

    backdrop.innerHTML =
      '<div class="roots-modal-card">' +
        '<button type="button" class="roots-modal-close" id="roots-modal-close" aria-label="Close dialog">&times;</button>' +
        '<div class="roots-modal-icon-wrap">' +
          '<div class="roots-modal-ring"></div>' +
          '<svg class="roots-modal-check" viewBox="0 0 52 52" aria-hidden="true">' +
            '<circle class="roots-check-circle" cx="26" cy="26" r="24" fill="none"/>' +
            '<path class="roots-check-path" fill="none" d="M14.5 26.5l8 8 16-16"/>' +
          '</svg>' +
        '</div>' +
        '<p class="roots-modal-eyebrow">' + (data.eyebrow || 'TECH-PACK CONFIRMED') + '</p>' +
        '<h3 class="roots-modal-title" id="roots-modal-title">' + (data.title || 'SPECIFICATIONS SUBMITTED.') + '</h3>' +
        '<p class="roots-modal-desc">' + desc + '</p>' +
        summaryHtml +
        '<div class="roots-modal-actions">' +
          '<button type="button" class="roots-modal-btn-primary" id="roots-modal-dismiss">' +
            (data.ctaText || 'VIEW SUMMARY') + ' <span aria-hidden="true">&rarr;</span>' +
          '</button>' +
          '<a href="https://wa.me/918296376673?text=Hello%20ROOTS%2C%20I%20just%20submitted%20garment%20specifications%20with%20reference%20' + (data.reference || '') + '%20and%20would%20like%20to%20discuss%20sampling." target="_blank" rel="noopener noreferrer" class="roots-modal-btn-secondary">' +
            'Chat with Team on WhatsApp &rarr;' +
          '</a>' +
        '</div>' +
      '</div>';

    document.body.appendChild(backdrop);

    requestAnimationFrame(function () {
      backdrop.classList.add('is-active');
      var btn = backdrop.querySelector('#roots-modal-dismiss');
      if (btn) btn.focus();
    });

    var close = function () {
      backdrop.classList.remove('is-active');
      setTimeout(function () { backdrop.remove(); }, 400);
    };

    var closeBtn = backdrop.querySelector('#roots-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', close);
    var dismissBtn = backdrop.querySelector('#roots-modal-dismiss');
    if (dismissBtn) dismissBtn.addEventListener('click', close);

    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) close();
    });

    var onKeyDown = function (ev) {
      if (ev.key === 'Escape') {
        close();
        document.removeEventListener('keydown', onKeyDown);
      }
    };
    document.addEventListener('keydown', onKeyDown);
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
      if (isSubmitting || submitBtn.disabled) return;
      var errors = validate();
      if (errors.length) {
        reviewSection.hidden = true;
        setStatus(formStatus, 'The specification changed and is no longer valid. Please correct the marked fields.', true);
        errors[0].focus();
        errors[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
      submitSpecification(buildPayload());
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (isSubmitting) return;
      isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');
        submitBtn.classList.remove('is-submitted');
        submitBtn.innerHTML = originalSubmitBtnHtml;
      }
      if (editBtn) editBtn.disabled = false;
      form.reset();
      currentUnit = 'cm';
      canonicalCm = {};
      lastRendered = {};
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
  bindCanonicalTracking();
  bindInteraction();
  bindUnitToggle();
  bindEnlarge();
  centreDrawing();
})();
