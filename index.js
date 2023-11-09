const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://boip0ka.web.app',
      'https://boip0ka.firebaseapp.com',
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_KEY}@cluster0.bvbzn4c.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middleware

const logger = async (req, res, next) => {
  console.log('called', req.hostname, req.originalUrl);
  next();
};

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log('Value of token in middleware', token);
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    //error
    if (err) {
      console.log(err);
      return res.status(401).send({ message: 'Unauthorized' });
    }
    // decoded if token is valid
    console.log('Value in the token', decoded);
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    const genreCollection = client.db('boipoka').collection('genre');
    const bookCollection = client.db('boipoka').collection('books');
    const borrowCollection = client.db('boipoka').collection('borrows');

    app.post('/jwt', logger, async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: '1h',
      });
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
        })
        .send({ success: true });
    });

    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('logging out', user);
      res.clearCookie('token', { maxAge: 0 }).send({ success: true });
    });

    app.get('/genre', async (req, res) => {
      const cursor = genreCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/books', logger, async (req, res) => {
      const cursor = bookCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/books/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.findOne(query);
      res.send(result);
    });

    app.post('/books', async (req, res) => {
      const newBook = req.body;
      console.log(newBook);
      const result = await productCollection.insertOne(newBook);
      res.send(result);
    });

    app.put('/books/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedBook = req.body;

      const book = {
        $set: {
          title: updatedBook.title,
          author: updatedBook.author,
          genre: updatedBook.genre,
          imgUrl: updatedBook.imgUrl,
          rating: updatedBook.rating,
          quantity: updatedBook.quantity,
        },
      };

      // test

      const result = await bookCollection.updateOne(filter, book, options);
      res.send(result);
    });

    // borrows

    app.get('/borrows', logger, verifyToken, async (req, res) => {
      console.log(req.query.email);
      // console.log('token', req.cookies.token);
      console.log('User in the valid token:', req.user);

      if (req.query.email !== req.user.email) {
        return res.status(403).send({ message: 'Forbidden access' });
      }
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await borrowCollection.find(query).toArray();
      res.send(result);
    });

    app.post('/borrows', async (req, res) => {
      const borrow = req.body;
      console.log(borrow);
      const result = await borrowCollection.insertOne(borrow);
      res.send(result);
    });

    app.delete('/borrows/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await borrowCollection.deleteOne(query);
      res.send(result);
    });

    app.patch('/books/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const updateBook = { $set: req.body };

        const result = await bookCollection.updateOne(query, updateBook);

        if (result.modifiedCount > 0) {
          res.status(200).send({
            success: true,
            message: 'Book quantity updated successfully',
          });
        } else {
          res.status(404).send({
            success: false,
            message: 'Book not found or quantity not updated',
          });
        }
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ success: false, message: 'Internal Server Error' });
      }
    });

    app.get('/books/:title', async (req, res) => {
      const title = req.params.title;
      const query = { _id: new ObjectId(title) };
      const result = await bookCollection.findOne(query);
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
