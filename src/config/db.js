import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "travel_db"
});

db.connect((err) => {
  if (err) {
    console.log("Database connection failed");
  } else {
    console.log("MySQL Connected");
  }
});

export default db;