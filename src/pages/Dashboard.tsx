import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { getDashboard, type DashboardData } from "../api/dashboard";
import AnalysisTimelineChart from "../components/dashboard/AnalysisTimelineChart";
import DashboardSummary from "../components/dashboard/DashboardSummary";
import RecentAnalyses from "../components/dashboard/RecentAnalyses";
import SimilarityDistributionChart from "../components/dashboard/SimilarityDistributionChart";
import StatusDistributionChart from "../components/dashboard/StatusDistributionChart";
import "./Dashboard.css";

interface DashboardProps {
  onStartAnalysis: () => void;
  onOpenHistory: () => void;
  onOpenBatch: (batchId: number) => void;
}

function errorMessage(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return "Não foi possível conectar ao servidor para carregar o Dashboard.";
  }

  if (error.response.status === 401) {
    return "Sua sessão expirou. Entre novamente para acessar o Dashboard.";
  }

  const detail = error.response.data?.detail;
  return typeof detail === "string"
    ? detail
    : "Não foi possível carregar os dados do Dashboard.";
}

function DashboardLoading() {
  return (
    <div className="dashboard-loading" aria-label="Carregando Dashboard" role="status">
      <div className="dashboard-loading-heading" />
      <div className="dashboard-loading-summary">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} />
        ))}
      </div>
      <div className="dashboard-loading-charts">
        <div />
        <div />
      </div>
      <div className="dashboard-loading-wide" />
    </div>
  );
}

function Dashboard({ onStartAnalysis, onOpenHistory, onOpenBatch }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const dashboard = await getDashboard();
        if (!cancelled) setData(dashboard);
      } catch (requestError) {
        if (!cancelled) setError(errorMessage(requestError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <main className="page dashboard-page">
      <div className="page-heading dashboard-heading">
        <div>
          <span className="dashboard-eyebrow">Visão geral</span>
          <h1>Dashboard</h1>
          <p>Acompanhe suas análises e acesse rapidamente as ações principais.</p>
        </div>
        <div className="dashboard-heading-actions">
          <button className="button-ghost" type="button" onClick={onOpenHistory}>
            Ver histórico
          </button>
          <button className="button-primary" type="button" onClick={onStartAnalysis}>
            Nova análise
          </button>
        </div>
      </div>

      {loading ? (
        <DashboardLoading />
      ) : error || data === null ? (
        <section className="card dashboard-error">
          <p className="feedback-error" role="alert">
            {error || "Não foi possível carregar os dados do Dashboard."}
          </p>
          <button
            className="button-primary"
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Tentar novamente
          </button>
        </section>
      ) : (
        <>
          <section className="dashboard-overview" aria-labelledby="dashboard-overview-title">
            <div className="dashboard-section-heading">
              <div>
                <h2 id="dashboard-overview-title">Resumo das análises</h2>
                <p>Indicadores agregados da sua conta.</p>
              </div>
              <button
                className="text-button"
                type="button"
                onClick={() => setReloadKey((value) => value + 1)}
              >
                Atualizar dados
              </button>
            </div>
            <DashboardSummary summary={data.summary} />
          </section>

          <section className="dashboard-charts-row" aria-label="Gráficos de análises">
            <StatusDistributionChart distribution={data.status_distribution} />
            <AnalysisTimelineChart analyses={data.analyses_over_time} />
          </section>

          <SimilarityDistributionChart distribution={data.similarity_distribution} />

          <RecentAnalyses
            analyses={data.recent_analyses}
            onOpenBatch={onOpenBatch}
            onStartAnalysis={onStartAnalysis}
          />
        </>
      )}
    </main>
  );
}

export default Dashboard;
