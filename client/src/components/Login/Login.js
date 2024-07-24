import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./form.css";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Error Data:", errorData);
        setError(errorData.message || "Login failed");
        return;
      }

      const data = await response.json();
      console.log("Response Data:", data);
      const { token, subscriptions } = data;
      localStorage.setItem("token", token);
      onLogin(email, token);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login Error:", err);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="form-container">
      <h2>Login</h2>
      {error && <div className="message error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
