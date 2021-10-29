import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { connectDatabase } from './utils/database';
import { getCatsCollection } from './utils/database';

if (!process.env.MONGODB_URI) {
  throw new Error('No MongoDB URL dotenv variable');
}

const app = express();
const port = 3000;

// Custom middleware to log requests
app.use((request, _response, next) => {
  console.log('Request received', request.url);
  next();
});

// Middleware for parsing application/json
app.use(express.json());

// Post a cat to the Database
app.post('/api/cats', async (request, response) => {
  const catsCollection = getCatsCollection();
  const newCat = request.body;
  const isCatKnown = await catsCollection.findOne({ name: newCat.name });

  if (
    typeof newCat.name !== 'string' ||
    typeof newCat.age !== 'number' ||
    typeof newCat.race !== 'string'
  ) {
    response.status(400).send('Missing properties');
    return;
  }

  if (isCatKnown) {
    response.status(409).send('Cat already lives in the collection');
  } else {
    catsCollection.insertOne(newCat);
    response.status(200).send('Cat has been added to the collection');
  }
});

app.get('/api/cats', async (_request, response) => {
  const catsCollection = getCatsCollection();
  const catCursor = catsCollection.find();
  const allCats = await catCursor.toArray();
  response.status(200).send(allCats);
});

app.get('/api/cats/:name', async (request, response) => {
  const catsCollection = getCatsCollection();
  const searchedCat = request.params.name;
  const foundCat = await catsCollection.findOne({ name: searchedCat });
  if (foundCat) {
    response.status(200).send(foundCat);
  } else {
    response.status(404).send('Cat not found');
  }
});

app.get('/', (_req, res) => {
  res.send('Hello World!');
});

connectDatabase(process.env.MONGODB_URI).then(() =>
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  })
);
