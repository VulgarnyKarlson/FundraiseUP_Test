import * as fs from "fs";
import { DBConnection, sleep } from "./helpers";
import { envs } from "./helpers/envs";
import { Sync } from "./helpers/sync";
let applicationAvailable = true;

const main = async () => {
  const conn = new DBConnection();
  await conn.init();
  const sync = new Sync(conn.db);
  try {
    let resumeToken;
    if (fs.existsSync(envs.RESUME_TOKEN_FILE)) {
      resumeToken = JSON.parse(fs.readFileSync(envs.RESUME_TOKEN_FILE, "utf8"));
    }
    if (process.argv[2] === "--full-reindex") {
      await sync.fullReindex();
    } else {
      while (applicationAvailable) {
        await sync.realTimeSync(resumeToken);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    applicationAvailable = false;
    await conn.close();
  }
  process.exit(0);
};

(async () => {
  await main();
})();

const processListeners = ["SIGINT", "SIGTERM", "SIGQUIT"];
processListeners.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`Received ${signal}. Closing application`);
    if (applicationAvailable) {
      applicationAvailable = false;
      await sleep(1000);
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
});
