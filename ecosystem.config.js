/**
 * PM2 deployment config — กีฬา 329 MIS
 * รัน 2 โปรเซส: เว็บ (Next.js) + worker (คิวสร้างรายงาน PowerPoint)
 *
 *   pm2 start ecosystem.config.js     # ครั้งแรก
 *   pm2 reload ecosystem.config.js    # deploy ใหม่ (zero-downtime)
 *   pm2 save && pm2 startup           # ให้ฟื้นอัตโนมัติหลังรีบูต
 *
 * อ่านค่าจาก .env.production เอง(ไม่พึ่ง shell) เพื่อให้ env ครบทั้งตอน start และตอน resurrect หลังรีบูต
 */
const fs = require("fs");
const path = require("path");

const APP_DIR = "/DATA/AppData/www/329";

function loadEnvFile(file) {
  const env = {};
  try {
    const content = fs.readFileSync(path.join(__dirname, file), "utf8");
    for (const rawLine of content.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  } catch {
    // ไม่มีไฟล์ก็ใช้ env เดิมของระบบ
  }
  return env;
}

const fileEnv = loadEnvFile(".env.production");
const env = { NODE_ENV: "production", ...fileEnv };
const port = fileEnv.PORT || "3000";

module.exports = {
  apps: [
    {
      name: "329-web",
      cwd: APP_DIR,
      script: "node_modules/next/dist/bin/next",
      args: `start -p ${port}`,
      env,
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "1G",
      out_file: `${APP_DIR}/storage/logs/web-out.log`,
      error_file: `${APP_DIR}/storage/logs/web-error.log`,
      time: true
    },
    {
      name: "329-worker",
      cwd: APP_DIR,
      script: "node_modules/.bin/tsx",
      args: "scripts/worker-reports.ts",
      env,
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      out_file: `${APP_DIR}/storage/logs/worker-out.log`,
      error_file: `${APP_DIR}/storage/logs/worker-error.log`,
      time: true
    }
  ]
};
