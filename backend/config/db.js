import mongoose from "mongoose";
import https from "https";
import dns from "dns";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getPublicIP = () =>
  new Promise((resolve) => {
    try {
      const req = https.get("https://api.ipify.org?format=json", (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data || "{}");
            resolve(parsed.ip || null);
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on("error", () => resolve(null));
      req.setTimeout(3000, () => {
        req.destroy();
        resolve(null);
      });
    } catch (e) {
      resolve(null);
    }
  });

const tryConnect = async (uri, options = {}, maxAttempts = 4) => {
  let attempt = 0;
  let delay = 1000;

  while (attempt < maxAttempts) {
    try {
      attempt += 1;
      await mongoose.connect(uri, options);
      return;
    } catch (err) {
      if (attempt >= maxAttempts) throw err;
      console.warn(
        `MongoDB connection attempt ${attempt} failed. Retrying in ${delay}ms...`
      );
      // small backoff
      // eslint-disable-next-line no-await-in-loop
      await wait(delay);
      delay *= 2;
    }
  }
};

const connectDB = async () => {
  const dnsServers = (process.env.MONGO_DNS_SERVERS || "8.8.8.8,1.1.1.1")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (dnsServers.length) {
    dns.setServers(dnsServers);
  }

  // Some local DNS resolvers fail Atlas shard hostname lookups intermittently.
  // Force IPv4 resolve via configured public DNS servers, then fall back to default lookup.
  const originalLookup = dns.lookup;
  dns.lookup = (hostname, options, callback) => {
    let normalizedOptions = options;
    let normalizedCallback = callback;

    if (typeof options === "function") {
      normalizedCallback = options;
      normalizedOptions = {};
    }

    const lookupOptions = normalizedOptions || {};

    dns.resolve4(hostname, (resolveErr, addresses) => {
      if (!resolveErr && Array.isArray(addresses) && addresses.length > 0) {
        if (lookupOptions?.all) {
          return normalizedCallback(
            null,
            addresses.map((address) => ({ address, family: 4 }))
          );
        }

        return normalizedCallback(null, addresses[0], 4);
      }

      return originalLookup(hostname, lookupOptions, normalizedCallback);
    });
  };

  const options = { serverSelectionTimeoutMS: 10000 };
  const primaryUri = process.env.MONGO_URI;

  if (!primaryUri) {
    throw new Error("MONGO_URI is required in environment");
  }

  try {
    await tryConnect(primaryUri, options, 4);
    console.log("MongoDB connected (MONGO_URI)");
    return;
  } catch (error) {
    console.error("MongoDB connection error:", error.message || error);

    const reasonType = error?.reason?.type || error?.reason || null;
    if (reasonType === "ReplicaSetNoPrimary" || String(reasonType).toLowerCase().includes("replicasetnoprimary")) {
      console.error(
        "ReplicaSetNoPrimary: no primary found in the replica set. Common causes: your IP is not added to Atlas Network Access (IP whitelist), or the cluster is paused/unreachable."
      );
      console.error(
        "If you're running locally, add your machine's public IP in Atlas Network Access or allow 0.0.0.0/0 temporarily for testing."
      );
    }

    const ip = await getPublicIP();
    if (ip) {
      console.error(`Detected public IP: ${ip}`);
      console.error("Add this IP to your MongoDB Atlas Network Access list or allow 0.0.0.0/0 for testing.");
    } else {
      console.error("Unable to determine public IP for guidance.");
    }

    throw error;
  }
};

export const getNamedDb = (dbName) => {
  if (!dbName) {
    throw new Error("dbName is required");
  }

  return mongoose.connection.useDb(dbName, { useCache: true });
};

export default connectDB;
