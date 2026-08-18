/*
  الأمير براند - Google Apps Script
  يدعم إضافة المنتجات وتعديلها حسب عمود id.

  طريقة الاستخدام:
  1) افتح Google Sheet > Extensions > Apps Script.
  2) استبدل الكود القديم بهذا الكود بالكامل.
  3) Deploy > Manage deployments > Edit > New version > Deploy.
  4) اترك نفس رابط Web App في admin.html إذا كنت تعدّل نفس Deployment.
*/

function doGet() {
  return jsonResponse({
    success: true,
    message: 'Alameer Products API is working',
    supports: ['add', 'update']
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    if (!e || !e.parameter) {
      throw new Error('No request data received');
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const lastColumn = sheet.getLastColumn();
    if (lastColumn < 1) throw new Error('Sheet has no headers');

    const headers = sheet
      .getRange(1, 1, 1, lastColumn)
      .getValues()[0]
      .map(h => String(h).trim());

    const headerIndex = {};
    headers.forEach((h, i) => {
      if (h) headerIndex[h.toLowerCase()] = i;
    });

    if (headerIndex.id === undefined) {
      throw new Error('Missing required id column');
    }

    const params = e.parameter;
    const action = String(params.action || 'add').trim().toLowerCase();

    if (action === 'update') {
      return updateProduct_(sheet, headers, headerIndex, params);
    }

    return addProduct_(sheet, headers, headerIndex, params);
  } catch (err) {
    return jsonResponse({
      success: false,
      error: String(err && err.message ? err.message : err)
    });
  } finally {
    lock.releaseLock();
  }
}

function addProduct_(sheet, headers, headerIndex, params) {
  const row = new Array(headers.length).fill('');
  const id = String(params.id || '').trim() || generateProductId_();

  row[headerIndex.id] = id;

  Object.keys(params).forEach(key => {
    const normalizedKey = String(key).trim().toLowerCase();
    if (normalizedKey === 'action' || normalizedKey === 'id') return;
    if (headerIndex[normalizedKey] !== undefined) {
      row[headerIndex[normalizedKey]] = params[key];
    }
  });

  sheet.appendRow(row);
  SpreadsheetApp.flush();

  return jsonResponse({
    success: true,
    action: 'add',
    id: id,
    row: sheet.getLastRow()
  });
}

function updateProduct_(sheet, headers, headerIndex, params) {
  const id = String(params.id || '').trim();
  if (!id) throw new Error('Missing product id');

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('No products found');

  const idColumn = headerIndex.id + 1;
  const ids = sheet
    .getRange(2, idColumn, lastRow - 1, 1)
    .getDisplayValues();

  let targetRow = -1;
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === id) {
      targetRow = i + 2;
      break;
    }
  }

  if (targetRow === -1) {
    throw new Error('Product id not found: ' + id);
  }

  const range = sheet.getRange(targetRow, 1, 1, headers.length);
  const row = range.getValues()[0];

  Object.keys(params).forEach(key => {
    const normalizedKey = String(key).trim().toLowerCase();
    if (normalizedKey === 'action' || normalizedKey === 'id') return;
    if (headerIndex[normalizedKey] !== undefined) {
      row[headerIndex[normalizedKey]] = params[key];
    }
  });

  row[headerIndex.id] = id;
  range.setValues([row]);
  SpreadsheetApp.flush();

  return jsonResponse({
    success: true,
    action: 'update',
    id: id,
    row: targetRow
  });
}

function generateProductId_() {
  return 'P' + Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || 'Asia/Baghdad',
    'yyyyMMddHHmmssSSS'
  );
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
