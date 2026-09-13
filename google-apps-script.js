/**
 * =========================================================================
 * ROOTS APPAREL MANUFACTURING — GOOGLE SHEETS FORM HANDLER
 * =========================================================================
 * 
 * INSTRUCTIONS FOR SETUP:
 * 1. Open Google Sheets (https://sheets.new) and name your sheet (e.g. "ROOTS Inquiries").
 * 2. In the top menu, click: Extensions > Apps Script.
 * 3. Delete any default code in Code.gs, paste this entire file, and click Save (disk icon).
 * 4. In the top right, click "Deploy" > "New deployment".
 * 5. Click the gear icon next to "Select type" and choose "Web app".
 * 6. Set the configuration options:
 *    - Description: ROOTS Contact Form
 *    - Execute as: Me (your Google account email)
 *    - Who has access: Anyone  <-- (IMPORTANT: Must be 'Anyone')
 * 7. Click "Deploy". Google will ask you to "Authorize access" (choose your Google account,
 *    click Advanced > Go to Untitled project (unsafe) > Allow).
 * 8. Copy the generated "Web app URL" (starts with https://script.google.com/macros/s/...).
 * 9. Paste that URL into js/main.js at: const GOOGLE_SHEET_URL = 'YOUR_COPIED_URL';
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 30 seconds for any concurrent submission to finish
  lock.tryLock(30000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getActiveSheet();

    // Auto-setup headers if the sheet is completely blank
    var headers = [
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

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#111111');
      headerRange.setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    var p = (e && e.parameter) ? e.parameter : {};
    if ((!p.name || !p.email) && e && e.postData && e.postData.contents) {
      try {
        var parsed = JSON.parse(e.postData.contents);
        if (parsed) p = parsed;
      } catch (err) {}
    }

    // Server-side honeypot spam protection
    if (p._hp_company && p._hp_company.toString().trim().length > 0) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Submission ignored (bot detected).'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Format Indian Standard Time (IST) or system timestamp
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

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

    sheet.appendRow(row);

    // Send instant email notification to midlaj2636@gmail.com
    try {
      var recipient = 'midlaj2636@gmail.com';
      var subject = 'New ROOTS Manufacturing Inquiry: ' + (p.company || p.name || 'Website Lead');

      var htmlBody = 
        '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 6px; overflow: hidden;">' +
          '<div style="background-color: #111111; color: #ffffff; padding: 18px 24px;">' +
            '<h2 style="margin: 0; font-size: 16px; letter-spacing: 1px; font-weight: 600;">ROOTS APPAREL MANUFACTURING</h2>' +
            '<p style="margin: 4px 0 0; font-size: 12px; color: #a8a69e;">New Website Contact Inquiry</p>' +
          '</div>' +
          '<div style="padding: 24px; background-color: #faf9f6;">' +
            '<table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.6;">' +
              '<tr><td style="padding: 6px 0; color: #666666; width: 150px; font-size: 12px;">TIME</td><td style="padding: 6px 0; color: #111111;">' + timestamp + '</td></tr>' +
              '<tr><td style="padding: 6px 0; color: #666666; font-size: 12px;">NAME</td><td style="padding: 6px 0; color: #111111; font-weight: 600;">' + (p.name || 'N/A') + '</td></tr>' +
              '<tr><td style="padding: 6px 0; color: #666666; font-size: 12px;">COMPANY / BRAND</td><td style="padding: 6px 0; color: #111111; font-weight: 600;">' + (p.company || 'N/A') + '</td></tr>' +
              '<tr><td style="padding: 6px 0; color: #666666; font-size: 12px;">EMAIL ADDRESS</td><td style="padding: 6px 0; color: #111111;"><a href="mailto:' + (p.email || '') + '" style="color: #a93435; text-decoration: none;">' + (p.email || 'N/A') + '</a></td></tr>' +
              '<tr><td style="padding: 6px 0; color: #666666; font-size: 12px;">PHONE NUMBER</td><td style="padding: 6px 0; color: #111111;">' + (p.phone ? '<a href="tel:' + p.phone + '" style="color: #111111; text-decoration: none;">' + p.phone + '</a>' : 'Not provided') + '</td></tr>' +
              '<tr><td style="padding: 6px 0; color: #666666; font-size: 12px;">LOCATION / CITY</td><td style="padding: 6px 0; color: #111111;">' + (p.location || 'Not provided') + '</td></tr>' +
              '<tr><td style="padding: 6px 0; color: #666666; font-size: 12px;">GST NUMBER</td><td style="padding: 6px 0; color: #111111;">' + (p.gst || 'Not provided') + '</td></tr>' +
              '<tr><td style="padding: 6px 0; color: #666666; font-size: 12px;">LOOKING TO MAKE</td><td style="padding: 6px 0; color: #a93435; font-weight: 600;">' + (p.manufacture || 'Not specified') + '</td></tr>' +
              '<tr><td style="padding: 8px 0 0; color: #666666; font-size: 12px; vertical-align: top;">PROJECT DETAILS</td><td style="padding: 8px 0 0; color: #111111; white-space: pre-wrap;">' + (p.message || 'None provided') + '</td></tr>' +
            '</table>' +
          '</div>' +
          '<div style="padding: 12px 24px; background-color: #f0ede6; font-size: 11px; color: #777777; border-top: 1px solid #e5e5e5;">' +
            '✓ Saved to Google Sheet • You can click "Reply" to email this customer directly.' +
          '</div>' +
        '</div>';

      MailApp.sendEmail({
        to: recipient,
        subject: subject,
        htmlBody: htmlBody,
        replyTo: p.email || undefined
      });
    } catch (mailErr) {
      console.error('Notification email could not be sent: ' + mailErr.toString());
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
