import { useEffect, useState } from "react";
import { getToken, logout, me, type User } from "./api/client";
import Login from "./pages/Login";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setChecking(false);
      return;
    }
    me()
      .then(setUser)
      .catch(() => logout())
      .finally(() => setChecking(false));
  }, []);

  if (checking) return null;

  if (!user) return <Login onLogin={setUser} />;

  return (
    <>
      <p>servidor rodando</p>
      <p>
        logado como {user.name}{" "}
        <button
          onClick={() => {
            logout();
            setUser(null);
          }}
        >
          sair
        </button>
      </p>
    </>
  );
}

export default App;
