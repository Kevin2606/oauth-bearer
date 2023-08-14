import { MongoClient } from 'mongodb';

export default async function con() {
  try {
    const uri = `mongodb+srv://root:26102610@cluster0.owv3sij.mongodb.net/oauth_bearer`;
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