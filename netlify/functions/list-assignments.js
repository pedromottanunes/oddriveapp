const { ok, bad, cors, userFromContext, googleClients, sheetReadAll } = require("./_common");

exports.handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") { const res={}; cors(res); res.statusCode=204; return res; }
  const res = { setHeader:()=>{}, end: (b)=> (response.body=b), statusCode:200 };
  const response = { statusCode: 200, headers: { "Access-Control-Allow-Origin":"*" } };

  try {
    const user = userFromContext(context);
    if (!user) { response.statusCode = 401; response.body = "Unauthorized"; return response; }

    const { sheets } = await googleClients();
    const rows = await sheetReadAll(sheets, "Assignments!A1:F10000");
    const mine = rows.filter(r => (r.user_email||"").toLowerCase() === user.email.toLowerCase() && String(r.active).toLowerCase() !== "false");
    ok(response, { items: mine.map(m => ({ id: m.id, label: m.label, vehicle_plate: m.vehicle_plate, campaign_title: m.campaign_title })) });
    return response;
  } catch (e) {
    response.statusCode = 500; response.body = String(e.stack||e);
    return response;
  }
};