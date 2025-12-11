import { useEffect, useState} from "react";

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
      <h1>React + Express Test</h1>

      {data ? (
        <p>{data.message} → Result: {data.result}</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default App;
