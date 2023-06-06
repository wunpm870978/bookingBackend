const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

class MongoCli {
  constructor() {
    this.client = new MongoClient(process.env.MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
  }

  async init() {
    if (this.client) {
      await this.client.connect();
      console.log('mongodb successfully connected')
      this.db = this.client.db('booking_system');
      await this.db.command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } else
      console.warn("Client is not initialized properly");
  }
}

module.exports = new MongoCli();