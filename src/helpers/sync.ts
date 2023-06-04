import * as fs from "fs";
import { Db, ResumeToken } from "mongodb";
import { anonimyzeCustomer, sleep } from "./";
import { BatchCollector } from "./batch";
import { envs } from "./envs";
import { Customer } from "./interfaces";

export class Sync {
  private db: Db;
  private batchCollector: BatchCollector;

  constructor(db: Db) {
    this.db = db;
    this.batchCollector = new BatchCollector(
      this.db,
      "customers_anonymised",
      envs.BATCH_LIMIT,
      envs.BATCH_INTERVAL_TIMEOUT
    );
  }

  public async fullReindex() {
    const cursor = this.db.collection("customers").find();

    while (await cursor.hasNext()) {
      let customer = (await cursor.next()) as unknown as Customer;
      const { customerAddress, customerInfo } = anonimyzeCustomer(customer);
      customer = {
        ...customer,
        ...customerInfo,
        address: { ...customer.address, ...customerAddress },
      };

      delete customer.createdAt;
      customer.createdAt = new Date(customer.createdAt);

      await this.batchCollector.add(customer);
    }

    await this.batchCollector.close();

    console.log("Full reindex completed.");
  }

  public async realTimeSync(resumeToken: ResumeToken) {
    const changeStreamOptions = resumeToken
      ? { resumeAfter: resumeToken }
      : undefined;
    const changeStream = await this.db.collection("customers").watch(
      [
        {
          $match: {
            $or: [{ operationType: "insert" }, { operationType: "update" }],
          },
        },
      ],
      changeStreamOptions
    );
    while (await changeStream.hasNext()) {
      const next = await changeStream.next();
      let customer: Omit<Customer, "_id">;
      if (next.operationType === "insert") {
        const { customerAddress, customerInfo } = anonimyzeCustomer(
          next.fullDocument as unknown as Customer
        );
        customer = {
          ...next.fullDocument,
          ...customerInfo,
          address: { ...next.fullDocument.address, ...customerAddress },
          createdAt: new Date(next.fullDocument.createdAt),
        };
        this.batchCollector.add(customer, "insert");
      } else if (next.operationType === "update") {
        const { customerAddress, customerInfo } = anonimyzeCustomer(
          next.updateDescription.updatedFields as unknown as Customer
        );
        customer = {
          ...next.updateDescription.updatedFields,
          ...customerInfo,
          address: {
            ...next.updateDescription.updatedFields.address,
            ...customerAddress,
          },
          createdAt: new Date(next.updateDescription.updatedFields.createdAt),
        };
        this.batchCollector.add(customer, "update");
      }
      // Возможен вполне пропуск данных в момент работы с пачкой
      fs.writeFileSync(envs.RESUME_TOKEN_FILE, JSON.stringify(next._id));
    }
  }
}
