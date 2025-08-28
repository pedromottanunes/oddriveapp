const { ok, bad, preflight, userFromContext, googleClients, sheetAppend, ensureFolder, uploadPhoto } = require("./_common");
const { v4: uuidv4 } = require("uuid");

exports.handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") return preflight();
  if (event.httpMethod !== "POST") return bad("Method Not Allowed", 405);

  try {
    const user = userFromContext(context);
    if (!user) return bad("Unauthorized", 401);

    const body = JSON.parse(event.body || "{}");
    const { assignment_id, vehicle_plate, type, km, lat, lng, notes, photos } = body;
    if (!assignment_id || !vehicle_plate || !type) return bad("Dados obrigatórios ausentes", 400);

    const { sheets, drive } = await googleClients();
    const parentId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
    if (!parentId) return bad("Falta GOOGLE_DRIVE_PARENT_FOLDER_ID", 500);

    const vehicleFolder = await ensureFolder(drive, parentId, vehicle_plate);
    const eventId = uuidv4();
    const eventFolder = await ensureFolder(drive, vehicleFolder.id, eventId);

    await sheetAppend(sheets, "Events!A1", [
      eventId,
      user.email,
      "driver",
      assignment_id,
      vehicle_plate,
      type,
      km || "",
      lat || "",
      lng || "",
      notes || "",
      new Date().toISOString(),
      eventFolder.id,
    ]);

    const uploaded = [];
    for (const ph of photos || []) {
      const [meta, b64] = String(ph.dataUrl || "").split(",");
      if (!b64) continue;
      const mime = (meta || "").split(":")[1]?.split(";")[0] || "image/jpeg";
      const buf = Buffer.from(b64, "base64");
      const filename = `${ph.angle || "foto"}-${Date.now()}.jpg`;
      const { id: fileId, url } = await uploadPhoto(drive, eventFolder.id, filename, mime, buf);
      await sheetAppend(sheets, "Photos!A1", [eventId, ph.angle || "", fileId, url, new Date().toISOString()]);
      uploaded.push({ angle: ph.angle, fileId, url });
    }

    return ok({ ok: true, event_id: eventId, folder_id: eventFolder.id, photos: uploaded });
  } catch (e) {
    return bad(String(e.stack || e), 500);
  }
};
