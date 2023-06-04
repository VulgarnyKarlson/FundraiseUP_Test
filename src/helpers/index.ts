import { fa, fakerEN as faker } from "@faker-js/faker";
import { Collection, Document, MongoClient } from "mongodb";
import * as process from "process";
import { envs } from "./envs";
import { Customer } from "./interfaces";
import * as crypto from "crypto";

export class DBConnection {
  private client: MongoClient;

  constructor() {
    this.client = new MongoClient(envs.MONGODB_URI);
  }

  async init() {
    try {
      await this.client.connect();
      console.log("Connected successfully to server");
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }

  get db() {
    return this.client.db(envs.DB_NAME);
  }

  async close() {
    await this.client.close();
  }
}

const generateRandomString = (input: string): string => {
  return crypto.createHash("md5").update(input).digest("hex").substring(0, 8);
};

export const anonimyzeCustomer = (customer: Customer) => {
  const emailParts = customer.email.split("@");
  const customerInfo: Omit<Customer, "address" | "createdAt" | "_id"> = {
    firstName: generateRandomString(customer.firstName),
    lastName: generateRandomString(customer.lastName),
    email: generateRandomString(emailParts + "@" + emailParts[1]),
  };
  const customerAddress = {
    line1: generateRandomString(customer.address.line1),
    line2: generateRandomString(customer.address.line2),
    postcode: generateRandomString(customer.address.postcode),
  };

  return { customerInfo, customerAddress };
};

export const generateCustomer = (count: number): Omit<Customer, "_id"> => {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    address: {
      line1: faker.location.streetAddress(),
      line2: faker.location.secondaryAddress(),
      postcode: faker.location.zipCode(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
    },
    createdAt: new Date(),
  };
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const generateRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
