const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

const users = []; // This would typically be a database
const userSubscriptions = {}; // This would also be stored in a database

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
  users.push({ email, password: hashedPassword });
  userSubscriptions[email] = []; // Initialize empty subscriptions for new user
  res.status(201).send("User registered");
});

// app.post("/login", async (req, res) => {
//   const { email, password } = req.body;
//   const user = users.find((u) => u.email === email);
//   if (!user) {
//     return res.status(400).send("User not found");
//   }
//   const isMatch = await bcrypt.compare(password, user.password);
//   if (!isMatch) {
//     return res.status(400).send("Invalid credentials");
//   }
//   const token = generateToken(user);
//   res.json({ token, subscriptions: userSubscriptions[email] || [] });
// });

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  const token = generateToken(user);
  res.json({ token, subscriptions: userSubscriptions[email] || [] });
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

  const sendStockPrices = () => {
    const email = socket.user.email;
    const userSubscriptionsList = userSubscriptions[email] || [];
    console.log("userSubscriptionsList", userSubscriptionsList);
    const filteredPrices = Object.entries(stockPrices)
      .filter(([ticker]) => userSubscriptionsList.includes(ticker))
      .map(([ticker, price]) => ({ ticker, price }));

    socket.emit("stockPrices", [filteredPrices, userSubscriptionsList]);
  };

  sendStockPrices();

  // socket.on("subscribe", (ticker) => {
  //   const email = socket.user.email;
  //   if (!userSubscriptions[email]) {
  //     userSubscriptions[email] = [];
  //   }
  //   if (!userSubscriptions[email].includes(ticker)) {
  //     userSubscriptions[email].push(ticker);
  //     sendStockPrices();
  //   }
  // });

  // socket.on("unsubscribe", (ticker) => {
  //   const email = socket.user.email;
  //   if (userSubscriptions[email]) {
  //     userSubscriptions[email] = userSubscriptions[email].filter(
  //       (item) => item !== ticker
  //     );
  //     sendStockPrices();
  //   }
  // });

  socket.on("subscribe", (ticker) => {
    const email = socket.user.email;
    if (!userSubscriptions[email]) {
      userSubscriptions[email] = [];
    }
    if (!userSubscriptions[email].includes(ticker)) {
      userSubscriptions[email].push(ticker);
      console.log(`User ${email} subscribed to ${ticker}`);
      sendStockPrices();
    }
  });

  socket.on("unsubscribe", (ticker) => {
    const email = socket.user.email;
    if (userSubscriptions[email]) {
      userSubscriptions[email] = userSubscriptions[email].filter(
        (item) => item !== ticker
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
      userSubscriptions[socket.user.email] || [],
    ]);
  }, 1000);
});

server.listen(5000, () => {
  console.log("Server is running on port 5000");
});
