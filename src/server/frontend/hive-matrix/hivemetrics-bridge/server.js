
import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fetch from "node-fetch";
import { ConfidentialClientApplication } from "@azure/msal-node";


/*  env & app */
const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "dynamicpopulationdensity_db";
const port = Number(process.env.PORT || 8080);

const app = express();
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
}));


app.set("etag", false);


//registering cookie middleware
app.use(express.json());
app.use(cookieParser());

/*  DB connector  */
let db = null;
async function getDb() {
  if (db) return db;
  const client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  return db;
}

/*  helpers  */
function signAccess(sub) {
  return jwt.sign({ sub }, JWT_SECRET, { expiresIn: "10m" });
}

function signRefresh(sub) {
  return jwt.sign({ sub }, REFRESH_SECRET, { expiresIn: "7d" });
}

function isValidIPv4(s = "") {
  return /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(s);
}
function isValidMac(s = "") {
  return /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(s);
}
function isNonEmpty(s) {
  return typeof s === "string" && s.trim().length > 0;
}

/*  ensure indexes (run once)  */
(async () => {
  try {
    const d = await getDb();
    const nodes = d.collection("nodes");

    await nodes.createIndex({ name: 1 }, { unique: true, sparse: true });
    await nodes.createIndex({ mac_address: 1 }, { unique: true, sparse: true });
    await nodes.createIndex({ ip_address: 1 }, { unique: true, sparse: true });

    // Enforce 1:1 (one node per location)
    await nodes.createIndex(
      { location_id: 1 },
      {
        unique: true,
        partialFilterExpression: { location_id: { $type: "objectId" } },
        name: "uniq_node_per_location",
      }
    );

    // Speed up status lookups
    await d.collection("nodeEvents").createIndex({ node_id: 1, date_time: -1 });
    await d.collection("attendanceHistory").createIndex({ node_id: 1, date_time: -1 });

    // Unique location identity (name+building+level+room)
    await d.collection("locations").createIndex(
      { name: 1, building: 1, level: 1, room: 1 },
      { unique: true, sparse: true, name: "uniq_location_identity" }
    );

    console.log("[indexes] ensured");
  } catch (e) {
    console.warn("[indexes] skipped:", e?.message || e);
  }
})();


// AUTH (demo + msal-bridge)
const DEMO_EMAIL = "demo@hivemetrics.local";
const DEMO_PASSWORD_HASH = bcrypt.hashSync("letmein123", 10); // change later
const JWT_SECRET = process.env.JWT_SECRET || "426bffea8c19d2101f49ca9189d6029c7cbb59e44ed5cc32b8adf055cc456fd30b163de171ce3fd261cdcda612b5125bd615b0c3052f81f95a71388fa07608e0";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "d7d91b9c7303ebb7ba0fb18b66263e333d12b6d233538dd6af697b26bee00ccc8cc8c70cd8c4ec6993e3bcf24be123601e7d4cbf76ca5ffccf3a4346bd0f9b97";



function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: "Invalid or expired token" }); }
}

app.get("/", (_req, res) => {
  res.json({ status: "hivemetrics-bridge API", version: "1.0.0" });

})



