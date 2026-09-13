/**
 * =========================================================================
 * ROOTS APPAREL MANUFACTURING — GOOGLE SHEETS FORM & MEASUREMENTS HANDLER
 * =========================================================================
 * 
 * Supports:
 * 1. Contact Form Inquiries (index.html#contact) -> Saved in "Inquiries" sheet tab
 * 2. Custom Garment Measurements (measurements.html) -> Saved in "Measurements" sheet tab
 * 3. Automated Luxury Editorial HTML Email Notifications (Warm Ivory / Linen theme, no hard blacks)
 * 
 * INSTRUCTIONS TO UPDATE / SETUP:
 * 1. Open your Google Sheet.
 * 2. Click: Extensions > Apps Script.
 * 3. Replace all the code in Code.gs with this entire file.
 * 4. Click the Save button (disk icon).
 * 5. Click "Deploy" > "Manage deployments".
 * 6. Click the pencil (edit) icon, select version: "New version".
 * 7. Click "Deploy" to save the updated script.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 30 seconds for any concurrent submission to finish
  lock.tryLock(30000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();

    var p = (e && e.parameter) ? e.parameter : {};
    if (e && e.postData && e.postData.contents) {
      try {
        var parsed = JSON.parse(e.postData.contents);
        if (parsed && typeof parsed === 'object') {
          p = parsed;
        }
      } catch (err) {
        // Continue with parameter object if not JSON
      }
    }

    // Server-side honeypot spam protection
    if ((p._hp_company && p._hp_company.toString().trim().length > 0) ||
        (p._hp_reference && p._hp_reference.toString().trim().length > 0)) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Submission ignored (bot detected).'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    var formattedDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMM yyyy');
    var formattedTime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'hh:mm a');
    var logoUrl = 'https://raw.githubusercontent.com/Muhammedmidlajkp/ROOT-MANUFACTURING/main/assets/images/brand/roots-logo.png';

    var isMeasurement = (p.formType === 'measurements' || p.garmentType || p.measurements);

    // =========================================================================
    // A. CUSTOM GARMENT MEASUREMENTS (measurements.html)
    // =========================================================================
    if (isMeasurement) {
      var msSheet = doc.getSheetByName('Measurements');
      if (!msSheet) {
        msSheet = doc.insertSheet('Measurements');
      }

      var msHeaders = [
        'Timestamp',
        'Reference ID',
        'Client Name',
        'Brand / Company',
        'Email Address',
        'Garment Type',
        'Style Reference',
        'Size Label',
        'Unit',
        'Chest Width',
        'Shoulder',
        'Sleeve Length',
        'Body Length',
        'Hem Width',
        'Bicep',
        'Cuff',
        'Neck Width',
        'Collar Height',
        'Production Notes'
      ];

      if (msSheet.getLastRow() === 0) {
        msSheet.appendRow(msHeaders);
        var msHeaderRange = msSheet.getRange(1, 1, 1, msHeaders.length);
        msHeaderRange.setFontWeight('bold');
        msHeaderRange.setBackground('#22201d');
        msHeaderRange.setFontColor('#ffffff');
        msSheet.setFrozenRows(1);
      }

      var contact = p.contact || {};
      var clientName = contact.name || p.name || 'N/A';
      var clientCompany = contact.company || p.company || 'N/A';
      var clientEmail = contact.email || p.email || 'N/A';
      var unit = p.unit || 'cm';
      var m = p.measurements || {};
      var ref = p.reference || ('ROOTS-MS-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss'));

      var msRow = [
        timestamp,
        ref,
        clientName,
        clientCompany,
        clientEmail,
        p.garmentType || 'N/A',
        p.styleReference || '',
        p.size || '',
        unit,
        m.chestWidth !== undefined ? (m.chestWidth + ' ' + unit) : '',
        m.shoulder !== undefined ? (m.shoulder + ' ' + unit) : '',
        m.sleeveLength !== undefined ? (m.sleeveLength + ' ' + unit) : '',
        m.bodyLength !== undefined ? (m.bodyLength + ' ' + unit) : '',
        m.hemWidth !== undefined ? (m.hemWidth + ' ' + unit) : '',
        m.bicep !== undefined ? (m.bicep + ' ' + unit) : '',
        m.cuff !== undefined ? (m.cuff + ' ' + unit) : '',
        m.neckWidth !== undefined ? (m.neckWidth + ' ' + unit) : '',
        m.collarHeight !== undefined ? (m.collarHeight + ' ' + unit) : '',
        p.notes || ''
      ];

      msSheet.appendRow(msRow);

      // Email Notification for Measurements (Warm Editorial Luxury Style)
      try {
        var recipient = 'midlaj2636@gmail.com';
        var subject = 'New ROOTS Measurement Spec: ' + (clientCompany !== 'N/A' ? clientCompany : clientName) + ' (' + (p.garmentType || 'Garment') + ') [' + ref + ']';

        var msHtmlBody =
          '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
          '<body style="margin:0;padding:0;background-color:#ece8e0;font-family:Georgia,\'Times New Roman\',serif;">' +
          '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ece8e0;padding:32px 16px;">' +
          '<tr><td align="center">' +
          '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border:1px solid #ded9ce;box-shadow:0 4px 16px rgba(0,0,0,0.04);">' +

          // Header with Logo
          '<tr><td style="background-color:#ffffff;border-radius:8px 8px 0 0;padding:24px 32px 20px;border-bottom:2px solid #a93435;">' +
            '<table width="100%" cellpadding="0" cellspacing="0">' +
              '<tr>' +
                '<td style="vertical-align:middle;">' +
                  '<a href="https://www.rootsbusiness.in" target="_blank" style="text-decoration:none;display:inline-block;">' +
                    '<img src="' + logoUrl + '" alt="ROOTS Manufacturing" width="135" style="display:block;border:0;outline:none;height:auto;max-height:55px;" />' +
                  '</a>' +
                  '<p style="margin:6px 0 0;font-family:-apple-system,sans-serif;font-size:10px;letter-spacing:1.5px;color:#88837a;text-transform:uppercase;">Custom Garment Tech-Pack</p>' +
                '</td>' +
                '<td style="vertical-align:middle;text-align:right;">' +
                  '<span style="display:inline-block;background-color:#a93435;color:#ffffff;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:5px 12px;border-radius:3px;">' +
                    ref +
                  '</span>' +
                  '<p style="margin:6px 0 0;font-family:-apple-system,sans-serif;font-size:12px;color:#444444;font-weight:600;">' + formattedDate + '</p>' +
                  '<p style="margin:2px 0 0;font-family:-apple-system,sans-serif;font-size:11px;color:#88837a;">' + formattedTime + ' IST</p>' +
                '</td>' +
              '</tr>' +
            '</table>' +
          '</td></tr>' +

          // Soft Editorial Hero Strip (No hard black — Warm Linen & Crimson accent)
          '<tr><td style="background-color:#f5f2eb;padding:18px 32px;border-bottom:1px solid #e5e0d5;">' +
            '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
              '<td style="border-left:2px solid #a93435;padding-left:14px;vertical-align:top;">' +
                '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;color:#88837a;letter-spacing:1.5px;text-transform:uppercase;">Client</p>' +
                '<p style="margin:4px 0 0;font-family:Georgia,serif;font-size:18px;color:#1f1e1c;font-weight:600;">' + clientName + '</p>' +
              '</td>' +
              '<td style="border-left:2px solid #a93435;padding-left:14px;vertical-align:top;">' +
                '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;color:#88837a;letter-spacing:1.5px;text-transform:uppercase;">Brand / Company</p>' +
                '<p style="margin:4px 0 0;font-family:Georgia,serif;font-size:18px;color:#1f1e1c;font-weight:600;">' + clientCompany + '</p>' +
              '</td>' +
              '<td style="border-left:2px solid #a93435;padding-left:14px;vertical-align:top;">' +
                '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;color:#88837a;letter-spacing:1.5px;text-transform:uppercase;">Garment</p>' +
                '<p style="margin:4px 0 0;font-family:Georgia,serif;font-size:16px;color:#a93435;font-weight:600;font-style:italic;">' + (p.garmentType || 'Custom') + (p.size ? (' · ' + p.size) : '') + '</p>' +
              '</td>' +
            '</tr></table>' +
          '</td></tr>' +

          // Details Body
          '<tr><td style="background-color:#faf9f6;padding:28px 32px 12px;">' +
            '<p style="margin:0 0 16px;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;color:#a93435;text-transform:uppercase;border-bottom:1px solid #e5e0d8;padding-bottom:8px;">Garment Information</p>' +
            '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;line-height:1.6;margin-bottom:16px;">' +
              '<tr><td style="color:#77736c;padding:4px 0;width:140px;">Garment Type:</td><td style="color:#1f1e1c;font-weight:600;">' + (p.garmentType || '—') + '</td></tr>' +
              '<tr><td style="color:#77736c;padding:4px 0;">Style / Reference:</td><td style="color:#1f1e1c;font-weight:600;">' + (p.styleReference || '—') + '</td></tr>' +
              '<tr><td style="color:#77736c;padding:4px 0;">Size Label:</td><td style="color:#1f1e1c;font-weight:600;">' + (p.size || '—') + '</td></tr>' +
              '<tr><td style="color:#77736c;padding:4px 0;">Unit of Measure:</td><td style="color:#a93435;font-weight:700;">' + (unit === 'in' ? 'Inches (in)' : 'Centimetres (cm)') + '</td></tr>' +
              '<tr><td style="color:#77736c;padding:4px 0;">Contact Email:</td><td style="color:#1f1e1c;"><a href="mailto:' + clientEmail + '" style="color:#a93435;text-decoration:none;font-weight:500;">' + clientEmail + '</a></td></tr>' +
            '</table>' +

            // Measurements Table
            '<p style="margin:20px 0 12px;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;color:#a93435;text-transform:uppercase;border-bottom:1px solid #e5e0d8;padding-bottom:8px;">Technical Measurements (' + unit + ')</p>' +
            '<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;font-size:13px;">' +
              '<tr style="background-color:#ede9e0;font-weight:600;font-size:11px;color:#44413b;text-transform:uppercase;letter-spacing:1px;">' +
                '<th style="padding:9px 12px;text-align:left;border:1px solid #dcd7ce;">Measurement Point</th>' +
                '<th style="padding:9px 12px;text-align:right;border:1px solid #dcd7ce;">Value (' + unit + ')</th>' +
              '</tr>' +
              '<tr><td style="padding:8px 12px;border:1px solid #e5e0d8;font-weight:600;color:#22201d;">Chest Width</td><td style="padding:8px 12px;border:1px solid #e5e0d8;text-align:right;font-weight:700;color:#a93435;">' + (m.chestWidth !== undefined ? (m.chestWidth + ' ' + unit) : '—') + '</td></tr>' +
              '<tr style="background-color:#f5f3ee;"><td style="padding:8px 12px;border:1px solid #e5e0d8;font-weight:600;color:#22201d;">Shoulder</td><td style="padding:8px 12px;border:1px solid #e5e0d8;text-align:right;font-weight:700;color:#a93435;">' + (m.shoulder !== undefined ? (m.shoulder + ' ' + unit) : '—') + '</td></tr>' +
              '<tr><td style="padding:8px 12px;border:1px solid #e5e0d8;font-weight:600;color:#22201d;">Sleeve Length</td><td style="padding:8px 12px;border:1px solid #e5e0d8;text-align:right;font-weight:700;color:#a93435;">' + (m.sleeveLength !== undefined ? (m.sleeveLength + ' ' + unit) : '—') + '</td></tr>' +
              '<tr style="background-color:#f5f3ee;"><td style="padding:8px 12px;border:1px solid #e5e0d8;color:#33312c;">Body Length</td><td style="padding:8px 12px;border:1px solid #e5e0d8;text-align:right;font-weight:600;color:#22201d;">' + (m.bodyLength !== undefined ? (m.bodyLength + ' ' + unit) : '—') + '</td></tr>' +
              '<tr><td style="padding:8px 12px;border:1px solid #e5e0d8;color:#33312c;">Hem Width</td><td style="padding:8px 12px;border:1px solid #e5e0d8;text-align:right;font-weight:600;color:#22201d;">' + (m.hemWidth !== undefined ? (m.hemWidth + ' ' + unit) : '—') + '</td></tr>' +
              '<tr style="background-color:#f5f3ee;"><td style="padding:8px 12px;border:1px solid #e5e0d8;color:#33312c;">Bicep</td><td style="padding:8px 12px;border:1px solid #e5e0d8;text-align:right;font-weight:600;color:#22201d;">' + (m.bicep !== undefined ? (m.bicep + ' ' + unit) : '—') + '</td></tr>' +
              '<tr><td style="padding:8px 12px;border:1px solid #e5e0d8;color:#33312c;">Cuff</td><td style="padding:8px 12px;border:1px solid #e5e0d8;text-align:right;font-weight:600;color:#22201d;">' + (m.cuff !== undefined ? (m.cuff + ' ' + unit) : '—') + '</td></tr>' +
              '<tr style="background-color:#f5f3ee;"><td style="padding:8px 12px;border:1px solid #e5e0d8;color:#33312c;">Neck Width</td><td style="padding:8px 12px;border:1px solid #e5e0d8;text-align:right;font-weight:600;color:#22201d;">' + (m.neckWidth !== undefined ? (m.neckWidth + ' ' + unit) : '—') + '</td></tr>' +
              '<tr><td style="padding:8px 12px;border:1px solid #e5e0d8;color:#33312c;">Collar Height</td><td style="padding:8px 12px;border:1px solid #e5e0d8;text-align:right;font-weight:600;color:#22201d;">' + (m.collarHeight !== undefined ? (m.collarHeight + ' ' + unit) : '—') + '</td></tr>' +
            '</table>' +

            // Production Notes
            (p.notes ? (
              '<p style="margin:16px 0 8px;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;color:#a93435;text-transform:uppercase;border-bottom:1px solid #e5e0d8;padding-bottom:8px;">Production Notes</p>' +
              '<div style="background-color:#ffffff;border:1px solid #e5e0d8;border-left:3px solid #a93435;border-radius:0 4px 4px 0;padding:14px 16px;margin-bottom:20px;">' +
                '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:13px;color:#2b2925;line-height:1.6;white-space:pre-wrap;">' + p.notes + '</p>' +
              '</div>'
            ) : '') +

            // CTA Reply
            '<table cellpadding="0" cellspacing="0" style="margin-top:10px;margin-bottom:20px;"><tr>' +
              '<td style="background-color:#a93435;border-radius:4px;">' +
                '<a href="mailto:' + (clientEmail !== 'N/A' ? clientEmail : 'rootsbusinessconnect@gmail.com') + '?subject=Re: ROOTS Garment Specification ' + ref + '" style="display:inline-block;padding:12px 24px;font-family:-apple-system,sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;color:#ffffff;text-decoration:none;text-transform:uppercase;">Reply to Client →</a>' +
              '</td>' +
            '</tr></table>' +

          '</td></tr>' +

          // Soft Tailored Footer (No hard black)
          '<tr><td style="background-color:#ede9e0;border-top:1px solid #ded9ce;border-radius:0 0 8px 8px;padding:20px 32px;">' +
            '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
              '<td style="vertical-align:middle;">' +
                '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:11px;color:#44413b;font-weight:700;letter-spacing:0.5px;">ROOTS APPAREL MANUFACTURING</p>' +
                '<p style="margin:3px 0 0;font-family:-apple-system,sans-serif;font-size:11px;color:#77736c;">Bangalore, India · Saved to Google Sheet [Measurements]</p>' +
              '</td>' +
              '<td style="text-align:right;vertical-align:middle;">' +
                '<p style="margin:0;font-family:Georgia,serif;font-size:20px;color:#a93435;font-style:italic;">Roots</p>' +
              '</td>' +
            '</tr></table>' +
          '</td></tr>' +

          '</table></td></tr></table></body></html>';

        MailApp.sendEmail({
          to: recipient,
          subject: subject,
          htmlBody: msHtmlBody,
          replyTo: (clientEmail && clientEmail !== 'N/A') ? clientEmail : undefined
        });
      } catch (mailErr) {
        console.error('Measurement notification email error: ' + mailErr.toString());
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        reference: ref,
        message: 'Measurement specification saved to Google Sheet and notification sent.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // B. CONTACT INQUIRIES (index.html#contact)
    // =========================================================================
    var inqSheet = doc.getSheetByName('Inquiries') || doc.getActiveSheet();

    var inqHeaders = [
      'Timestamp',
      'Name',
      'Company / Brand',
      'Email Address',
      'Phone Number',
      'Location / City',
      'GST Number',
      'Manufacturing Need',
      'Project Details / Message'
    ];

    if (inqSheet.getLastRow() === 0) {
      inqSheet.appendRow(inqHeaders);
      var inqHeaderRange = inqSheet.getRange(1, 1, 1, inqHeaders.length);
      inqHeaderRange.setFontWeight('bold');
      inqHeaderRange.setBackground('#22201d');
      inqHeaderRange.setFontColor('#ffffff');
      inqSheet.setFrozenRows(1);
    }

    var row = [
      timestamp,
      p.name || '',
      p.company || '',
      p.email || '',
      p.phone || '',
      p.location || '',
      p.gst || '',
      p.manufacture || '',
      p.message || ''
    ];

    inqSheet.appendRow(row);

    // Send instant email notification to midlaj2636@gmail.com with ROOTS Logo
    // Warm Editorial Luxury Style (No hard black)
    try {
      var recipient = 'midlaj2636@gmail.com';
      var subject = 'New ROOTS Manufacturing Inquiry: ' + (p.company || p.name || 'Website Lead');

      var inqHtmlBody =
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
        '<body style="margin:0;padding:0;background-color:#ece8e0;font-family:Georgia,\'Times New Roman\',serif;">' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ece8e0;padding:32px 16px;">' +
        '<tr><td align="center">' +
        '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border:1px solid #ded9ce;box-shadow:0 4px 16px rgba(0,0,0,0.04);">' +

        // Header with ROOTS Logo
        '<tr><td style="background-color:#ffffff;border-radius:8px 8px 0 0;padding:24px 32px 20px;border-bottom:2px solid #a93435;">' +
          '<table width="100%" cellpadding="0" cellspacing="0">' +
            '<tr>' +
              '<td style="vertical-align:middle;">' +
                '<a href="https://www.rootsbusiness.in" target="_blank" style="text-decoration:none;display:inline-block;">' +
                  '<img src="' + logoUrl + '" alt="ROOTS Apparel Manufacturing" width="135" style="display:block;border:0;outline:none;height:auto;max-height:55px;" />' +
                '</a>' +
                '<p style="margin:6px 0 0;font-family:-apple-system,sans-serif;font-size:10px;letter-spacing:1.5px;color:#88837a;text-transform:uppercase;">Apparel Manufacturing · Bangalore</p>' +
              '</td>' +
              '<td style="vertical-align:middle;text-align:right;">' +
                '<span style="display:inline-block;background-color:#a93435;color:#ffffff;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:5px 12px;border-radius:3px;">' +
                  'NEW INQUIRY' +
                '</span>' +
                '<p style="margin:6px 0 0;font-family:-apple-system,sans-serif;font-size:12px;color:#444444;font-weight:600;">' + formattedDate + '</p>' +
                '<p style="margin:2px 0 0;font-family:-apple-system,sans-serif;font-size:11px;color:#88837a;">' + formattedTime + ' IST</p>' +
              '</td>' +
            '</tr>' +
          '</table>' +
        '</td></tr>' +

        // Soft Editorial Hero Strip (No hard black — Warm Linen & Crimson accent)
        '<tr><td style="background-color:#f5f2eb;padding:18px 32px;border-bottom:1px solid #e5e0d5;">' +
          '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
            '<td style="border-left:2px solid #a93435;padding-left:14px;vertical-align:top;">' +
              '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;color:#88837a;letter-spacing:1.5px;text-transform:uppercase;">Client</p>' +
              '<p style="margin:4px 0 0;font-family:Georgia,serif;font-size:18px;color:#1f1e1c;font-weight:600;">' + (p.name || 'Website Visitor') + '</p>' +
            '</td>' +
            '<td style="border-left:2px solid #a93435;padding-left:14px;vertical-align:top;">' +
              '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;color:#88837a;letter-spacing:1.5px;text-transform:uppercase;">Brand / Company</p>' +
              '<p style="margin:4px 0 0;font-family:Georgia,serif;font-size:18px;color:#1f1e1c;font-weight:600;">' + (p.company || '—') + '</p>' +
            '</td>' +
            '<td style="border-left:2px solid #a93435;padding-left:14px;vertical-align:top;">' +
              '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;color:#88837a;letter-spacing:1.5px;text-transform:uppercase;">Category</p>' +
              '<p style="margin:4px 0 0;font-family:Georgia,serif;font-size:16px;color:#a93435;font-weight:600;font-style:italic;">' + (p.manufacture || 'Not specified') + '</p>' +
            '</td>' +
          '</tr></table>' +
        '</td></tr>' +

        // Contact Details
        '<tr><td style="background-color:#faf9f6;padding:28px 32px 12px;">' +
          '<p style="margin:0 0 16px;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;color:#a93435;text-transform:uppercase;border-bottom:1px solid #e5e0d8;padding-bottom:8px;">Contact Information</p>' +
          '<table width="100%" cellpadding="0" cellspacing="0">' +
            '<tr>' +
              '<td width="50%" style="padding:0 16px 16px 0;vertical-align:top;">' +
                '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:10px;font-weight:600;letter-spacing:1.5px;color:#88837a;text-transform:uppercase;">Email Address</p>' +
                '<p style="margin:4px 0 0;font-family:-apple-system,sans-serif;font-size:14px;color:#1f1e1c;">' +
                  '<a href="mailto:' + (p.email || '') + '" style="color:#a93435;text-decoration:none;font-weight:500;">' + (p.email || 'Not provided') + '</a>' +
                '</p>' +
              '</td>' +
              '<td width="50%" style="padding:0 0 16px 16px;vertical-align:top;">' +
                '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:10px;font-weight:600;letter-spacing:1.5px;color:#88837a;text-transform:uppercase;">Phone Number</p>' +
                '<p style="margin:4px 0 0;font-family:-apple-system,sans-serif;font-size:14px;color:#1f1e1c;">' +
                  (p.phone ? '<a href="tel:' + p.phone + '" style="color:#1f1e1c;text-decoration:none;font-weight:500;">' + p.phone + '</a>' : '<span style="color:#aaaaaa;font-style:italic;">Not provided</span>') +
                '</p>' +
              '</td>' +
            '</tr>' +
            '<tr>' +
              '<td width="50%" style="padding:0 16px 16px 0;vertical-align:top;">' +
                '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:10px;font-weight:600;letter-spacing:1.5px;color:#88837a;text-transform:uppercase;">Location / City</p>' +
                '<p style="margin:4px 0 0;font-family:-apple-system,sans-serif;font-size:14px;color:#1f1e1c;font-weight:500;">' + (p.location || '<span style="color:#aaaaaa;font-style:italic;font-weight:normal;">Not provided</span>') + '</p>' +
              '</td>' +
              '<td width="50%" style="padding:0 0 16px 16px;vertical-align:top;">' +
                '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:10px;font-weight:600;letter-spacing:1.5px;color:#88837a;text-transform:uppercase;">GST Number</p>' +
                '<p style="margin:4px 0 0;font-family:-apple-system,sans-serif;font-size:14px;color:#1f1e1c;font-family:monospace;">' + (p.gst || '<span style="color:#aaaaaa;font-style:italic;font-family:-apple-system,sans-serif;">Not provided</span>') + '</p>' +
              '</td>' +
            '</tr>' +
          '</table>' +
        '</td></tr>' +

        (p.manufacture ? (
        '<tr><td style="background-color:#faf9f6;padding:0 32px 20px;">' +
          '<p style="margin:0 0 10px;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;color:#a93435;text-transform:uppercase;border-bottom:1px solid #e5e0d8;padding-bottom:8px;">Manufacturing Category</p>' +
          '<div style="display:inline-block;background-color:#ffffff;border:1px solid #dcd7ce;border-left:3px solid #a93435;border-radius:3px;padding:9px 18px;">' +
            '<span style="font-family:-apple-system,sans-serif;font-size:13px;font-weight:700;color:#1f1e1c;letter-spacing:0.5px;">' + p.manufacture + '</span>' +
          '</div>' +
        '</td></tr>'
        ) : '') +

        (p.message ? (
        '<tr><td style="background-color:#faf9f6;padding:0 32px 24px;">' +
          '<p style="margin:0 0 10px;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;color:#a93435;text-transform:uppercase;border-bottom:1px solid #e5e0d8;padding-bottom:8px;">Project Details</p>' +
          '<div style="background-color:#ffffff;border:1px solid #e5e0d8;border-left:3px solid #a93435;border-radius:0 4px 4px 0;padding:14px 16px;">' +
            '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:13px;color:#2b2925;line-height:1.7;white-space:pre-wrap;">' + p.message + '</p>' +
          '</div>' +
        '</td></tr>'
        ) : '') +

        '<tr><td style="background-color:#faf9f6;padding:4px 32px 28px;">' +
          '<table cellpadding="0" cellspacing="0"><tr>' +
            '<td style="background-color:#a93435;border-radius:4px;">' +
              '<a href="mailto:' + (p.email || 'rootsbusinessconnect@gmail.com') + '?subject=Re: Your enquiry to ROOTS Manufacturing" style="display:inline-block;padding:12px 24px;font-family:-apple-system,sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;color:#ffffff;text-decoration:none;text-transform:uppercase;">Reply to Client →</a>' +
            '</td>' +
          '</tr></table>' +
        '</td></tr>' +

        // Soft Tailored Footer (No hard black)
        '<tr><td style="background-color:#ede9e0;border-top:1px solid #ded9ce;border-radius:0 0 8px 8px;padding:20px 32px;">' +
          '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
            '<td style="vertical-align:middle;">' +
              '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:11px;color:#44413b;font-weight:700;letter-spacing:0.5px;">ROOTS APPAREL MANUFACTURING</p>' +
              '<p style="margin:3px 0 0;font-family:-apple-system,sans-serif;font-size:11px;color:#77736c;">Bangalore, Karnataka, India · Saved to Google Sheet</p>' +
            '</td>' +
            '<td style="text-align:right;vertical-align:middle;">' +
              '<p style="margin:0;font-family:Georgia,serif;font-size:20px;color:#a93435;font-style:italic;">Roots</p>' +
            '</td>' +
          '</tr></table>' +
        '</td></tr>' +

        '</table></td></tr></table></body></html>';

      MailApp.sendEmail({
        to: recipient,
        subject: subject,
        htmlBody: inqHtmlBody,
        replyTo: p.email || undefined
      });
    } catch (mailErr) {
      console.error('Inquiry email error: ' + mailErr.toString());
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Inquiry saved and notification sent successfully.'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'active',
    message: 'ROOTS Google Sheet Webhook is active and listening.'
  })).setMimeType(ContentService.MimeType.JSON);
}
