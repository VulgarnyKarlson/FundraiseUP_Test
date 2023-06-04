import {
  DBConnection,
  generateCustomer,
  generateRandomInt,
  sleep,
} from "./helpers";
import { envs } from "./helpers/envs";

const conn = new DBConnection();
let applicationAvailable = true;

const main = async () => {
  await conn.init();
  console.log("Connected to DB");
  console.log("Start generating customers");
  try {
    // можно было наложить setInterval но тогда не будет возможности корректно завершить приложение
    while (applicationAvailable) {
      const intervalGenerated = generateRandomInt(
        envs.MIN_INTERVAL_GENERATED,
        envs.MAX_INTERVAL_GENERATED
      );
      const customers = Array.from(
        { length: intervalGenerated },
        generateCustomer
      );
      await conn.db.collection("customers").insertMany(customers);
      await sleep(envs.GENERATE_INTERVAL_TIMEOUT);
    }
  } catch (e) {
    console.error(e);
  } finally {
    applicationAvailable = false;
    await conn.close();
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

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