// Demo email/password sign-in
app.post("/v1/auth/login", (req, res) => {
  const { mode, email, password } = req.body || {};
  if (mode !== "demo") return res.status(400).json({ error: "demo-only" });
  const okEmail = String(email || "").trim().toLowerCase() === DEMO_EMAIL;
  const okPw = bcrypt.compareSync(String(password || ""), DEMO_PASSWORD_HASH);
  if (!okEmail || !okPw) return res.status(401).json({ error: "invalid" });

  const userId = "demo";
  const accessToken = signAccess(userId);
  const refreshToken = signRefresh(userId);


  res.cookie("refresh", refreshToken, {
  httpOnly: true,
  secure: false, // set to true in production
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
  res.json({
    accessToken,
    user: { id: userId, name: "Demo User" }
});
});



// refresh route
app.post("/v1/auth/refresh", (req, res) => {
  const refreshToken = req.cookies?.refresh;
  if (!refreshToken) {
    console.log("[auth] no refresh token in cookies");
    return res.status(401).json({ error: "no refresh token" });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    console.log("[auth] refresh token valid for user:", payload.sub);

    const accessToken = signAccess(payload.sub);
    res.json({
      accessToken,
      user: { id: payload.sub === "demo" ? "Demo User" : "Microsoft User" },
    });
  } catch (err){
    console.log("[auth] invalid refresh token:", err?.message );
    res.clearCookie("refresh", {
      httpOnly: true,
      secure: false, // set to true in production
      sameSite: "lax",
      path: "/"
  });
    return res.status(401).json({ error: "invalid refresh token" });
  }
});





// SPA posts here after MSAL to mint local JWT used by /v1 + PowerBI
app.post("/v1/auth/msal-bridge", (req, res) => {
  const { sub, name } = req.body || {};
  if (!sub) return res.status(400).json({ error: "missing sub" });
  const user = { id: sub, name: name || "Microsoft User" };
  const accessToken = signAccess(user.id);
  res.json({ accessToken, user });
});

app.post("/v1/auth/refresh", (req, res) => {
  const token = req.cookies?.refresh;
  if (!token) return res.status(401).json({ error: "no refresh" });
  try {
    const payload = jwt.verify(token, REFRESH_SECRET);
    const accessToken = signAccess(payload.sub);
    res.json({
      accessToken,
      user: { id: payload.sub, name: payload.sub === "demo" ? "Demo User" : "Microsoft User" },
    });
  } catch {
    res.status(401).json({ error: "invalid refresh" });
  }
});

// logout route
app.post("/v1/auth/logout", (req, res) => {
  res.clearCookie("refresh", {
    path: "/",
    httpOnly: true,
    secure: false, // set to true in production
    sameSite: "lax"
  });
  res.status(200).json({ message: "Logged out successfully" });
});


// POWER BI EMBED
const {
  AZ_TENANT_ID, AZ_CLIENT_ID, AZ_CLIENT_SECRET,
  PBI_GROUP_ID, PBI_REPORT_ID,
} = process.env;

const hasPbi = !!AZ_TENANT_ID && !!AZ_CLIENT_ID && !!AZ_CLIENT_SECRET && !!PBI_GROUP_ID && !!PBI_REPORT_ID;

const cca = hasPbi ? new ConfidentialClientApplication({
  auth: {
    clientId: AZ_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${AZ_TENANT_ID}`,
    clientSecret: AZ_CLIENT_SECRET,
  },
}) : null;

async function getAadTokenForPbi(){
  if (!cca) throw new Error("Power BI not configured");
  const res = await cca.acquireTokenByClientCredential({ scopes: ["https://analysis.windows.net/powerbi/api/.default"] });
  if (!res?.accessToken) throw new Error("Failed to acquire AAD token");
  return res.accessToken;
}


app.get("/v1/powerbi/embed-config", requireAuth, async (req, res) => {
  try {
    if (!cca) {
      return res.status(501).json({
        error: "Power BI not configured",
        hint: "Set AZ_TENANT_ID, AZ_CLIENT_ID, AZ_CLIENT_SECRET, PBI_GROUP_ID, PBI_REPORT_ID",
      });
    }
    const groupId = String(req.query.groupId || PBI_GROUP_ID);
    const reportId = String(req.query.reportId || PBI_REPORT_ID);
    const aad = await getAadTokenForPbi();

    const metaResp = await fetch(`https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${reportId}`, {
      headers: { Authorization: `Bearer ${aad}` },
    });
    if (!metaResp.ok) return res.status(502).json({ error: "Failed meta", details: await metaResp.text() });
    const meta = await metaResp.json();

    const genResp = await fetch(`https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${reportId}/GenerateToken`, {
      method: "POST",
      headers: { Authorization: `Bearer ${aad}`, "Content-Type": "application/json" },
      body: JSON.stringify({ accessLevel: "View" }),
    });
    if (!genResp.ok) return res.status(502).json({ error: "Failed generate", details: await genResp.text() });
    const gen = await genResp.json();

    res.json({
      reportId, groupId,
      embedUrl: meta.embedUrl,
      accessToken: gen.token,
      tokenType: "Embed",
      expiresIn: 3600,
    });
  } catch (e) {
    console.error("[powerbi] embed-config error:", e?.message || e);
    res.status(500).json({ error: "Power BI embed-config failed" });
  }
});


app.use("/v1/auth", (req, _res, next) => {
  req.url = "/v1/auth" + (req.url || "");
  next();
});









/*  routes  */

// health
app.get("/v1/health", async (_req, res) => {
  try {
    const d = await getDb();
    const colls = await d.listCollections().toArray();
    res.json({ status: "ok", db: dbName, collections: colls.map((c) => c.name) });
  } catch (e) {
    console.error("[health] error:", e);
    res.status(500).json({ status: "error", message: String(e?.message || e) });
  }
});

/*  Locations  */
app.post("/v1/locations", async (req, res) => {
  try {
    const d = await getDb();
    const col = d.collection("locations");
    const { name, building, level, room } = req.body || {};
    if (!isNonEmpty(name)) return res.status(400).json({ error: "name is required" });

    const doc = {
      name: name.trim(),
      building: building?.trim() || null,
      level: isNonEmpty(level) ? level : level ?? null,
      room: room?.trim() || null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    try {
      const r = await col.insertOne(doc);
      const created = await col.findOne(
        { _id: r.insertedId },
        { projection: { name: 1, building: 1, level: 1, room: 1 } }
      );
      return res.status(201).json(created);
    } catch (e) {
      if (e?.code === 11000) {
        const existing = await col.findOne(
          { name: doc.name, building: doc.building, level: doc.level, room: doc.room },
          { projection: { name: 1, building: 1, level: 1, room: 1 } }
        );
        return res.status(200).json(existing); // idempotent
      }
      throw e;
    }
  } catch (e) {
    console.error("[POST /v1/locations] error:", e);
    res.status(500).json({ error: "internal error" });
  }
});

// list locations
app.get("/v1/locations/all", async (_req, res) => {
  try {
    const d = await getDb();
    const items = await d
      .collection("locations")
      .find({}, { projection: { name: 1, building: 1, level: 1, room: 1 } })
      .sort({ name: 1 })
      .toArray();
    res.json(items);
  } catch (e) {
    console.error("[/v1/locations/all] error:", e);
    res.status(500).json({ error: "internal error" });
  }
});

/*  Nodes  */
// create
app.post("/v1/nodes", async (req, res) => {
  try {
    const d = await getDb();
    const nodes = d.collection("nodes");
    const { name, ip_address, mac_address, model, brand, location_id, location } = req.body || {};

    if (!name?.trim()) return res.status(400).json({ error: "name is required" });
    if (!isValidIPv4(ip_address)) return res.status(400).json({ error: "invalid ip_address" });
    if (!isValidMac(mac_address)) return res.status(400).json({ error: "invalid mac_address (AA:BB:...)" });

    const upperMac = String(mac_address).toUpperCase().trim();

    //  resolve location
    let locId = null;

    if (location_id) {
      try {
        locId = new ObjectId(String(location_id));
      } catch {
        return res.status(400).json({ error: "location_id must be ObjectId" });
      }
      const exists = await d.collection("locations")
        .findOne({ _id: locId }, { projection: { _id: 1 } });
      if (!exists) return res.status(400).json({ error: "location_id not found" });
    } else if (location && typeof location === "object") {
      const { name: lname, building, level, room } = location;
      if (!isNonEmpty(lname)) return res.status(400).json({ error: "location.name is required" });

      const locDoc = {
        name: String(lname).trim(),
        building: building?.trim?.() || null,
        level: (level ?? null),
        room: room?.trim?.() || null,
      };

      try {
        const r = await d.collection("locations")
          .insertOne({ ...locDoc, created_at: new Date(), updated_at: new Date() });
        locId = r.insertedId;
      } catch (e) {
        if (e?.code === 11000) {
          const existing = await d.collection("locations")
            .findOne(locDoc, { projection: { _id: 1 } });
          locId = existing?._id || null;
        } else {
          throw e;
        }
      }
    }

    //  enforce 1:1 location and node
    if (locId) {
      const used = await nodes.findOne(
        { location_id: locId },
        { projection: { _id: 1, name: 1 } }
      );
      if (used) {
        return res.status(409).json({ error: `location already assigned to node "${used.name}"` });
      }
    }

    const preDup = await nodes.findOne(
      {
        $or: [
          { name: name.trim() },
          { ip_address: String(ip_address).trim() },
          { mac_address: upperMac },
        ],
      },
      { projection: { name: 1, ip_address: 1, mac_address: 1 } }
    );
    if (preDup) {
      if (preDup.name === name.trim()) return res.status(409).json({ error: "name already exists" });
      if (preDup.ip_address === String(ip_address).trim()) return res.status(409).json({ error: "ip_address already exists" });
      if (preDup.mac_address === upperMac) return res.status(409).json({ error: "mac_address already exists" });
      return res.status(409).json({ error: "duplicate node" });
    }


    const doc = {
      name: String(name).trim(),
      ip_address: String(ip_address).trim(),
      mac_address: upperMac,
      model: (typeof model === "string" && model.trim()) ? model.trim() : null,
      brand: (typeof brand === "string" && brand.trim()) ? brand.trim() : null,

      is_poe_compatible: Boolean(req.body?.is_poe_compatible ?? false),
      is_wireless_connectivity: Boolean(req.body?.is_wireless_connectivity ?? false),
      ram_size: Number(
        req.body?.ram_size !== undefined && req.body?.ram_size !== null
          ? req.body.ram_size
          : 0
      ),
      ram_unit: (typeof req.body?.ram_unit === "string" && req.body.ram_unit.trim())
        ? req.body.ram_unit.trim()
        : "MB",
      storage_size: Number(
        req.body?.storage_size !== undefined && req.body?.storage_size !== null
          ? req.body.storage_size
          : 0
      ),
      storage_unit: (typeof req.body?.storage_unit === "string" && req.body.storage_unit.trim())
        ? req.body.storage_unit.trim()
        : "GB",
      storage_type: (typeof req.body?.storage_type === "string" && req.body.storage_type.trim())
        ? req.body.storage_type.trim()
        : "microSD",

      location_id: locId ?? null,

      created_at: new Date(),
      updated_at: new Date(),
    };

    const r = await nodes.insertOne(doc);
    const created = await nodes.findOne(
      { _id: r.insertedId },
      { projection: { name:1, ip_address:1, mac_address:1, model:1, brand:1, location_id:1 } }
    );
    res.status(201).json(created);

  } catch (e) {
    if (e?.code === 11000) {
      const k = Object.keys(e.keyPattern || e.keyValue || {})[0] || "field";
      return res.status(409).json({ error: `${k} already exists`, code: e.code });
    }
    const details = e?.errInfo?.details || e?.errInfo || e?.errorResponse?.details;
    if (e?.code === 121 && details) {
      console.error("[validator]", JSON.stringify(details, null, 2));
    }
    console.error("[POST /v1/nodes] error:", e);
    res.status(500).json({
      error: "internal error",
      code: e?.code ?? null,
      detail: e?.message || String(e),
    });
  }
});



app.patch("/v1/nodes/:id", async (req, res) => {
  try {
    const d = await getDb();
    const col = d.collection("nodes");
    const _id = new ObjectId(String(req.params.id));

    const { name, ip_address, mac_address, model, brand, location_id, location } = req.body || {};
    const $set = { updated_at: new Date() };

    if (typeof name === "string" && name.trim()) $set.name = name.trim();
    if (typeof model === "string") $set.model = model.trim() || null;
    if (typeof brand === "string") $set.brand = brand.trim() || null;

    if (typeof ip_address === "string") {
      if (!isValidIPv4(ip_address)) return res.status(400).json({ error: "invalid ip_address" });
      $set.ip_address = ip_address.trim();
    }
    if (typeof mac_address === "string") {
      if (!isValidMac(mac_address)) return res.status(400).json({ error: "invalid mac_address (AA:BB:...)" });
      $set.mac_address = mac_address.toUpperCase();
    }

    let locId = null;
    if (location_id) {
      try {
        locId = new ObjectId(String(location_id));
      } catch {
        return res.status(400).json({ error: "location_id must be ObjectId" });
      }
      const exists = await d.collection("locations").findOne({ _id: locId }, { projection: { _id: 1 } });
      if (!exists) return res.status(400).json({ error: "location_id not found" });
    } else if (location && typeof location === "object") {
      const { name: lname, building, level, room } = location;
      if (!isNonEmpty(lname)) return res.status(400).json({ error: "location.name is required" });
      const locDoc = {
        name: lname.trim(),
        building: building?.trim() || null,
        level: isNonEmpty(level) ? level : level ?? null,
        room: room?.trim() || null,
      };
      try {
        const r = await d.collection("locations").insertOne({
          ...locDoc,
          created_at: new Date(),
          updated_at: new Date(),
        });
        locId = r.insertedId;
      } catch (e) {
        if (e?.code === 11000) {
          const existing = await d.collection("locations").findOne(locDoc, { projection: { _id: 1 } });
          locId = existing?._id || null;
        } else {
          throw e;
        }
      }
    }

    if (locId) {
      const used = await d
        .collection("nodes")
        .findOne({ _id: { $ne: _id }, location_id: locId }, { projection: { _id: 1, name: 1 } });
      if (used) return res.status(409).json({ error: `location already assigned to node "${used.name}"` });
      $set.location_id = locId;
    }

    const r = await col.findOneAndUpdate(
      { _id },
      { $set },
      {
        returnDocument: "after",
        projection: { name: 1, ip_address: 1, mac_address: 1, model: 1, brand: 1, location_id: 1, status: 1 },
      }
    );
    if (!r?.value) return res.status(404).json({ error: "node not found" });
    res.json(r.value);
  } catch (e) {
    if (e?.code === 11000) {
      const k = Object.keys(e.keyPattern || e.keyValue || {})[0] || "field";
      return res.status(409).json({ error: `${k} already exists` });
    }
    console.error("[PATCH /v1/nodes/:id] error:", e);
    res.status(500).json({ error: "internal error" });
  }
});

// delete
app.delete("/v1/nodes/:id", async (req, res) => {
  try {
    const d = await getDb();
    const _id = new ObjectId(String(req.params.id));
    const r = await d.collection("nodes").deleteOne({ _id });
    if (r.deletedCount === 0) return res.status(404).json({ error: "node not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /v1/nodes/:id] error:", e);
    res.status(400).json({ error: "bad id or internal error" });
  }
});

//delete location
app.delete("/v1/locations/:id", async (req, res) => {
  try {
    const d = await getDb();
    const col = d.collection("locations");

    // Convert string ID to ObjectId
    const _id = new ObjectId(String(req.params.id));

    // Check if location exists
    const location = await col.findOne({ _id });
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    // Check if location is assigned to any nodes
    const nodeWithLocation = await d.collection("nodes").findOne({ location_id: _id });
    if (nodeWithLocation) {
      return res.status(409).json({
        error: "Location cannot be deleted - assigned to node",
        nodeId: nodeWithLocation._id,
        nodeName: nodeWithLocation.name
      });
    }

    // Delete the location
    const result = await col.deleteOne({ _id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.status(204).end();
  } catch (e) {
    console.error("[DELETE /v1/locations/:id] error:", e);
    if (e.name === "BSONTypeError") {
      return res.status(400).json({ error: "Invalid location ID format" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});
// count
app.get("/v1/nodes/count", async (_req, res) => {
  try {
    const d = await getDb();
    const count = await d.collection("nodes").estimatedDocumentCount();
    res.json({ count });
  } catch (e) {
    console.error("[/v1/nodes/count] error:", e);
    res.status(500).json({ error: "internal error" });
  }
});

// summary help to find online status
app.get("/v1/nodes/summary", async (_req, res) => {
  try {
    const d = await getDb();
    const TEN_MIN = 10;

    const rows = await d
      .collection("nodes")
      .aggregate([
        {
          $lookup: {
            from: "nodeEvents",
            let: { nid: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$node_id", "$$nid"] } } },
              { $sort: { date_time: -1 } },
              { $limit: 1 },
              { $project: { _id: 0, dt: "$date_time" } },
            ],
            as: "ev",
          },
        },
        {
          $lookup: {
            from: "attendanceHistory",
            let: { nid: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$node_id", "$$nid"] } } },
              { $sort: { date_time: -1 } },
              { $limit: 1 },
              { $project: { _id: 0, dt: "$date_time" } },
            ],
            as: "att",
          },
        },
        { $addFields: { last_ev: { $arrayElemAt: ["$ev.dt", 0] }, last_att: { $arrayElemAt: ["$att.dt", 0] } } },
        { $addFields: { last_seen: { $cond: [{ $gt: ["$last_ev", "$last_att"] }, "$last_ev", "$last_att"] } } },
        {
          $project: {
            isOnline: {
              $and: [
                { $ne: ["$last_seen", null] },
                { $lte: [{ $dateDiff: { startDate: "$last_seen", endDate: "$$NOW", unit: "minute" } }, TEN_MIN] },
              ],
            },
          },
        },
        { $group: { _id: null, total: { $sum: 1 }, online: { $sum: { $cond: ["$isOnline", 1, 0] } } } },
        {
          $project: {
            _id: 0,
            total: 1,
            online: 1,
            offline: { $subtract: ["$total", "$online"] },
            windowMin: { $literal: TEN_MIN },
          },
        },
      ])
      .toArray();

    res.json(rows[0] || { total: 0, online: 0, offline: 0, windowMin: TEN_MIN });
  } catch (e) {
    console.error("[/v1/nodes/summary] error:", e);
    res.status(500).json({ error: "internal error" });
  }
});

// list with computed status/last_seen
app.get("/v1/nodes/all", async (_req, res) => {
  try {
    const d = await getDb();
    const TEN_MIN = 10;

    const items = await d
      .collection("nodes")
      .aggregate([
        {
          $lookup: {
            from: "nodeEvents",
            let: { nid: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$node_id", "$$nid"] } } },
              { $sort: { date_time: -1 } },
              { $limit: 1 },
              { $project: { _id: 0, lastSeenEvents: "$date_time" } },
            ],
            as: "ev",
          },
        },
        {
          $lookup: {
            from: "attendanceHistory",
            let: { nid: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$node_id", "$$nid"] } } },
              { $sort: { date_time: -1 } },
              { $limit: 1 },
              { $project: { _id: 0, lastSeenAttendance: "$date_time" } },
            ],
            as: "att",
          },
        },
        { $addFields: { last_seen_events: { $arrayElemAt: ["$ev.lastSeenEvents", 0] }, last_seen_att: { $arrayElemAt: ["$att.lastSeenAttendance", 0] } } },
        { $addFields: { last_seen: { $cond: [{ $gt: ["$last_seen_events", "$last_seen_att"] }, "$last_seen_events", "$last_seen_att"] } } },
        {
          $addFields: {
            status: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$last_seen", null] },
                    { $lte: [{ $dateDiff: { startDate: "$last_seen", endDate: "$$NOW", unit: "minute" } }, TEN_MIN] },
                  ],
                },
                "online",
                "offline",
              ],
            },
          },
        },
        {
          $project: {
            name: 1,
            ip_address: 1,
            mac_address: 1,
            model: 1,
            brand: 1,
            ram_size: 1,
            ram_unit: 1,
            storage_size: 1,
            storage_unit: 1,
            storage_type: 1,
            is_poe_compatible: 1,
            is_wireless_connectivity: 1,
            location_id: 1,
            status: 1,
            last_seen: 1,
          },
        },
        { $sort: { name: 1 } },
      ])
      .toArray();

    res.json(items);
  } catch (e) {
    console.error("[/v1/nodes/all] error:", e);
    res.status(500).json({ error: "internal error" });
  }
});

app.listen(port, () => {
  console.log(`Bridge API on http://localhost:${port}/v1`);
});

