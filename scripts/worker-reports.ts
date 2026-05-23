import { startReportWorker } from "../src/server/queue/report-queue";

const worker = startReportWorker();
if (!worker) process.exit(0);

process.on("SIGINT", async () => {
  await worker.close();
  process.exit(0);
});
