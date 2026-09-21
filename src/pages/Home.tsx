import { useEffect, useState } from "react";
import { getDashboard, type RecentAnalysis } from "../api/dashboard";
import DocumentUpload from "../components/DocumentUpload";
import SimilarisBrand from "../components/SimilarisBrand";
import StatusBadge from "../components/StatusBadge";
import { formatDateTime, pluralize } from "../utils/format";
import "./Home.css";

interface HomeProps {
  onStartAnalysis: () => void;
  onOpenHistory: () => void;
  onOpenDashboard: () => void;
  onOpenBatch: (batchId: number) => void;
  onOpenReport: (batchId: number, documentId: number) => void;
}

function Home({
  onStartAnalysis,
  onOpenHistory,
  onOpenDashboard,
  onOpenBatch,
  onOpenReport,
}: HomeProps) {
  const [analyses, setAnalyses] = useState<RecentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getDashboard()
      .then((data) => {
        if (!cancelled) setAnalyses(data.recent_analyses);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar as análises recentes.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-content">
          <h1 id="home-title" className="home-visually-hidden">Similaris</h1>
          <SimilarisBrand showSubtitle />
          <div className="home-upload-card">
            <DocumentUpload onOpenReport={onOpenReport} featured />
          </div>
        </div>

        <div className="home-hero-art" aria-hidden="true">
          <div className="home-paper paper-back"><span /><span /><span /><span /></div>
          <div className="home-paper paper-front">
            <span /><span /><span className="is-alert" /><span /><span className="is-safe" /><span />
          </div>
          <div className="home-score-card">
            <small>Análise híbrida</small>
            <strong>Lexical + semântica</strong>
            <span><i /></span>
          </div>
        </div>
      </section>

      <section className="home-shortcuts" aria-label="Acessos rápidos">
        <button className="home-shortcut is-blue" type="button" onClick={onStartAnalysis}>
          <span className="home-shortcut-icon" aria-hidden="true">＋</span>
          <span><strong>Nova análise</strong><small>Envie documentos para verificar similaridade.</small></span>
          <b aria-hidden="true">›</b>
        </button>
        <button className="home-shortcut is-green" type="button" onClick={onOpenHistory}>
          <span className="home-shortcut-icon" aria-hidden="true">≡</span>
          <span><strong>Histórico de análises</strong><small>Acesse os lotes e relatórios anteriores.</small></span>
          <b aria-hidden="true">›</b>
        </button>
        <button className="home-shortcut is-purple" type="button" onClick={onOpenDashboard}>
          <span className="home-shortcut-icon" aria-hidden="true">▥</span>
          <span><strong>Dashboard</strong><small>Visualize indicadores e distribuições.</small></span>
          <b aria-hidden="true">›</b>
        </button>
      </section>

      <section className="home-recent" aria-labelledby="home-recent-title">
        <div className="home-recent-heading">
          <div>
            <h2 id="home-recent-title">Análises recentes</h2>
            <p>Últimos lotes enviados para o Similaris.</p>
          </div>
          <button className="text-button" type="button" onClick={onOpenHistory}>
            Ver histórico completo
          </button>
        </div>

        {loading ? (
          <div className="home-recent-loading" role="status" aria-label="Carregando análises recentes">
            <span /><span /><span />
          </div>
        ) : error ? (
          <div className="home-recent-state">
            <p className="feedback-error" role="alert">{error}</p>
            <button className="button-ghost" type="button" onClick={() => { setLoading(true); setError(""); setReloadKey((value) => value + 1); }}>
              Tentar novamente
            </button>
          </div>
        ) : analyses.length === 0 ? (
          <div className="home-recent-state is-empty">
            <p>Você ainda não realizou nenhuma análise.</p>
            <button className="button-primary" type="button" onClick={onStartAnalysis}>Realizar primeira análise</button>
          </div>
        ) : (
          <ul className="home-recent-list">
            {analyses.map((analysis) => (
              <li key={analysis.id}>
                <span className="home-file-icon" aria-hidden="true">▤</span>
                <div className="home-recent-main">
                  <strong>Análise #{analysis.id}</strong>
                  <span>{formatDateTime(analysis.created_at)}</span>
                </div>
                <span className="home-recent-count">{pluralize(analysis.document_count, "documento", "documentos")}</span>
                <StatusBadge status={analysis.status} />
                <button className="button-ghost" type="button" onClick={() => onOpenBatch(analysis.id)}>
                  {analysis.status === "concluido" ? "Ver resultados" : "Acompanhar"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default Home;
