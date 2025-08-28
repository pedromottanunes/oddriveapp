const { google } = require("googleapis");

// ---------- respostas padrão ----------
const JSON_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};
const TEXT_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "text/plain",
};

const ok = (data) => ({
  statusCode: 200,
  headers: JSON_HEADERS,
  body: JSON.stringify(data),
});

const bad = (msg, code = 400) => ({
  statusCode: code,
  headers: TEXT_HEADERS,
  body: typeof msg === "string" ? msg : String(msg),
});

const preflight = () => ({
  statusCode: 204,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  },
});

// ---------- identidade do Netlify ----------
function userFromContext(context) {
  const u = context.clientContext && context.clientContext.user;
  return u ? { email: u.email, sub: u.sub } : null;
}

// ---------- clientes Google ----------
async function googleClients() {
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    undefined,
    (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\n/g, "\n"),
    [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ]
  );
  const sheets = google.sheets({ version: "v4", auth });
  const drive = google.drive({ version: "v3", auth });
  return { sheets, drive };
}

// ---------- utilitários Sheets/Drive ----------
async function sheetAppend(sheets, range, values) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [values] },
  });
}

async function sheetReadAll(sheets, range) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const r = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = r.data.values || [];
  if (rows.length === 0) return [];
  const header = rows[0];
  return rows.slice(1).map((r) => Object.fromEntries(header.map((k, i) => [k, r[i]])));
}

async function ensureFolder(drive, parentId, name) {
  const q =
    `name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and ` +
    `mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const list = await drive.files.list({ q, fields: "files(id,name)" });
  if (list.data.files && list.data.files.length) return list.data.files[0];
  const created = await drive.files.create({
    requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] },
    fields: "id,name",
  });
  return created.data;
}

async function uploadPhoto(drive, parentId, filename, contentType, buffer) {
  const file = await drive.files.create({
    requestBody: { name: filename, parents: [parentId] },
    media: { mimeType: contentType, body: buffer },
    fields: "id,name,webViewLink",
  });
  await drive.permissions.create({
    fileId: file.data.id,
    requestBody: { role: "reader", type: "anyone" },
  });
  const url = `https://drive.google.com/uc?export=view&id=${file.data.id}`;
  return { id: file.data.id, url };
}

module.exports = {
  ok,
  bad,
  preflight,
  userFromContext,
  googleClients,
  sheetAppend,
  sheetReadAll,
  ensureFolder,
  uploadPhoto,
};
