import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

export default async function con() {
  try {
    const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.owv3sij.mongodb.net/${process.env.DB}`;
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    const client = await new MongoClient(uri, options).connect();
    return client.db();
  } catch (error) {
    return {status: 500, message: error};
  }
}