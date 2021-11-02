import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { connectDatabase } from './utils/database';
import { getCatsCollection } from './utils/database';
import cookieParser from 'cookie-parser';

if (!process.env.MONGODB_URI) {
  throw new Error('No MongoDB URL dotenv variable');
}

const app = express();
const port = 3333;

// Middleware for parsing application/json
app.use(express.json());

// Middleware for parsing cookies
app.use(cookieParser());

// Post a cat to the Database
app.post('/api/cats', async (request, response) => {
  const catsCollection = getCatsCollection();
  const newCat = request.body;
  const isCatKnown = await catsCollection.findOne({ name: newCat.name });

  if (
    typeof newCat.name !== 'string' ||
    typeof newCat.age !== 'number' ||
    typeof newCat.race !== 'string' ||
    typeof newCat.password !== 'string'
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

app.delete('/api/cats/:name', async (request, response) => {
  const catsCollection = getCatsCollection();
  const catToDelete = request.params.name;
  const foundCat = await catsCollection.findOne({ name: catToDelete });
  if (foundCat) {
    catsCollection.deleteOne({ name: catToDelete });
    response.status(200).send(`${catToDelete} was deleted!`);
  } else {
    response.status(404).send('Cat not found');
  }
});

app.post('/api/login', async (request, response) => {
  const catsCollection = getCatsCollection();
  const loginCat = request.body;
  const cat = await catsCollection.findOne({
    name: loginCat.name,
    password: loginCat.password,
  });

  if (cat) {
    response.setHeader('Set-Cookie', `name=${loginCat.name}`);
    response.status(202).send('Cat is logged in');
    console.log(request.cookies);
  } else {
    response.status(401).send('Login failed');
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
