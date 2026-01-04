import { useEffect, useState} from "react";
import Login from "./pages/Login.jsx";

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3000/test-db")
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <Login/>
    </div>
  );
}

export default App;