/** @format */

// const mongoose = require('mongoose');

// mongoose.set("strictQuery", false);

// // console.log(process.env.COLLECTION_NAME);
// // const DB = `mongodb+srv://${process.env.COLLECTION_NAME}:${process.env.COLLECTION_PASSWORD}@${process.env.COLLECTION_NAME}.cbqsaya.mongodb.net/?retryWrites=true&w=majority`;

// const DB = "mongodb://127.0.0.1:27017/plantdatabash";

// mongoose.connect(DB, {
//     useNewUrlParser: true,

// }).then(() => {
//     console.log("connection successful!...");
// }).catch((err) => {
//     console.log(`connection failed!.... ${err}`);
// });

const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

const DB = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/plantdb";

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("connection successful!");
  })
  .catch((err) => {
    console.log(`connection failed! ${err}`);
  });

