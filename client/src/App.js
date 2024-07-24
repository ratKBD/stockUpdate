import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useLocation,
} from "react-router-dom";
import Dashboard from "./components/Dashboard/Dashboard";
import Login from "./components/Login/Login";
import Register from "./components/Login/Register";
import "./App.css";

const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initialSubscriptions, setInitialSubscriptions] = useState([]);

  useEffect(() => {
    // Retrieve token and user info from local storage on initial load
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      fetch("http://localhost:5000/verify-token", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.email) {
            setUser(data.email);
            setToken(storedToken);
            setInitialSubscriptions(data.subscriptions || []);
          }
        })
        .catch(() => {
          // Handle token verification errors
          localStorage.removeItem("token");
          setUser(null);
          setToken(null);
        });
    }
  }, []);

  const handleLogin = (email, token) => {
    setUser(email);
    setToken(token);

    fetch("http://localhost:5000/get-subscriptions", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setInitialSubscriptions(data.subscriptions || []);
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
    setInitialSubscriptions([]);
  };

  return (
    <Router>
      <div className="app-container">
        {user ? (
          <Dashboard
            user={user}
            token={token}
            initialSubscriptions={initialSubscriptions}
            onLogout={handleLogout}
          />
        ) : (
          <div>
            <nav className="middle">
              <ul>
                <li>
                  <Link to="/login">Login</Link>
                </li>
                <li>
                  <Link to="/register">Register</Link>
                </li>
              </ul>
            </nav>
            <Routes>
              <Route path="/" element={<Login onLogin={handleLogin} />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;
