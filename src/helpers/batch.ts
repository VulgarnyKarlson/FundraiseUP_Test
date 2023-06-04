import { Db } from "mongodb";
import { Customer } from "./interfaces";

export class BatchCollector {
  private db: Db;
  private batchSize: number;
  private batchTimeout: number;
  private collectionName: string;
  private dto_insert: Partial<Customer>[] = [];
  private dto_update: Partial<Customer>[] = [];
  private timer: NodeJS.Timeout;

  constructor(
    db: Db,
    collectionName: string,
    batchSize: number,
    batchTimeout: number
  ) {
    this.db = db;
    this.collectionName = collectionName;
    this.batchSize = batchSize;
    this.batchTimeout = batchTimeout;
  }

  async add(customer: Partial<Customer>, type: "insert" | "update" = "insert") {
    if (type === "insert") {
      this.dto_insert.push(customer);
    } else if (type === "update") {
      this.dto_update.push(customer);
    }

    if (this.batchTimeout === 0) {
      await this.flush();
    } else {
      if (this.dto_insert.length + this.dto_update.length >= this.batchSize) {
        clearTimeout(this.timer);
        await this.flush();
      } else if (
        typeof this.timer === "undefined" ||
        // @ts-ignore
        this.timer["_destroyed"]
      ) {
        this.timer = setTimeout(this.flush.bind(this), this.batchTimeout);
      }
    }
  }

  async flush() {
    if (this.dto_insert.length == 0 && this.dto_update.length == 0) {
      return;
    }
    try {
      if (this.dto_insert.length > 0) {
        const data = JSON.parse(JSON.stringify(this.dto_insert));
        this.dto_insert = [];
        await this.db.collection(this.collectionName).insertMany(data);
      }
    } catch (e: any) {
      if (e.code !== 11000) {
        throw e;
      }
    }

    if (this.dto_update.length > 0) {
      for (const customer of this.dto_update) {
        await this.db
          .collection(this.collectionName)
          .updateOne({ _id: customer._id }, { $set: customer });
      }
      this.dto_update = [];
    }
  }

  async close() {
    clearTimeout(this.timer);
    await this.flush();
  }
}
