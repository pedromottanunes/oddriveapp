const { ok, bad, userFromContext, googleClients, sheetAppend } = require("./_common");
const { v4: uuidv4 } = require("uuid");

exports.handler = async (event, context) => {
  try {
    const user = userFromContext(context);
    if (!user) return bad("Unauthorized", 401);

    const { sheets } = await googleClients();
    const id = uuidv4();
    await sheetAppend(sheets, "Assignments!A1", [
      id,
      user.email,
      "ABC1D23 — Campanha Demo",
      "ABC1D23",
      "Campanha Demo",
      "TRUE",
      new Date().toISOString(),
    ]);

    return ok({ ok: true, id });
  } catch (e) {
    return bad(String(e.stack || e), 500);
  }
};
