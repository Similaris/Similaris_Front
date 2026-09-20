import { useEffect, useState } from "react";
import { getToken, logout, me, type User } from "./api/client";
import AppLayout from "./components/AppLayout";
import BatchDetails from "./pages/BatchDetails";
import DocumentDetails from "./pages/DocumentDetails";
import Documents from "./pages/Documents";
import History from "./pages/History";
import Login from "./pages/Login";

type AppRoute =
  | { name: "documents" }
  | { name: "history" }
  | { name: "batch"; batchId: number }
  | { name: "document"; batchId: number; documentId: number }
  | { name: "not-found" };

function normalizedPath(path: string): string {
  const normalized = path.replace(/\/+$/, "");
  return normalized && normalized !== "/" ? normalized : "/documents";
}

function parseRoute(path: string): AppRoute {
  if (path === "/" || path === "/documents") return { name: "documents" };
  if (path === "/history") return { name: "history" };

  const documentMatch = path.match(
    /^\/history\/(\d+)\/documents\/(\d+)$/,
  );
  if (documentMatch) {
    return {
      name: "document",
      batchId: Number(documentMatch[1]),
      documentId: Number(documentMatch[2]),
    };
  }

  const batchMatch = path.match(/^\/history\/(\d+)$/);
  if (batchMatch) {
    return { name: "batch", batchId: Number(batchMatch[1]) };
  }

  return { name: "not-found" };
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [currentPath, setCurrentPath] = useState(() =>
    normalizedPath(window.location.pathname),
  );

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

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(normalizedPath(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigate(path: string) {
    const nextPath = normalizedPath(path);
    if (nextPath !== currentPath) {
      window.history.pushState(null, "", nextPath);
      setCurrentPath(nextPath);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (checking) return null;

  if (!user) return <Login onLogin={setUser} />;

  const route = parseRoute(currentPath);

  let page;
  if (route.name === "documents") {
    page = <Documents />;
  } else if (route.name === "history") {
    page = (
      <History
        onOpenBatch={(batchId) => navigate(`/history/${batchId}`)}
        onStartAnalysis={() => navigate("/documents")}
      />
    );
  } else if (route.name === "batch") {
    page = (
      <BatchDetails
        batchId={route.batchId}
        onBack={() => navigate("/history")}
        onOpenDocument={(documentId) =>
          navigate(`/history/${route.batchId}/documents/${documentId}`)
        }
      />
    );
  } else if (route.name === "document") {
    page = (
      <DocumentDetails
        batchId={route.batchId}
        documentId={route.documentId}
        onBack={() => navigate(`/history/${route.batchId}`)}
      />
    );
  } else {
    page = (
      <main className="page">
        <section className="card history-feedback">
          <p className="feedback-error" role="alert">
            A página solicitada não foi encontrada.
          </p>
          <button
            className="button-ghost"
            type="button"
            onClick={() => navigate("/documents")}
          >
            Ir para documentos
          </button>
        </section>
      </main>
    );
  }

  return (
    <AppLayout
      user={user}
      currentPath={currentPath}
      onNavigate={navigate}
      onLogout={() => {
        logout();
        window.history.replaceState(null, "", "/documents");
        setCurrentPath("/documents");
        setUser(null);
      }}
    >
      {page}
    </AppLayout>
  );
}

export default App;
