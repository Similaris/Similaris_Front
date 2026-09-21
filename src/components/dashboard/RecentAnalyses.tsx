import type { RecentAnalysis } from "../../api/dashboard";
import StatusBadge from "../StatusBadge";
import { formatDateTime, pluralize } from "../../utils/format";

interface RecentAnalysesProps {
  analyses: RecentAnalysis[];
  onOpenBatch: (batchId: number) => void;
  onStartAnalysis: () => void;
}

function RecentAnalyses({ analyses, onOpenBatch, onStartAnalysis }: RecentAnalysesProps) {
  return (
    <section className="card dashboard-recent" aria-labelledby="dashboard-recent-title">
      <div className="dashboard-recent-heading">
        <div>
          <h2 id="dashboard-recent-title">Análises recentes</h2>
          <p>Os cinco últimos lotes enviados.</p>
        </div>
        {analyses.length > 0 && <span className="card-count">{analyses.length}</span>}
      </div>

      {analyses.length === 0 ? (
        <div className="dashboard-recent-empty">
          <p>Você ainda não realizou nenhuma análise.</p>
          <span>Envie um documento para ver o acompanhamento e o relatório aqui.</span>
          <button className="button-primary" type="button" onClick={onStartAnalysis}>
            Realizar primeira análise
          </button>
        </div>
      ) : (
        <ul className="dashboard-recent-list">
          {analyses.map((analysis) => {
            const hasFinished = analysis.status === "concluido";
            return (
              <li key={analysis.id}>
                <div className="dashboard-recent-main">
                  <strong>Análise #{analysis.id}</strong>
                  <span>Enviada em {formatDateTime(analysis.created_at)}</span>
                </div>
                <div className="dashboard-recent-documents">
                  <span className="dashboard-recent-label">Documentos</span>
                  <strong>{pluralize(analysis.document_count, "documento", "documentos")}</strong>
                </div>
                <StatusBadge status={analysis.status} />
                <button className={hasFinished ? "button-primary" : "button-ghost"} type="button" onClick={() => onOpenBatch(analysis.id)}>
                  {hasFinished ? "Ver detalhes" : "Ver processamento"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default RecentAnalyses;
