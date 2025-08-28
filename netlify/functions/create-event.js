const { ok, bad, userFromContext, googleClients, sheetAppend, ensureFolder, uploadPhoto } = require("./_common");
const { v4: uuidv4 } = require("uuid");

exports.handler = async (event, context) => {
  const response = { statusCode: 200, headers: { "Access-Control-Allow-Origin":"*" } };
  try {
    if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"Content-Type, Authorization", "Access-Control-Allow-Methods":"GET,POST,OPTIONS" } };
    if (event.httpMethod !== "POST") { response.statusCode=405; response.body="Method Not Allowed"; return response; }

    const user = userFromContext(context);
    if (!user) { response.statusCode=401; response.body="Unauthorized"; return response; }

    const body = JSON.parse(event.body || "{}");
    const { assignment_id, vehicle_plate, type, km, lat, lng, notes, photos } = body;
    if (!assignment_id || !vehicle_plate || !type) { response.statusCode=400; response.body="Dados obrigatórios ausentes"; return response; }

    const { sheets, drive } = await googleClients();

    // pastas
    const parentId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
    if (!parentId) { response.statusCode=500; response.body="Falta GOOGLE_DRIVE_PARENT_FOLDER_ID"; return response; }
    const vehicleFolder = await ensureFolder(drive, parentId, vehicle_plate);
    const eventId = uuidv4();
    const eventFolder = await ensureFolder(drive, vehicleFolder.id, eventId);

    // linha do Events
    await sheetAppend(sheets, "Events!A1", [
      eventId, user.email, "driver", assignment_id, vehicle_plate, type, km||"", lat||"", lng||"", notes||"", new Date().toISOString(), eventFolder.id
    ]);

    // fotos
    const out = [];
    for (const ph of (photos||[])) {
      const [meta, b64] = String(ph.dataUrl||"").split(",");
      if (!b64) continue;
      const mime = (meta||"").split(":")[1]?.split(";")[0] || "image/jpeg";
      const buf = Buffer.from(b64, "base64");
      const filename = `${ph.angle||"foto"}-${Date.now()}.jpg`;
      const { id:fileId, url } = await uploadPhoto(drive, eventFolder.id, filename, mime, buf);
      await sheetAppend(sheets, "Photos!A1", [eventId, ph.angle||"", fileId, url, new Date().toISOString()]);
      out.push({ angle: ph.angle, fileId, url });
    }

    ok(response, { ok:true, event_id:eventId, folder_id:eventFolder.id, photos: out });
    return response;
  } catch (e) {
    response.statusCode=500; response.body=String(e.stack||e); return response;
  }
};