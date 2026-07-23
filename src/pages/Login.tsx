import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { login, register, type User } from "../api/client";
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
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        const detail = err.response.data?.detail;
        setError(
          typeof detail === "string" ? detail : "Dados inválidos, verifique os campos.",
        );
      } else {
        setError("Não foi possível conectar ao servidor.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Similaris</h1>
        <p className="login-subtitle">
          {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
        </p>

        {mode === "register" && (
          <label>
            Nome
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              required
            />
          </label>
        )}

        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>

        {error && <p className="login-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Cadastrar e entrar"}
        </button>

        <button
          type="button"
          className="login-toggle"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login"
            ? "Não tem conta? Cadastre-se"
            : "Já tem conta? Entrar"}
        </button>
      </form>
    </div>
  );
}

export default Login;
