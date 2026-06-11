import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import express from "express";
import pino from "pino";
import QRCode from "qrcode";

const port = Number(process.env.PORT || 3001);
const authDir = process.env.BAILEYS_AUTH_DIR || "./auth";
const logger = pino({ level: process.env.LOG_LEVEL || "info" });

let socket;
let connectionStatus = "starting";
let lastQr = null;
let lastQrDataUrl = null;

function normalizeBrazilPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) {
    throw new Error("destination phone is required");
  }
  const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;
  return `${withCountryCode}@s.whatsapp.net`;
}

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  socket = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    logger: logger.child({ module: "baileys" }),
    browser: ["Bolao IA Lab", "Chrome", "1.0.0"],
  });

  socket.ev.on("creds.update", saveCreds);
  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      lastQr = qr;
      lastQrDataUrl = await QRCode.toDataURL(qr);
      connectionStatus = "qr";
      logger.info("New WhatsApp QR code generated");
    }

    if (connection === "open") {
      connectionStatus = "connected";
      lastQr = null;
      lastQrDataUrl = null;
      logger.info("WhatsApp connected");
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      connectionStatus = "disconnected";
      logger.warn({ statusCode }, "WhatsApp disconnected");

      if (statusCode !== DisconnectReason.loggedOut) {
        setTimeout(connect, 3000);
      }
    }
  });
}

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", connection: connectionStatus });
});

app.get("/session/status", (_req, res) => {
  res.json({
    connection: connectionStatus,
    hasQr: Boolean(lastQr),
    qrDataUrl: lastQrDataUrl,
  });
});

app.post("/messages/send", async (req, res) => {
  try {
    if (!socket || connectionStatus !== "connected") {
      return res.status(409).json({
        provider: "baileys",
        status: "not_connected",
        message: "Scan the QR code from /session/status before sending messages.",
      });
    }

    const { to, message } = req.body;
    const jid = normalizeBrazilPhone(to);
    const result = await socket.sendMessage(jid, { text: String(message || "") });

    return res.json({
      provider: "baileys",
      status: "sent",
      to: jid,
      id: result?.key?.id,
    });
  } catch (error) {
    logger.error({ error }, "Failed to send WhatsApp message");
    return res.status(400).json({
      provider: "baileys",
      status: "failed",
      message: error.message,
    });
  }
});

app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "WhatsApp gateway listening");
});

connect().catch((error) => {
  logger.error({ error }, "Failed to start WhatsApp connection");
  process.exit(1);
});
