import { useState } from "react";
import "./Login.css";

function Login() {
  const [isRegister, setIsRegister] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const url = isRegister
      ? "http://localhost:3000/register"
      : "http://localhost:3000/login";

    const body = isRegister
      ? { username, email, password }
      : { email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        setLoading(false);
        return;
      }

      if (isRegister) {
        setMessage("Account created! You can now login.");
        setIsRegister(false);
        setUsername("");
        setPassword("");
      } else {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch {
      setError("Server unavailable");
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isRegister ? "Create account" : "Welcome back"}</h2>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading
              ? isRegister
                ? "Creating account..."
                : "Logging in..."
              : isRegister
                ? "Register"
                : "Login"}
          </button>
        </form>

        <p className="switch">
          {isRegister ? "Already have an account?" : "Don't have an account?"}
          <span
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
              setMessage("");
            }}
          >
            {isRegister ? " Login" : " Register"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
