import { useEffect, useState } from "react";
import { getToken, logout, me, type User } from "./api/client";
import AppLayout from "./components/AppLayout";
import AnalysisReport from "./pages/AnalysisReport";
import BatchDetails from "./pages/BatchDetails";
import Dashboard from "./pages/Dashboard";
import DocumentDetails from "./pages/DocumentDetails";
import Documents from "./pages/Documents";
import History from "./pages/History";
import HowItWorks from "./pages/HowItWorks";
import Home from "./pages/Home";
import Login from "./pages/Login";

type AppRoute =
  | { name: "home" }
  | { name: "dashboard" }
  | { name: "documents" }
  | { name: "history" }
  | { name: "how-it-works" }
  | { name: "batch"; batchId: number }
  | { name: "document"; batchId: number; documentId: number }
  | { name: "report"; batchId: number; documentId: number }
  | { name: "not-found" };

function normalizedPath(path: string): string {
  const normalized = path.replace(/\/+$/, "");
  return normalized && normalized !== "/" ? normalized : "/home";
}

function parseRoute(path: string): AppRoute {
  if (path === "/" || path === "/home") return { name: "home" };
  if (path === "/dashboard") return { name: "dashboard" };
  if (path === "/documents") return { name: "documents" };
  if (path === "/history") return { name: "history" };
  if (path === "/como-funciona") return { name: "how-it-works" };

  const reportMatch = path.match(
    /^\/history\/(\d+)\/documents\/(\d+)\/report$/,
  );
  if (reportMatch) {
    return {
      name: "report",
      batchId: Number(reportMatch[1]),
      documentId: Number(reportMatch[2]),
    };
  }

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
    function handleExpiredSession() {
      setUser(null);
      window.history.replaceState(null, "", "/home");
      setCurrentPath("/home");
    }

    window.addEventListener("similaris:session-expired", handleExpiredSession);
    return () =>
      window.removeEventListener("similaris:session-expired", handleExpiredSession);
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

  function completeLogin(authenticatedUser: User) {
    window.history.replaceState(null, "", "/home");
    setCurrentPath("/home");
    setUser(authenticatedUser);
  }

  if (checking) return null;

  if (!user) return <Login onLogin={completeLogin} />;

  const route = parseRoute(currentPath);

  let page;
  if (route.name === "home") {
    page = (
      <Home
        onStartAnalysis={() => navigate("/documents")}
        onOpenHistory={() => navigate("/history")}
        onOpenDashboard={() => navigate("/dashboard")}
        onOpenBatch={(batchId) => navigate(`/history/${batchId}`)}
        onOpenReport={(batchId, documentId) =>
          navigate(`/history/${batchId}/documents/${documentId}/report`)
        }
      />
    );
  } else if (route.name === "dashboard") {
    page = (
      <Dashboard
        onStartAnalysis={() => navigate("/documents")}
        onOpenHistory={() => navigate("/history")}
        onOpenBatch={(batchId) => navigate(`/history/${batchId}`)}
      />
    );
  } else if (route.name === "documents") {
    page = (
      <Documents
        onOpenReport={(batchId, documentId) =>
          navigate(`/history/${batchId}/documents/${documentId}/report`)
        }
      />
    );
  } else if (route.name === "history") {
    page = (
      <History
        onOpenBatch={(batchId) => navigate(`/history/${batchId}`)}
        onStartAnalysis={() => navigate("/documents")}
      />
    );
  } else if (route.name === "how-it-works") {
    page = <HowItWorks onStartAnalysis={() => navigate("/documents")} />;
  } else if (route.name === "batch") {
    page = (
      <BatchDetails
        batchId={route.batchId}
        onBack={() => navigate("/history")}
        onOpenDocument={(documentId) =>
          navigate(`/history/${route.batchId}/documents/${documentId}`)
        }
        onOpenReport={(documentId) =>
          navigate(`/history/${route.batchId}/documents/${documentId}/report`)
        }
      />
    );
  } else if (route.name === "document") {
    page = (
      <DocumentDetails
        batchId={route.batchId}
        documentId={route.documentId}
        onBack={() => navigate(`/history/${route.batchId}`)}
        onOpenReport={() =>
          navigate(
            `/history/${route.batchId}/documents/${route.documentId}/report`,
          )
        }
      />
    );
  } else if (route.name === "report") {
    page = (
      <AnalysisReport
        batchId={route.batchId}
        documentId={route.documentId}
        onBack={() => navigate(`/history/${route.batchId}`)}
        onOpenDocument={() =>
          navigate(`/history/${route.batchId}/documents/${route.documentId}`)
        }
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
        window.history.replaceState(null, "", "/home");
        setCurrentPath("/home");
        setUser(null);
      }}
    >
      {page}
    </AppLayout>
  );
}

export default App;
