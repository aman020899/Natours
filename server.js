const dotenv = require("dotenv");
const mongoose = require("mongoose");

process.on("uncaughtException", err => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down.....");
  console.log(err.name, err.message);
  process.exit(1);
});
dotenv.config({ path: "./config.env" });
const app = require("./app");

// console.log(process.env);
const db = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log("DB connection sucessfull...");
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App is running in port ${port}`);
});

process.on("unhandledRejection", err => {
  console.log(err.name, err.message);
  console.log("UNHANDLER REJACTION! 💥 Shutting down.....");
  server.close(() => {
    process.exit(1);
  });
});
