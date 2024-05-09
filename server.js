import express from "express";
import expressListEndpoints from "express-list-endpoints";
import cors from "cors";
import mongoose from "mongoose";
import { Title } from "./models/Title";
import netflixData from "./data/netflix-titles.json";
require("dotenv").config();

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/project-mongo";
mongoose.connect(mongoUrl);
mongoose.Promise = Promise;

// Seed the database
if (process.env.RESET_DB) {
  const seedDatabase = async () => {
    console.log("Resetting and seeding");
    await Title.deleteMany();

    netflixData.forEach((item) => {
      new Title(item).save();
    });
    console.log("Seeding completed");
  };
  seedDatabase();
}

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// Start defining your routes here
app.get("/", (req, res) => {
  const endpoints = expressListEndpoints(app);
  res.json(endpoints);
});

app.get("/titles", async (req, res) => {
  const { name, type, cast, country } = req.query;
  let query = {};

  if (name) query.title = { $regex: name, $options: "i" };
  if (type) query.type = { $regex: type, $options: "i" };
  if (cast) query.cast = { $regex: cast, $options: "i" };
  if (country) query.country = { $regex: country, $options: "i" };
  
  const allTitles = await Title.find(query);

  if (allTitles.length === 0) {
    res.status(404).send("no titles were found")
  }
  else {
    res.json(allTitles)
  }
});

app.get("/titles/:titleId", async (req, res) => {
  const { titleId } = req.params;

  const byId = await Title.findById(titleId).exec();

  if (byId) {
    res.json(byId);
  } else {
    res.status(404).send("no title found by id");
  }
});

app.get("/titles/year/:year", async (req, res) => {
  const year = req.params.year
  
  const byYear = await Title.find({ release_year: year }).exec()

  if (byYear.length > 0) {
    res.json(byYear) 
  } else {
    res.status(404).send("no title found by that year")
  }
 })

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
