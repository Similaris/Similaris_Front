import { useEffect, useState } from "react";
import {
  getBatch,
  isFinalStatus,
  listDocumentSegments,
  type DocumentInfo,
  type Segment,
} from "../api/documents";
import StatusBadge from "../components/StatusBadge";
import { formatDateTime, pluralize } from "../utils/format";

interface DocumentDetailsProps {
  batchId: number;
  documentId: number;
  onBack: () => void;
}

function DocumentDetails({ batchId, documentId, onBack }: DocumentDetailsProps) {
  const [document, setDocument] = useState<DocumentInfo | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadDocument() {
      setLoading(true);
      setError("");

      try {
        const [batch, loadedSegments] = await Promise.all([
          getBatch(batchId),
          listDocumentSegments(documentId),
        ]);
        if (cancelled) return;

        const loadedDocument = batch.documents.find(
          (item) => item.id === documentId,
        );
        if (!loadedDocument) {
          setError("O documento não pertence a esta análise.");
          setDocument(null);
          return;
        }

        setDocument(loadedDocument);
        setSegments(loadedSegments);
      } catch {
        if (!cancelled) {
          setError("Não foi possível carregar este documento.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDocument();
    return () => {
      cancelled = true;
    };
  }, [batchId, documentId, reloadKey]);

  return (
    <main className="page">
      <div className="detail-navigation">
        <button className="text-button" type="button" onClick={onBack}>
          ← Voltar à análise
        </button>
      </div>

      {loading ? (
        <section className="card">
          <p className="empty-state" role="status">
            Carregando documento...
          </p>
        </section>
      ) : error || document === null ? (
        <section className="card history-feedback">
          <p className="feedback-error" role="alert">
            {error || "Documento não encontrado."}
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
              <h1>{document.filename}</h1>
              <p>
                {document.file_type.toUpperCase()} · Enviado em{" "}
                {formatDateTime(document.created_at)}
              </p>
            </div>
            <StatusBadge status={document.status} />
          </div>

          {document.error_message && (
            <p className="feedback-error" role="alert">
              {document.error_message}
            </p>
          )}

          <section className="card" aria-labelledby="segments-title">
            <div className="card-heading">
              <h2 id="segments-title">Conteúdo extraído</h2>
              {segments.length > 0 && (
                <span className="card-count">
                  {pluralize(segments.length, "trecho", "trechos")}
                </span>
              )}
            </div>

            {segments.length === 0 ? (
              <div className="history-empty compact">
                <p>Nenhum trecho disponível.</p>
                <span>
                  {document.status === "pendente" ||
                  document.status === "processando"
                    ? "O conteúdo aparecerá quando o processamento avançar."
                    : "Não foi possível extrair conteúdo deste documento."}
                </span>
                {!isFinalStatus(document.status) && (
                  <button
                    className="button-ghost"
                    type="button"
                    onClick={() => setReloadKey((value) => value + 1)}
                  >
                    Atualizar
                  </button>
                )}
              </div>
            ) : (
              <ol className="document-segments">
                {segments.map((segment) => (
                  <li key={segment.id}>
                    <span>Trecho {segment.position}</span>
                    <p>{segment.text_original}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <p className="report-note">
            Os indicadores de similaridade e as correspondências serão apresentados
            no relatório da próxima etapa.
          </p>
        </>
      )}
    </main>
  );
}

export default DocumentDetails;
