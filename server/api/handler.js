// api/handler.js

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // Adjust to your specific domain if needed
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    // Handle GET requests
    res.status(200).json({ message: "GET request successful" });
  } else if (req.method === "POST") {
    // Handle POST requests
    res.status(200).json({ message: "POST request successful" });
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
};
