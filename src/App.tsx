import { useEffect, useState } from "react";
import { getHealth } from "./api/client";

function App() {
  const [rodando, setRodando] = useState(false);

  useEffect(() => {
    getHealth()
      .then(() => setRodando(true))
      .catch(() => setRodando(false));
  }, []);

  return <>{rodando && <p>servidor rodando</p>}</>;
}

export default App;
