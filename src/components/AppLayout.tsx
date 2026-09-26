import { useState, type MouseEvent, type ReactNode } from "react";
import type { User } from "../api/client";
import SimilarisBrand from "./SimilarisBrand";
import "./AppLayout.css";

interface AppLayoutProps {
  user: User;
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  children: ReactNode;
}

type NavigationIconName = "home" | "upload" | "history" | "dashboard" | "info";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function NavigationIcon({ name }: { name: NavigationIconName }) {
  const paths: Record<NavigationIconName, ReactNode> = {
    home: <><path d="M3.5 10.5 12 3l8.5 7.5" /><path d="M5.5 9.5V21h13V9.5M9.5 21v-7h5v7" /></>,
    upload: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
    history: <><path d="M12 7v5l3 2" /><path d="M4.5 8A8 8 0 1 1 4 16" /><path d="M4.5 8H8M4.5 8V4.5" /></>,
    dashboard: <><path d="M4 13h6v8H4zM14 3h6v8h-6zM4 3h6v6H4zM14 15h6v6h-6z" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.1" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {paths[name]}
      </g>
    </svg>
  );
}

function AppLayout({ user, currentPath, onNavigate, onLogout, children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: Array<{
    path: string;
    label: string;
    icon: NavigationIconName;
    active: boolean;
  }> = [
    { path: "/home", label: "Início", icon: "home", active: currentPath === "/home" },
    { path: "/documents", label: "Nova análise", icon: "upload", active: currentPath === "/documents" },
    { path: "/history", label: "Histórico", icon: "history", active: currentPath.startsWith("/history") },
    { path: "/dashboard", label: "Dashboard", icon: "dashboard", active: currentPath === "/dashboard" },
    { path: "/como-funciona", label: "Como funciona", icon: "info", active: currentPath === "/como-funciona" },
  ];

  function handleNavigation(event: MouseEvent<HTMLAnchorElement>, path: string) {
    event.preventDefault();
    setSidebarOpen(false);
    onNavigate(path);
  }

  return (
    <div className="app-shell">
      <aside className={`app-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <a className="app-sidebar-brand" href="/home" onClick={(event) => handleNavigation(event, "/home")}>
          <SimilarisBrand compact light />
        </a>

        <nav className="app-nav" aria-label="Navegação principal">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={item.active ? "is-active" : undefined}
              aria-current={item.active ? "page" : undefined}
              onClick={(event) => handleNavigation(event, item.path)}
            >
              <NavigationIcon name={item.icon} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="app-sidebar-footer">
          <div className="app-user">
            <span className="app-avatar" aria-hidden="true">{initialsOf(user.name)}</span>
            <span className="app-user-copy">
              <strong title={user.name}>{user.name}</strong>
              <small title={user.email}>{user.email}</small>
            </span>
          </div>
          <button className="app-logout" type="button" onClick={onLogout}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sair
          </button>
        </div>
      </aside>

      {sidebarOpen && <button className="app-sidebar-backdrop" type="button" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)} />}

      <div className="app-main">
        <header className="app-header">
          <button className="app-menu-button" type="button" aria-label="Abrir menu" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((open) => !open)}>
            <span /><span /><span />
          </button>
          <span className="app-header-brand"><SimilarisBrand compact /></span>
          <span className="app-header-user">
            <span className="app-header-avatar">{initialsOf(user.name)}</span>
            <strong>{user.name.split(/\s+/)[0]}</strong>
          </span>
        </header>
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}

export default AppLayout;
