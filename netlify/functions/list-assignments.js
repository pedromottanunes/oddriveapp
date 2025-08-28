const { ok, bad, preflight, userFromContext, googleClients, sheetReadAll } = require("./_common");

exports.handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") return preflight();
  try {
    const user = userFromContext(context);
    if (!user) return bad("Unauthorized", 401);

    const { sheets } = await googleClients();
    const rows = await sheetReadAll(sheets, "Assignments!A1:F10000");

    const mine = rows.filter(
      (r) =>
        (r.user_email || "").toLowerCase() === user.email.toLowerCase() &&
        String(r.active).toLowerCase() !== "false"
    );

    return ok({
      items: mine.map((m) => ({
        id: m.id,
        label: m.label,
        vehicle_plate: m.vehicle_plate,
        campaign_title: m.campaign_title,
      })),
    });
  } catch (e) {
    return bad(String(e.stack || e), 500);
  }
};
