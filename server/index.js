const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

// CORS Middleware
app.use(
  cors({
    origin: "*", // Adjust to your specific domain if needed
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

const uri =
  "mongodb+srv://vratheesh123:ronaldo07@cluster0.5nbgktv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

client
  .connect()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

app.post("/register", async (req, res) => {
  // Registration logic
});

app.post("/login", async (req, res) => {
  // Login logic
});

io.on("connection", (socket) => {
  console.log("New client connected");

  // Socket.io logic
});

server.listen(process.env.PORT || 5000, () => {
  console.log("Server is running");
});
