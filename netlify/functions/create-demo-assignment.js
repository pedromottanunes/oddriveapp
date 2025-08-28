const { ok, bad, userFromContext, googleClients, sheetAppend } = require("./_common");
const { v4: uuidv4 } = require("uuid");
exports.handler = async (event, context) => {
  const response = { statusCode: 200, headers: { "Access-Control-Allow-Origin":"*" } };
  try {
    const user = userFromContext(context);
    if (!user) { response.statusCode = 401; response.body = "Unauthorized"; return response; }
    const { sheets } = await googleClients();
    const id = uuidv4();
    await sheetAppend(sheets, "Assignments!A1", [id, user.email, "ABC1D23 — Campanha Demo", "ABC1D23", "Campanha Demo", "TRUE", new Date().toISOString()]);
    ok(response, { ok:true, id });
    return response;
  } catch (e) { response.statusCode=500; response.body=String(e.stack||e); return response; }
};