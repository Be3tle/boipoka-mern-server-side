const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_KEY}@cluster0.bvbzn4c.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const genreCollection = client.db('boipoka').collection('genre');
    const bookCollection = client.db('boipoka').collection('books');

    app.get('/genre', async (req, res) => {
      const cursor = genreCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/books', async (req, res) => {
      const cursor = bookCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Boipoka is running');
});

app.listen(port, () => {
  console.log(`Boipoka is listening on port: ${port}`);
});
