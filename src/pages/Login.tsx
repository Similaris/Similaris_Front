import { useState, type FormEvent } from "react";
import { getApiErrorMessage, login, register, type User } from "../api/client";
import SimilarisBrand from "../components/SimilarisBrand";
import "./Login.css";

interface LoginProps {
  onLogin: (user: User) => void;
}

function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await register(name, email, password);
      }
      const user = await login(email, password);
      onLogin(user);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Dados inválidos, verifique os campos.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <aside className="auth-brand">
        <SimilarisBrand light showSubtitle />

        <div className="auth-brand-copy">
          <span className="auth-brand-rule" aria-hidden="true" />
          <h2>Integridade acadêmica com base em evidências.</h2>
          <p>
            Análise de similaridade lexical e semântica para trabalhos de
            graduação, com relatórios detalhados por trecho.
          </p>
        </div>

        <p className="auth-brand-footer">Trabalho de Graduação · FATEC</p>
      </aside>

      <main className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-mobile-brand">
            <SimilarisBrand showSubtitle />
          </div>

          <header className="auth-card-header">
            <h1>{mode === "login" ? "Entrar" : "Criar conta"}</h1>
            <p>
              {mode === "login"
                ? "Acesse sua conta para enviar e acompanhar análises."
                : "Preencha os dados abaixo para começar a usar o Similaris."}
            </p>
          </header>

          {mode === "register" && (
            <div className="auth-field">
              <label htmlFor="auth-name">Nome</label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                minLength={2}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">E-mail</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Senha</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? "Aguarde..."
              : mode === "login"
                ? "Entrar"
                : "Cadastrar e entrar"}
          </button>

          <p className="auth-switch">
            {mode === "login" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {mode === "login" ? "Cadastre-se" : "Entrar"}
            </button>
          </p>
        </form>
      </main>
    </div>
  );
}

export default Login;
