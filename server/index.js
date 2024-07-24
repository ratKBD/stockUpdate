const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

const uri =
  "mongodb+srv://vratheesh123:ronaldo07@cluster0.5nbgktv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
let usersCollection, subscriptionsCollection;

client
  .connect()
  .then(() => {
    const db = client.db("stock_app"); // Replace with your database name
    usersCollection = db.collection("users");
    subscriptionsCollection = db.collection("subscriptions");
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error("Failed to connect to MongoDB", err));

const stockPrices = {
  GOOG: 1000,
  TSLA: 200,
  AMZN: 1500,
  META: 250,
  NVDA: 300,
};

const generateToken = (user) => {
  return jwt.sign({ email: user.email }, "secretkey", { expiresIn: "1h" });
};

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  await usersCollection.insertOne({ email, password: hashedPassword });
  await subscriptionsCollection.insertOne({ email, subscriptions: [] }); // Initialize empty subscriptions for new user
  res.status(201).send("User registered");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await usersCollection.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  const token = generateToken(user);
  const subscription = await subscriptionsCollection.findOne({ email });
  res.json({
    token,
    subscriptions: subscription ? subscription.subscriptions : [],
  });
});

io.use((socket, next) => {
  if (socket.handshake.query && socket.handshake.query.token) {
    jwt.verify(socket.handshake.query.token, "secretkey", (err, decoded) => {
      if (err) return next(new Error("Authentication error"));
      socket.user = decoded;
      next();
    });
  } else {
    next(new Error("Authentication error"));
  }
}).on("connection", (socket) => {
  console.log("New client connected");

  const sendStockPrices = async () => {
    const email = socket.user.email;
    const userSubscription = await subscriptionsCollection.findOne({ email });
    const userSubscriptionsList = userSubscription
      ? userSubscription.subscriptions
      : [];
    const filteredPrices = Object.entries(stockPrices)
      .filter(([ticker]) => userSubscriptionsList.includes(ticker))
      .map(([ticker, price]) => ({ ticker, price }));

    socket.emit("stockPrices", [filteredPrices, userSubscriptionsList]); // Ensure this is correct
  };

  sendStockPrices();

  socket.on("subscribe", async (ticker) => {
    const email = socket.user.email;
    const userSubscription = await subscriptionsCollection.findOne({ email });
    const userSubscriptionsList = userSubscription
      ? userSubscription.subscriptions
      : [];
    if (!userSubscriptionsList.includes(ticker)) {
      userSubscriptionsList.push(ticker);
      await subscriptionsCollection.updateOne(
        { email },
        { $set: { subscriptions: userSubscriptionsList } }
      );
      console.log(`User ${email} subscribed to ${ticker}`);
      sendStockPrices();
    }
  });

  socket.on("unsubscribe", async (ticker) => {
    const email = socket.user.email;
    const userSubscription = await subscriptionsCollection.findOne({ email });
    const userSubscriptionsList = userSubscription
      ? userSubscription.subscriptions
      : [];
    if (userSubscriptionsList.includes(ticker)) {
      const updatedSubscriptions = userSubscriptionsList.filter(
        (item) => item !== ticker
      );
      await subscriptionsCollection.updateOne(
        { email },
        { $set: { subscriptions: updatedSubscriptions } }
      );
      console.log(`User ${email} unsubscribed from ${ticker}`);
      sendStockPrices();
    }
  });

  setInterval(() => {
    for (let ticker in stockPrices) {
      stockPrices[ticker] = (Math.random() * 1000).toFixed(2);
    }
    io.emit("stockPrices", [
      Object.entries(stockPrices).map(([ticker, price]) => ({ ticker, price })),
      // Emit empty subscriptions array for clients not connected
      // emit current subscriptions for connected users
      Array.from(io.sockets.sockets.values()).map((socket) => {
        const email = socket.user.email;
        return subscriptionsCollection
          .findOne({ email })
          .then((userSubscription) =>
            userSubscription ? userSubscription.subscriptions : []
          );
      }),
    ]);
  }, 10000);
});

server.listen(5000, () => {
  console.log("Server is running on port 5000");
});
