import { useEffect, useState } from "react";
import {
  getBatch,
  isFinalStatus,
  type BatchDetail,
} from "../api/documents";
import StatusBadge from "../components/StatusBadge";
import { formatDateTime, pluralize } from "../utils/format";

interface BatchDetailsProps {
  batchId: number;
  onBack: () => void;
  onOpenDocument: (documentId: number) => void;
  onOpenReport: (documentId: number) => void;
}

const POLL_INTERVAL_MS = 2500;

function BatchDetails({
  batchId,
  onBack,
  onOpenDocument,
  onOpenReport,
}: BatchDetailsProps) {
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function loadBatch(showLoading: boolean) {
      if (showLoading) setLoading(true);
      setError("");

      try {
        const detail = await getBatch(batchId);
        if (cancelled) return;

        setBatch(detail);
        if (!isFinalStatus(detail.status)) {
          timer = window.setTimeout(() => loadBatch(false), POLL_INTERVAL_MS);
        }
      } catch {
        if (!cancelled) {
          setError("Não foi possível carregar os detalhes desta análise.");
        }
      } finally {
        if (!cancelled && showLoading) setLoading(false);
      }
    }

    loadBatch(true);

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [batchId, reloadKey]);

  return (
    <main className="page">
      <div className="detail-navigation">
        <button className="text-button" type="button" onClick={onBack}>
          ← Voltar ao histórico
        </button>
      </div>

      {loading ? (
        <section className="card">
          <p className="empty-state" role="status">
            Carregando análise...
          </p>
        </section>
      ) : error || batch === null ? (
        <section className="card history-feedback">
          <p className="feedback-error" role="alert">
            {error || "Análise não encontrada."}
          </p>
          <button
            className="button-ghost"
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Tentar novamente
          </button>
        </section>
      ) : (
        <>
          <div className="page-heading detail-heading">
            <div>
              <h1>Análise #{batch.id}</h1>
              <p>Enviada em {formatDateTime(batch.created_at)}</p>
            </div>
            <StatusBadge status={batch.status} />
          </div>

          <section className="summary-grid" aria-label="Resumo da análise">
            <div className="summary-card">
              <span>Documentos</span>
              <strong>{batch.total_documents}</strong>
            </div>
            <div className="summary-card">
              <span>Processados</span>
              <strong>
                {batch.processed_documents} de {batch.total_documents}
              </strong>
            </div>
            <div className="summary-card">
              <span>Conclusão</span>
              <strong>
                {batch.finished_at
                  ? formatDateTime(batch.finished_at)
                  : "Em andamento"}
              </strong>
            </div>
          </section>

          <section className="card" aria-labelledby="batch-documents-title">
            <div className="card-heading">
              <h2 id="batch-documents-title">Documentos do lote</h2>
              <span className="card-count">
                {pluralize(batch.total_documents, "documento", "documentos")}
              </span>
            </div>

            <ul className="detail-document-list">
              {batch.documents.map((document) => (
                <li key={document.id}>
                  <div className="detail-document-main">
                    <strong title={document.filename}>{document.filename}</strong>
                    <span>
                      {document.file_type.toUpperCase()} · Enviado em{" "}
                      {formatDateTime(document.created_at)}
                    </span>
                    {document.error_message && (
                      <p className="detail-document-error">{document.error_message}</p>
                    )}
                  </div>
                  <StatusBadge status={document.status} />
                  <div className="detail-document-actions">
                    {document.status === "concluido" && (
                      <button
                        className="button-primary"
                        type="button"
                        onClick={() => onOpenReport(document.id)}
                        aria-label={`Ver relatório de ${document.filename}`}
                      >
                        Ver relatório
                      </button>
                    )}
                    <button
                      className="button-ghost"
                      type="button"
                      onClick={() => onOpenDocument(document.id)}
                      aria-label={`Ver documento ${document.filename}`}
                    >
                      Ver documento
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}

export default BatchDetails;
