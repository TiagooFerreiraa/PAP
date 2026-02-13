import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Main from "./pages/Main";
import Admin from "./pages/Admin/Admin";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={!user ? (
            <Login setUser={setUser} />
          ) : (
            user?.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/main" />
          )}
        />

        <Route
          path="/main"
          element={user ? <Main setUser={setUser} /> : <Navigate to="/" />}
        />

        <Route
          path="/admin"
          element={user && user.role === 'admin' ? <Admin setUser={setUser} /> : <Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
