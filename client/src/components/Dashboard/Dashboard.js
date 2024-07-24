import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "./dashboard.css";

const Dashboard = ({ user, token, onLogout }) => {
  const [stocks, setStocks] = useState([]);
  const [subscribedStocks, setSubscribedStocks] = useState([]);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      query: { token },
    });
    setSocket(newSocket);
    newSocket.connect();

    newSocket.on("stockPrices", (data) => {
      console.log("Received data:", data);
      if (Array.isArray(data) && data.length === 2) {
        const [stockPrices, userSubscriptionsList] = data;

        // Check the format of stockPrices
        if (
          Array.isArray(stockPrices) &&
          stockPrices.every((item) => item.ticker && item.price)
        ) {
          setStocks(stockPrices);
        } else {
          console.error("Invalid stockPrices format:", stockPrices);
        }

        // Check the format of userSubscriptionsList
        if (
          Array.isArray(userSubscriptionsList) &&
          userSubscriptionsList.every((ticker) => typeof ticker === "string")
        ) {
          setSubscribedStocks(userSubscriptionsList);
        } else {
          console.error(
            "Invalid userSubscriptionsList format:",
            userSubscriptionsList
          );
        }
      } else {
        console.error("Unexpected data format:", data);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const subscribe = (ticker) => {
    console.log(`Attempting to subscribe to ${ticker}`);
    if (socket) {
      socket.emit("subscribe", ticker);
      console.log("Subscription request sent for:", ticker);

      setSubscribedStocks((prevSubscribedStocks) => {
        console.log("Previous subscribedStocks:", prevSubscribedStocks);
        if (!prevSubscribedStocks.includes(ticker)) {
          const updatedSubscriptions = [...prevSubscribedStocks, ticker];
          console.log("Updated subscribedStocks:", updatedSubscriptions);
          return updatedSubscriptions;
        }
        return prevSubscribedStocks;
      });
    }
  };

  const unsubscribe = (ticker) => {
    console.log(`Attempting to unsubscribe from ${ticker}`);
    if (socket) {
      socket.emit("unsubscribe", ticker);
      console.log("Unsubscription request sent for:", ticker);

      setSubscribedStocks((prevSubscribedStocks) =>
        prevSubscribedStocks.filter((stock) => stock !== ticker)
      );
    }
  };

  const handleLogout = () => {
    console.log("Logging out...");
    if (socket) {
      socket.disconnect();
    }
    localStorage.removeItem("token");
    onLogout();
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Welcome, {user}</h2>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className="available-stocks">
        <h3>Available Stocks</h3>
        {["GOOG", "TSLA", "AMZN", "META", "NVDA"].map((ticker) => (
          <div className="stock-item" key={ticker}>
            <span>{ticker}</span>
            {subscribedStocks.includes(ticker) ? (
              <button
                className="unsubscribe"
                onClick={() => unsubscribe(ticker)}
              >
                Unsubscribe
              </button>
            ) : (
              <button onClick={() => subscribe(ticker)}>Subscribe</button>
            )}
          </div>
        ))}
      </div>
      <div className="subscribed-stocks">
        <h3>Subscribed Stocks</h3>
        <ul>
          {stocks
            .filter((stock) => subscribedStocks.includes(stock.ticker))
            .map((stock) => (
              <li key={stock.ticker}>
                {stock.ticker}: {stock.price}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
