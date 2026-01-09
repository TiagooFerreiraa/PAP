import { useNavigate } from "react-router-dom";

function Main() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Welcome {user?.username || "User"} 👋</h1>
      <p>You are logged in.</p>

      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default Main;