require("dotenv").config({ path: ".env.server.local" });
console.log("[env] tenant:", process.env.AZ_TENANT_ID);
console.log("[env] clientId:", process.env.AZ_CLIENT_ID);
console.log("[env] secret set:", !!process.env.AZ_CLIENT_SECRET);
console.log("[env] group:", process.env.PBI_GROUP_ID);
console.log("[env] report:", process.env.PBI_REPORT_ID);

const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const fetch = require("node-fetch");
const { ConfidentialClientApplication } = require("@azure/msal-node");

// ----------------- APP -----------------
console.log("RUNNING FILE:", __filename);
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

// ----------------- DEMO AUTH CONSTANTS -----------------
const DEMO_EMAIL = "demo@hivemetrics.local";
const DEMO_PASSWORD_HASH = bcrypt.hashSync("letmein123", 10);
const JWT_SECRET = "dev-secret";
const REFRESH_SECRET = "dev-refresh-secret";

function signAccess(sub) {
  return jwt.sign({ sub }, JWT_SECRET, { expiresIn: "10m" });
}
function signRefresh(sub) {
  return jwt.sign({ sub }, REFRESH_SECRET, { expiresIn: "7d" });
}

// ----------------- GUARD -----------------
function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) {
    console.log("[guard] 401 no bearer");
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    const peek = jwt.decode(token) || {};
    console.log("[guard] peek:", { hasSub: !!peek.sub, exp: peek.exp, iat: peek.iat });
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    console.log("[guard] verify failed:", e && e.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ----------------- AUTH ROUTES -----------------
app.post("/api/auth/login", (req, res) => {
  const body = req.body || {};
  if (body.mode !== "demo") return res.status(400).json({ error: "demo-only in mock" });

  const okEmail = String(body.email || "").trim().toLowerCase() === DEMO_EMAIL;
  const okPw = bcrypt.compareSync(String(body.password || ""), DEMO_PASSWORD_HASH);
  console.log("[login] checks:", { okEmail, okPw });

  if (!okEmail || !okPw) return res.status(401).json({ error: "invalid" });

  const user = { id: "demo", name: "Demo User" };
  const accessToken = signAccess(user.id);
  const refreshToken = signRefresh(user.id);

  res.cookie("refresh", refreshToken, { httpOnly: true, sameSite: "lax", secure: false, path: "/" });
  res.json({ accessToken, user });
});



// just for by passing the guard for showing the graphs in microsoft login session remove when
//integrating with the power bi
app.post("/api/auth/msal-bridge", (req, res) => {

  const { sub, name } = req.body || {};
  const user = { id: sub || "msal", name: name || "Microsoft User" };
  const accessToken = signAccess(user.id);
  res.json({ accessToken, user });
});


app.post("/api/auth/refresh", (req, res) => {
  const token = req.cookies?.refresh;
  if (!token) return res.status(401).json({ error: "no refresh" });
  try {
    const payload = jwt.verify(token, REFRESH_SECRET);
    const accessToken = signAccess(payload.sub);
    res.json({ accessToken, user: { id: "demo", name: "Demo User" } });
  } catch {
    res.status(401).json({ error: "invalid refresh" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("refresh", { path: "/" });
  res.status(204).end();
});

// ----------------- METRICS (mock) -----------------
app.get("/api/metrics", requireAuth, (req, res) => {
  const { location = "all", range = "24h" } = req.query;
  const points = range === "7d" ? 7 * 24 : range === "30d" ? 30 * 24 : 24;

  const now = Date.now();
  const series = Array.from({ length: points }, (_, i) => {
    const ts = now - (points - 1 - i) * 60 * 60 * 1000;
    const bias = location === "library" ? 60 : location === "campus-b" ? 20 : 0;
    const base = 120 + bias + Math.round(40 * Math.sin(i / 3));
    const noise = Math.round(Math.random() * 12 - 6);
    return { ts, count: Math.max(0, base + noise) };
  });

  const current = series.at(-1).count;
  const prev = series.at(-2)?.count ?? current;
  const changePct = Number((((current - prev) / prev) * 100).toFixed(1));

  res.json({
    kpis: { activeLocations: 7, onlineNodes: 18, currentCount: current, changePct },
    series,
    heatmap: { rows: 3, cols: 4, grid: Array.from({ length: 12 }, () => Math.round(40 + Math.random() * 55)) },
  });
});

app.get("/example/protected", requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user, time: new Date().toISOString() });
});

// ----------------- POWER BI EMBED CONFIG -----------------
const {
  AZ_TENANT_ID,
  AZ_CLIENT_ID,
  AZ_CLIENT_SECRET,
  PBI_GROUP_ID,
  PBI_REPORT_ID,
} = process.env;

const cca = new ConfidentialClientApplication({
  auth: {
    clientId: AZ_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${AZ_TENANT_ID}`,
    clientSecret: AZ_CLIENT_SECRET,
  },
});

async function getAadTokenForPbi() {
  const res = await cca.acquireTokenByClientCredential({
    scopes: ["https://analysis.windows.net/powerbi/api/.default"],
  });
  if (!res || !res.accessToken) throw new Error("Failed to acquire AAD token");
  return res.accessToken;
}

app.get("/api/powerbi/embed-config", requireAuth, async (req, res) => {
  try {
    const groupId = req.query.groupId || PBI_GROUP_ID;
    const reportId = req.query.reportId || PBI_REPORT_ID;
    if (!groupId || !reportId) return res.status(400).json({ error: "Missing groupId or reportId" });

    const aad = await getAadTokenForPbi();

    const metaResp = await fetch(
      `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${reportId}`,
      { headers: { Authorization: `Bearer ${aad}` } }
    );
    if (!metaResp.ok) {
      return res.status(502).json({ error: "Failed meta", details: await metaResp.text() });
    }
    const meta = await metaResp.json();

    const genResp = await fetch(
      `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${reportId}/GenerateToken`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${aad}`, "Content-Type": "application/json" },
        body: JSON.stringify({ accessLevel: "View" }),
      }
    );
    if (!genResp.ok) {
      return res.status(502).json({ error: "Failed generate", details: await genResp.text() });
    }
    const gen = await genResp.json();

    res.json({
      reportId,
      groupId,
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

// ----------------- START SERVER -----------------
const PORT = 3000;
app.listen(PORT, () => console.log("Mock auth server on http://localhost:" + PORT));
