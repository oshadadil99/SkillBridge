import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB, { getNamedDb } from "../config/db.js";

dotenv.config();

const collections = ["courses", "modules", "lessons"];

const getDbName = (db) => db?.databaseName || db?.name || "unknown";

const ensureCollection = async (db, collectionName) => {
  const exists = await db.db
    .listCollections({ name: collectionName })
    .hasNext();

  if (!exists) {
    await db.createCollection(collectionName);
  }
};

const copyCollection = async (sourceDb, targetDb, collectionName) => {
  await ensureCollection(targetDb, collectionName);

  const sourceCollection = sourceDb.collection(collectionName);
  const targetCollection = targetDb.collection(collectionName);
  const documents = await sourceCollection.find({}).toArray();

  if (documents.length === 0) {
    console.log(`${collectionName}: no documents found in ${getDbName(sourceDb)}`);
    return;
  }

  const result = await targetCollection.bulkWrite(
    documents.map((document) => ({
      replaceOne: {
        filter: { _id: document._id },
        replacement: document,
        upsert: true
      }
    })),
    { ordered: false }
  );

  console.log(
    `${collectionName}: copied ${documents.length} from ${getDbName(sourceDb)} to ${getDbName(targetDb)} `
    + `(upserted ${result.upsertedCount}, modified ${result.modifiedCount})`
  );
};

const run = async () => {
  await connectDB();

  const sourceDb = mongoose.connection.db;
  const targetDb = getNamedDb("skillbridge");

  if (!sourceDb) {
    throw new Error("MongoDB source database is not available");
  }

  if (getDbName(sourceDb) === getDbName(targetDb)) {
    console.log("Default database is already skillbridge. Ensuring collections exist.");

    for (const collectionName of collections) {
      await ensureCollection(targetDb, collectionName);
    }

    return;
  }

  for (const collectionName of collections) {
    await copyCollection(sourceDb, targetDb, collectionName);
  }
};

run()
  .then(async () => {
    await mongoose.disconnect();
    console.log("Course content migration completed.");
  })
  .catch(async (error) => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  });
