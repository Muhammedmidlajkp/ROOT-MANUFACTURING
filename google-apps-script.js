/**
 * =========================================================================
 * ROOTS APPAREL MANUFACTURING — GOOGLE SHEETS FORM & MEASUREMENTS HANDLER
 * =========================================================================
 * 
 * Supports:
 * 1. Contact Form Inquiries (index.html#contact) -> Saved in "Inquiries" sheet tab
 * 2. Custom Garment Measurements (measurements.html) -> Saved in "Measurements" sheet tab
 * 3. Automated Luxury HTML Email Notifications to midlaj2636@gmail.com for BOTH types!
 * 
 * INSTRUCTIONS TO UPDATE / SETUP:
 * 1. Open your Google Sheet (where ROOTS Inquiries is connected).
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
        msHeaderRange.setBackground('#111111');
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

      // Email Notification for Measurements
      try {
        var recipient = 'midlaj2636@gmail.com';
        var subject = 'New ROOTS Measurement Spec: ' + (clientCompany !== 'N/A' ? clientCompany : clientName) + ' (' + (p.garmentType || 'Garment') + ') [' + ref + ']';

        var msHtmlBody =
          '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
          '<body style="margin:0;padding:0;background-color:#f0ede6;font-family:Georgia,\'Times New Roman\',serif;">' +
          '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ede6;padding:32px 16px;">' +
          '<tr><td align="center">' +
          '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">' +

          // Header
          '<tr><td style="background-color:#111111;border-radius:8px 8px 0 0;padding:0;">' +
            '<table width="100%" cellpadding="0" cellspacing="0">' +
              '<tr>' +
                '<td style="padding:28px 32px 20px;">' +
                  '<p style="margin:0 0 4px;font-family:Georgia,serif;font-size:11px;letter-spacing:3px;color:#a8a69e;text-transform:uppercase;">Measurement Tech-Pack</p>' +
                  '<h1 style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#ffffff;letter-spacing:1px;line-height:1.2;">ROOTS</h1>' +
                  '<p style="margin:2px 0 0;font-family:-apple-system,sans-serif;font-size:11px;letter-spacing:2px;color:#a8a69e;text-transform:uppercase;">Custom Garment Specification</p>' +
                '</td>' +
                '<td style="padding:28px 32px 20px;text-align:right;vertical-align:top;">' +
                  '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:20px;font-weight:700;color:#ffffff;line-height:1;">' + formattedDate + '</p>' +
                  '<p style="margin:4px 0 0;font-family:-apple-system,sans-serif;font-size:12px;color:#a8a69e;">' + formattedTime + ' IST</p>' +
                  '<div style="margin-top:10px;display:inline-block;background-color:#a93435;border-radius:3px;padding:4px 10px;">' +
                    '<span style="font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;color:#ffffff;text-transform:uppercase;">' + ref + '</span>' +
                  '</div>' +
                '</td>' +
              '</tr>' +
              '<tr><td colspan="2" style="padding:0;"><div style="height:3px;background:linear-gradient(90deg,#a93435 0%,#d45c5d 50%,#a93435 100%);"></div></td></tr>' +
            '</table>' +
          '</td></tr>' +

          // Hero Strip
          '<tr><td style="background-color:#1a1a1a;padding:16px 32px;">' +
            '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
              '<td style="border-left:3px solid #a93435;padding-left:14px;">' +
                '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:11px;color:#a8a69e;letter-spacing:1.5px;text-transform:uppercase;">Client</p>' +
                '<p style="margin:3px 0 0;font-family:Georgia,serif;font-size:18px;color:#ffffff;">' + clientName + '</p>' +
              '</td>' +
              '<td style="border-left:3px solid #a93435;padding-left:14px;">' +
                '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:11px;color:#a8a69e;letter-spacing:1.5px;text-transform:uppercase;">Brand</p>' +
                '<p style="margin:3px 0 0;font-family:Georgia,serif;font-size:18px;color:#ffffff;">' + clientCompany + '</p>' +
              '</td>' +
              '<td style="border-left:3px solid #a93435;padding-left:14px;">' +
                '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:11px;color:#a8a69e;letter-spacing:1.5px;text-transform:uppercase;">Garment</p>' +
                '<p style="margin:3px 0 0;font-family:Georgia,serif;font-size:16px;color:#e8b4b5;font-style:italic;">' + (p.garmentType || 'Custom') + (p.size ? (' · ' + p.size) : '') + '</p>' +
              '</td>' +
            '</tr></table>' +
          '</td></tr>' +

          // Details Body
          '<tr><td style="background-color:#faf9f6;padding:28px 32px 12px;">' +
            '<p style="margin:0 0 16px;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;color:#a93435;text-transform:uppercase;border-bottom:1px solid #e5e0d8;padding-bottom:8px;">Garment Information</p>' +
            '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;line-height:1.6;margin-bottom:16px;">' +
              '<tr><td style="color:#777;padding:4px 0;width:140px;">Garment Type:</td><td style="color:#111;font-weight:600;">' + (p.garmentType || '—') + '</td></tr>' +
              '<tr><td style="color:#777;padding:4px 0;">Style / Reference:</td><td style="color:#111;font-weight:600;">' + (p.styleReference || '—') + '</td></tr>' +
              '<tr><td style="color:#777;padding:4px 0;">Size Label:</td><td style="color:#111;font-weight:600;">' + (p.size || '—') + '</td></tr>' +
              '<tr><td style="color:#777;padding:4px 0;">Unit of Measure:</td><td style="color:#a93435;font-weight:700;">' + (unit === 'in' ? 'Inches (in)' : 'Centimetres (cm)') + '</td></tr>' +
              '<tr><td style="color:#777;padding:4px 0;">Contact Email:</td><td style="color:#111;"><a href="mailto:' + clientEmail + '" style="color:#a93435;text-decoration:none;">' + clientEmail + '</a></td></tr>' +
            '</table>' +

            // Measurements Table
            '<p style="margin:20px 0 12px;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;color:#a93435;text-transform:uppercase;border-bottom:1px solid #e5e0d8;padding-bottom:8px;">Technical Measurements (' + unit + ')</p>' +
            '<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;font-size:13px;">' +
              '<tr style="background-color:#eae6dd;font-weight:600;font-size:11px;color:#333;text-transform:uppercase;letter-spacing:1px;">' +
                '<th style="padding:8px 12px;text-align:left;border:1px solid #dcd7ce;">Measurement Point</th>' +
                '<th style="padding:8px 12px;text-align:right;border:1px solid #dcd7ce;">Value (' + unit + ')</th>' +
              '</tr>' +
              '<tr><td style="padding:7px 12px;border:1px solid #e5e0d8;font-weight:600;">Chest Width</td><td style="padding:7px 12px;border:1px solid #e5e0d8;text-align:right;font-weight:700;color:#111;">' + (m.chestWidth !== undefined ? (m.chestWidth + ' ' + unit) : '—') + '</td></tr>' +
              '<tr style="background-color:#f5f3ee;"><td style="padding:7px 12px;border:1px solid #e5e0d8;font-weight:600;">Shoulder</td><td style="padding:7px 12px;border:1px solid #e5e0d8;text-align:right;font-weight:700;color:#111;">' + (m.shoulder !== undefined ? (m.shoulder + ' ' + unit) : '—') + '</td></tr>' +
              '<tr><td style="padding:7px 12px;border:1px solid #e5e0d8;font-weight:600;">Sleeve Length</td><td style="padding:7px 12px;border:1px solid #e5e0d8;text-align:right;font-weight:700;color:#111;">' + (m.sleeveLength !== undefined ? (m.sleeveLength + ' ' + unit) : '—') + '</td></tr>' +
              '<tr style="background-color:#f5f3ee;"><td style="padding:7px 12px;border:1px solid #e5e0d8;">Body Length</td><td style="padding:7px 12px;border:1px solid #e5e0d8;text-align:right;">' + (m.bodyLength !== undefined ? (m.bodyLength + ' ' + unit) : '—') + '</td></tr>' +
              '<tr><td style="padding:7px 12px;border:1px solid #e5e0d8;">Hem Width</td><td style="padding:7px 12px;border:1px solid #e5e0d8;text-align:right;">' + (m.hemWidth !== undefined ? (m.hemWidth + ' ' + unit) : '—') + '</td></tr>' +
              '<tr style="background-color:#f5f3ee;"><td style="padding:7px 12px;border:1px solid #e5e0d8;">Bicep</td><td style="padding:7px 12px;border:1px solid #e5e0d8;text-align:right;">' + (m.bicep !== undefined ? (m.bicep + ' ' + unit) : '—') + '</td></tr>' +
              '<tr><td style="padding:7px 12px;border:1px solid #e5e0d8;">Cuff</td><td style="padding:7px 12px;border:1px solid #e5e0d8;text-align:right;">' + (m.cuff !== undefined ? (m.cuff + ' ' + unit) : '—') + '</td></tr>' +
              '<tr style="background-color:#f5f3ee;"><td style="padding:7px 12px;border:1px solid #e5e0d8;">Neck Width</td><td style="padding:7px 12px;border:1px solid #e5e0d8;text-align:right;">' + (m.neckWidth !== undefined ? (m.neckWidth + ' ' + unit) : '—') + '</td></tr>' +
              '<tr><td style="padding:7px 12px;border:1px solid #e5e0d8;">Collar Height</td><td style="padding:7px 12px;border:1px solid #e5e0d8;text-align:right;">' + (m.collarHeight !== undefined ? (m.collarHeight + ' ' + unit) : '—') + '</td></tr>' +
            '</table>' +

            // Production Notes
            (p.notes ? (
              '<p style="margin:16px 0 8px;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;color:#a93435;text-transform:uppercase;border-bottom:1px solid #e5e0d8;padding-bottom:8px;">Production Notes</p>' +
              '<div style="background-color:#ffffff;border:1px solid #e5e0d8;border-left:3px solid #a93435;border-radius:0 4px 4px 0;padding:12px 16px;margin-bottom:20px;">' +
                '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:13px;color:#333;line-height:1.6;white-space:pre-wrap;">' + p.notes + '</p>' +
              '</div>'
            ) : '') +

            // CTA Reply
            '<table cellpadding="0" cellspacing="0" style="margin-top:8px;margin-bottom:16px;"><tr>' +
              '<td style="background-color:#a93435;border-radius:4px;">' +
                '<a href="mailto:' + (clientEmail !== 'N/A' ? clientEmail : 'rootsbusinessconnect@gmail.com') + '?subject=Re: ROOTS Garment Specification ' + ref + '" style="display:inline-block;padding:12px 24px;font-family:-apple-system,sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;color:#ffffff;text-decoration:none;text-transform:uppercase;">Reply to Client →</a>' +
              '</td>' +
            '</tr></table>' +

          '</td></tr>' +

          // Footer
          '<tr><td style="background-color:#111111;border-radius:0 0 8px 8px;padding:16px 32px;">' +
            '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
              '<td>' +
                '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:11px;color:#a8a69e;">ROOTS Apparel Manufacturing · Bangalore, India</p>' +
                '<p style="margin:4px 0 0;font-family:-apple-system,sans-serif;font-size:11px;color:#555555;">Saved to Google Sheet [Measurements] · ' + timestamp + ' IST</p>' +
              '</td>' +
              '<td style="text-align:right;">' +
                '<p style="margin:0;font-family:Georgia,serif;font-size:18px;color:#a93435;font-style:italic;">Roots</p>' +
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
      inqHeaderRange.setBackground('#111111');
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

    // Send instant email notification to midlaj2636@gmail.com
    try {
      var recipient = 'midlaj2636@gmail.com';
      var subject = 'New ROOTS Manufacturing Inquiry: ' + (p.company || p.name || 'Website Lead');

      var inqHtmlBody =
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
        '<body style="margin:0;padding:0;background-color:#f0ede6;font-family:Georgia,\'Times New Roman\',serif;">' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ede6;padding:32px 16px;">' +
        '<tr><td align="center">' +
        '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">' +

        // Header
        '<tr><td style="background-color:#111111;border-radius:8px 8px 0 0;padding:0;">' +
          '<table width="100%" cellpadding="0" cellspacing="0">' +
            '<tr>' +
              '<td style="padding:28px 32px 20px;">' +
                '<p style="margin:0 0 4px;font-family:Georgia,serif;font-size:11px;letter-spacing:3px;color:#a8a69e;text-transform:uppercase;">New Inquiry</p>' +
                '<h1 style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#ffffff;letter-spacing:1px;line-height:1.2;">ROOTS</h1>' +
                '<p style="margin:2px 0 0;font-family:-apple-system,sans-serif;font-size:11px;letter-spacing:2px;color:#a8a69e;text-transform:uppercase;">Apparel Manufacturing</p>' +
              '</td>' +
              '<td style="padding:28px 32px 20px;text-align:right;vertical-align:top;">' +
                '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:20px;font-weight:700;color:#ffffff;line-height:1;">' + formattedDate + '</p>' +
                '<p style="margin:4px 0 0;font-family:-apple-system,sans-serif;font-size:12px;color:#a8a69e;">' + formattedTime + ' IST</p>' +
                '<div style="margin-top:10px;display:inline-block;background-color:#a93435;border-radius:3px;padding:4px 10px;">' +
                  '<span style="font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;color:#ffffff;text-transform:uppercase;">New Lead</span>' +
                '</div>' +
              '</td>' +
            '</tr>' +
            '<tr><td colspan="2" style="padding:0;"><div style="height:3px;background:linear-gradient(90deg,#a93435 0%,#d45c5d 50%,#a93435 100%);"></div></td></tr>' +
          '</table>' +
        '</td></tr>' +

        // Hero Strip
        '<tr><td style="background-color:#1a1a1a;padding:16px 32px;">' +
          '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
            '<td style="border-left:3px solid #a93435;padding-left:14px;">' +
              '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:11px;color:#a8a69e;letter-spacing:1.5px;text-transform:uppercase;">Client</p>' +
              '<p style="margin:3px 0 0;font-family:Georgia,serif;font-size:18px;color:#ffffff;">' + (p.name || 'Website Visitor') + '</p>' +
            '</td>' +
            '<td style="border-left:3px solid #a93435;padding-left:14px;">' +
              '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:11px;color:#a8a69e;letter-spacing:1.5px;text-transform:uppercase;">Brand / Company</p>' +
              '<p style="margin:3px 0 0;font-family:Georgia,serif;font-size:18px;color:#ffffff;">' + (p.company || '—') + '</p>' +
            '</td>' +
            '<td style="border-left:3px solid #a93435;padding-left:14px;">' +
              '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:11px;color:#a8a69e;letter-spacing:1.5px;text-transform:uppercase;">Category</p>' +
              '<p style="margin:3px 0 0;font-family:Georgia,serif;font-size:15px;color:#e8b4b5;font-style:italic;">' + (p.manufacture || 'Not specified') + '</p>' +
            '</td>' +
          '</tr></table>' +
        '</td></tr>' +

        // Contact Details
        '<tr><td style="background-color:#faf9f6;padding:28px 32px 8px;">' +
          '<p style="margin:0 0 16px;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;color:#a93435;text-transform:uppercase;border-bottom:1px solid #e5e0d8;padding-bottom:8px;">Contact Information</p>' +
          '<table width="100%" cellpadding="0" cellspacing="0">' +
            '<tr>' +
              '<td width="50%" style="padding:0 16px 16px 0;vertical-align:top;">' +
                '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:10px;font-weight:600;letter-spacing:1.5px;color:#999999;text-transform:uppercase;">Email Address</p>' +
                '<p style="margin:4px 0 0;font-family:-apple-system,sans-serif;font-size:14px;color:#111111;">' +
                  '<a href="mailto:' + (p.email || '') + '" style="color:#a93435;text-decoration:none;font-weight:500;">' + (p.email || 'Not provided') + '</a>' +
                '</p>' +
              '</td>' +
              '<td width="50%" style="padding:0 0 16px 16px;vertical-align:top;">' +
                '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:10px;font-weight:600;letter-spacing:1.5px;color:#999999;text-transform:uppercase;">Phone Number</p>' +
                '<p style="margin:4px 0 0;font-family:-apple-system,sans-serif;font-size:14px;color:#111111;">' +
                  (p.phone ? '<a href="tel:' + p.phone + '" style="color:#111111;text-decoration:none;">' + p.phone + '</a>' : '<span style="color:#aaaaaa;font-style:italic;">Not provided</span>') +
                '</p>' +
              '</td>' +
            '</tr>' +
            '<tr>' +
              '<td width="50%" style="padding:0 16px 16px 0;vertical-align:top;">' +
                '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:10px;font-weight:600;letter-spacing:1.5px;color:#999999;text-transform:uppercase;">Location / City</p>' +
                '<p style="margin:4px 0 0;font-family:-apple-system,sans-serif;font-size:14px;color:#111111;">' + (p.location || '<span style="color:#aaaaaa;font-style:italic;">Not provided</span>') + '</p>' +
              '</td>' +
              '<td width="50%" style="padding:0 0 16px 16px;vertical-align:top;">' +
                '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:10px;font-weight:600;letter-spacing:1.5px;color:#999999;text-transform:uppercase;">GST Number</p>' +
                '<p style="margin:4px 0 0;font-family:-apple-system,sans-serif;font-size:14px;color:#111111;font-family:monospace;">' + (p.gst || '<span style="color:#aaaaaa;font-style:italic;font-family:-apple-system,sans-serif;">Not provided</span>') + '</p>' +
              '</td>' +
            '</tr>' +
          '</table>' +
        '</td></tr>' +

        (p.manufacture ? (
        '<tr><td style="background-color:#faf9f6;padding:0 32px 20px;">' +
          '<p style="margin:0 0 10px;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;color:#a93435;text-transform:uppercase;border-bottom:1px solid #e5e0d8;padding-bottom:8px;">Manufacturing Category</p>' +
          '<div style="display:inline-block;background-color:#111111;border-radius:4px;padding:10px 18px;">' +
            '<span style="font-family:-apple-system,sans-serif;font-size:14px;font-weight:600;color:#ffffff;letter-spacing:0.5px;">' + p.manufacture + '</span>' +
          '</div>' +
        '</td></tr>'
        ) : '') +

        (p.message ? (
        '<tr><td style="background-color:#faf9f6;padding:0 32px 24px;">' +
          '<p style="margin:0 0 10px;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;color:#a93435;text-transform:uppercase;border-bottom:1px solid #e5e0d8;padding-bottom:8px;">Project Details</p>' +
          '<div style="background-color:#ffffff;border:1px solid #e5e0d8;border-left:3px solid #a93435;border-radius:0 4px 4px 0;padding:14px 16px;">' +
            '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:14px;color:#333333;line-height:1.7;white-space:pre-wrap;">' + p.message + '</p>' +
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

        '<tr><td style="background-color:#111111;border-radius:0 0 8px 8px;padding:16px 32px;">' +
          '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
            '<td>' +
              '<p style="margin:0;font-family:-apple-system,sans-serif;font-size:11px;color:#a8a69e;">ROOTS Apparel Manufacturing · Bangalore, India</p>' +
              '<p style="margin:4px 0 0;font-family:-apple-system,sans-serif;font-size:11px;color:#555555;">Received ' + timestamp + ' IST · Saved to Google Sheet</p>' +
            '</td>' +
            '<td style="text-align:right;">' +
              '<p style="margin:0;font-family:Georgia,serif;font-size:18px;color:#a93435;font-style:italic;">Roots</p>' +
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
