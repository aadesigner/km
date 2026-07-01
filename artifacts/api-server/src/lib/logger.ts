import pino from "pino";
import PinoPretty from "pino-pretty";
import { Writable } from "stream";
import { db, systemLogsTable } from "@workspace/db";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Writable stream that parses pino NDJSON lines and fire-and-forgets inserts
 * info/warn/error/fatal entries into system_logs. Covers ALL pino loggers that
 * share this destination — the root logger, child loggers, and req.log from
 * pino-http — so the DB sees every structured log call, not just wrapper calls.
 */
class DbLogStream extends Writable {
  private _buf = "";

  override _write(chunk: Buffer | string, _enc: BufferEncoding, cb: () => void): void {
    this._buf += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : chunk;
    let nl = this._buf.indexOf("\n");
    while (nl !== -1) {
      const line = this._buf.slice(0, nl).trim();
      this._buf = this._buf.slice(nl + 1);
      if (line) this._parseLine(line);
      nl = this._buf.indexOf("\n");
    }
    cb();
  }

  private _parseLine(line: string): void {
    try {
      const obj = JSON.parse(line) as Record<string, unknown>;
      const numLevel = Number(obj.level ?? 0);
      if (numLevel < 30) return; // skip debug / trace
      const dbLevel = numLevel >= 50 ? "error" : numLevel >= 40 ? "warn" : "info";
      const message = String(obj.msg ?? "").slice(0, 2000);
      if (!message) return;
      const { level: _l, msg: _m, time: _t, pid: _p, hostname: _h, v: _v, ...context } = obj;
      const hasCtx = Object.keys(context).length > 0;
      db.insert(systemLogsTable).values({
        level: dbLevel,
        message,
        context: hasCtx ? JSON.stringify(context).slice(0, 8000) : undefined,
      }).catch(() => {});
    } catch { /* ignore malformed lines */ }
  }
}

const dbStream = new DbLogStream();

const prettyStream = isProduction
  ? (process.stdout as unknown as { write(msg: string): void })
  : (PinoPretty({ colorize: true }) as unknown as { write(msg: string): void });

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? "info",
    redact: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
    ],
  },
  pino.multistream([
    { stream: prettyStream },
    { stream: dbStream as unknown as { write(msg: string): void }, level: "info" },
  ]),
);
