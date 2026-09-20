import type { MouseEvent, ReactNode } from "react";
import type { User } from "../api/client";
import "./AppLayout.css";

interface AppLayoutProps {
  user: User;
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  children: ReactNode;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function AppLayout({
  user,
  currentPath,
  onNavigate,
  onLogout,
  children,
}: AppLayoutProps) {
  function handleNavigation(event: MouseEvent<HTMLAnchorElement>, path: string) {
    event.preventDefault();
    onNavigate(path);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <a
            className="app-logo"
            href="/documents"
            onClick={(event) => handleNavigation(event, "/documents")}
          >
            Similaris
          </a>

          <nav className="app-nav" aria-label="Navegação principal">
            <a
              href="/documents"
              className={currentPath === "/documents" ? "is-active" : undefined}
              aria-current={currentPath === "/documents" ? "page" : undefined}
              onClick={(event) => handleNavigation(event, "/documents")}
            >
              Documentos
            </a>
            <a
              href="/history"
              className={currentPath.startsWith("/history") ? "is-active" : undefined}
              aria-current={
                currentPath.startsWith("/history") ? "page" : undefined
              }
              onClick={(event) => handleNavigation(event, "/history")}
            >
              Histórico
            </a>
          </nav>

          <div className="app-user">
            <span className="app-avatar" aria-hidden="true">
              {initialsOf(user.name)}
            </span>
            <span className="app-user-name">{user.name}</span>
            <button className="app-logout" type="button" onClick={onLogout}>
              Sair
            </button>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}

export default AppLayout;
