import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";
import Dashboard from "./components/Dashboard/Dashboard";
import Login from "./components/Login/Login";
import Register from "./components/Login/Register";
import "./App.css";

const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const handleLogin = (email, token) => {
    setUser(email);
    setToken(token);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <Router>
      <div className="screenCenter">
        {" "}
        {/* thu25 */}
        {user ? (
          <Dashboard user={user} token={token} onLogout={handleLogout} />
        ) : (
          <div className="centered">
            <nav>
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
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Navigate to="/login" />} />{" "}
              {/* Redirect to login by default */}
            </Routes>
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;
