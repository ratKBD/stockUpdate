import React, { useState } from "react";
import axios from "axios";
import "./form.css"; // Include the unified CSS file

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const validatePassword = (password) => {
    if (password.length < 8)
      return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(password))
      return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(password))
      return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(password))
      return "Password must contain at least one number.";
    if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password))
      return "Password must contain at least one special character.";
    return ""; // Return an empty string if no errors
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const passwordValidationError = validatePassword(password);

    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    try {
      const response = await axios.post(
        "https://stock-update-db.vercel.app/register",
        {
          email,
          password,
        }
      );

      if (response.status === 201) {
        setMessage("Registration successful!");
        setIsError(false);
        setPasswordError("");
      } else {
        setMessage(`Unexpected response status: ${response.status}`);
        setIsError(true);
      }
    } catch (error) {
      if (error.response) {
        setMessage(
          error.response.data.message ||
            "Registration failed. Please try again."
        );
        setIsError(true);
      } else if (error.request) {
        setMessage("No response from server. Please try again later.");
        setIsError(true);
      } else {
        setMessage("Error in request setup: " + error.message);
        setIsError(true);
      }
    }
  };

  return (
    <div className="form-container">
      <h2>Register</h2>
      {message && (
        <p className={`message ${isError ? "error" : "success"}`}>{message}</p>
      )}
      {passwordError && <p className="message error">{passwordError}</p>}
      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
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
            placeholder="Password"
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
