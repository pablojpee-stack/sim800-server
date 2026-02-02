const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
 
const app = express();
app.use(cors());
 
// ====== Config ======
const PORT = Number(process.env.PORT || 80);     // Usamos 80 para HTTP (SIM800 friendly)
const TOKEN = process.env.SECRET_TOKEN || "";    // Si se define, exige ?key=TOKEN
const FORWARD_NODE_RED = process.env.FORWARD_NODE_RED === "true";
const NODE_RED_URL = process.env.NODE_RED_URL || ""; // ej: http://TU_NODE_RED/estado
 
// ====== Estado en memoria ======
let last = null;              // { estado, ts }
const history = [];           // últimos N eventos
const MAX_HISTORY = 500;
// ====== Utils ======
function pushHistory(estado) {
  const item = { estado, ts: Date.now() };
  last = item;
  history.push(item);
  if (history.length > MAX_HISTORY) history.shift();
}
 
// ====== Rutas ======
 
// Salud
app.get("/health", (_req, res) => res.json({ ok: true, up: true, ts: Date.now() }));
 
// Último valor
app.get("/last", (_req, res) => {
  if (!last) return res.status(404).json({ ok: false, error: "sin_datos" });
  res.json({ ok: true, ...last });
});
 // Historial simple (máx N=100 por defecto)
app.get("/history", (req, res) => {
  const n = Math.min(Number(req.query.n || 100), 500);
  res.json({ ok: true, items: history.slice(-n) });
});
 
// Endpoint principal para el SIM800L: /estado?ac=0|1[&key=...]
app.get("/estado", async (req, res) => {
  try {
    const { ac, key } = req.query;
 
    // Validación de token (opcional)
    if (TOKEN && key !== TOKEN) {
      return res.status(401).json({ ok: false, error: "token_invalido" });
    }
 
    if (ac !== "0" && ac !== "1") {
      return res.status(400).json({ ok: false, error: "parametro_ac_requerido_0_1" });
    }
 pushHistory(ac);
 
    // Reenvío opcional a Node-RED u otro endpoint interno/externo
    if (FORWARD_NODE_RED && NODE_RED_URL) {
      try {
        await axios.get(`${NODE_RED_URL}?ac=${ac}`, { timeout: 4000 });
      } catch (e) {
        // No detenemos la respuesta al cliente por un fallo de reenvío
        console.error("Reenvio Node-RED fallo:", e.message);
      }
    }
 
    res.json({ ok: true, estado: ac, ts: Date.now() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});
 app.listen(PORT, () => {
  console.log(`SIM800 server escuchando en puerto ${PORT}`);
  console.log(`Usa:  GET /estado?ac=0|1${TOKEN ? "&key=TU_TOKEN" : ""}`);
  console.log(`Salud: GET /health   | Último: GET /last   | Historial: GET /history?n=50`);
});
 
