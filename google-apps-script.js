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

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Inquiry saved successfully.'
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
