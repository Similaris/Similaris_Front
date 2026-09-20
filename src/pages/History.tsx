import { useEffect, useState } from "react";
import {
  isFinalStatus,
  listBatches,
  type BatchSummary,
} from "../api/documents";
import StatusBadge from "../components/StatusBadge";
import { formatDateTime, pluralize } from "../utils/format";
import "./History.css";

interface HistoryProps {
  onOpenBatch: (batchId: number) => void;
  onStartAnalysis: () => void;
}

const POLL_INTERVAL_MS = 2500;

function History({ onOpenBatch, onStartAnalysis }: HistoryProps) {
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function loadHistory(showLoading: boolean) {
      if (showLoading) setLoading(true);
      setError("");

      try {
        const loadedBatches = await listBatches();
        if (cancelled) return;

        setBatches(loadedBatches);
        if (loadedBatches.some((batch) => !isFinalStatus(batch.status))) {
          timer = window.setTimeout(() => loadHistory(false), POLL_INTERVAL_MS);
        }
      } catch {
        if (!cancelled) {
          setError("Não foi possível carregar o histórico de análises.");
        }
      } finally {
        if (!cancelled && showLoading) setLoading(false);
      }
    }

    loadHistory(true);

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [reloadKey]);

  return (
    <main className="page">
      <div className="page-heading">
        <h1>Histórico de análises</h1>
        <p>Acompanhe os lotes enviados e acesse seus documentos.</p>
      </div>

      <section className="card" aria-labelledby="history-list-title">
        <div className="card-heading">
          <h2 id="history-list-title">Minhas análises</h2>
          {!loading && batches.length > 0 && (
            <span className="card-count">{batches.length}</span>
          )}
        </div>

        {loading ? (
          <p className="empty-state" role="status">
            Carregando histórico...
          </p>
        ) : error ? (
          <div className="history-feedback">
            <p className="feedback-error" role="alert">
              {error}
            </p>
            <button
              className="button-ghost"
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              Tentar novamente
            </button>
          </div>
        ) : batches.length === 0 ? (
          <div className="history-empty">
            <p>Nenhuma análise encontrada.</p>
            <span>Envie documentos para realizar sua primeira análise.</span>
            <button className="button-primary" type="button" onClick={onStartAnalysis}>
              Enviar documentos
            </button>
          </div>
        ) : (
          <ol className="history-list">
            {batches.map((batch) => (
              <li key={batch.id} className="history-item">
                <div className="history-item-main">
                  <strong>Análise #{batch.id}</strong>
                  <span>{formatDateTime(batch.created_at)}</span>
                </div>
                <div className="history-item-documents">
                  <span className="history-label">Documentos</span>
                  <strong>
                    {pluralize(batch.total_documents, "documento", "documentos")}
                  </strong>
                </div>
                <div className="history-item-status">
                  <span className="history-label">Status</span>
                  <StatusBadge status={batch.status} />
                </div>
                <button
                  className="button-ghost history-open"
                  type="button"
                  onClick={() => onOpenBatch(batch.id)}
                  aria-label={`Ver detalhes da análise ${batch.id}`}
                >
                  Ver detalhes
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

export default History;
