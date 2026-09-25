import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../api/client";
import {
  getBatch,
  isFinalStatus,
  listDocumentSegments,
  retryDocument,
  type DocumentInfo,
  type Segment,
} from "../api/documents";
import StatusBadge from "../components/StatusBadge";
import {
  formatDateTime,
  normalizeSearchText,
  pluralize,
} from "../utils/format";

const SEGMENTS_PER_PAGE = 5;
const POLL_INTERVAL_MS = 2500;

interface DocumentDetailsProps {
  batchId: number;
  documentId: number;
  onBack: () => void;
  onOpenReport: () => void;
}

function DocumentDetails({
  batchId,
  documentId,
  onBack,
  onOpenReport,
}: DocumentDetailsProps) {
  const [document, setDocument] = useState<DocumentInfo | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [segmentSearch, setSegmentSearch] = useState("");
  const [segmentsPage, setSegmentsPage] = useState(1);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function loadDocument(showLoading: boolean) {
      if (showLoading) setLoading(true);
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
        setSegmentSearch("");
        setSegmentsPage(1);
        if (!isFinalStatus(loadedDocument.status)) {
          timer = window.setTimeout(
            () => loadDocument(false),
            POLL_INTERVAL_MS,
          );
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(requestError, "Não foi possível carregar este documento."),
          );
        }
      } finally {
        if (!cancelled && showLoading) setLoading(false);
      }
    }

    loadDocument(true);
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [batchId, documentId, reloadKey]);

  async function handleRetry() {
    setError("");
    setRetrying(true);
    try {
      await retryDocument(documentId);
      setReloadKey((value) => value + 1);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Não foi possível reenviar o documento."),
      );
    } finally {
      setRetrying(false);
    }
  }

  const normalizedSegmentSearch = normalizeSearchText(segmentSearch);
  const filteredSegments = segments.filter((segment) => {
    if (!normalizedSegmentSearch) return true;
    const searchableContent = normalizeSearchText(
      `trecho ${segment.position} ${segment.position} ${segment.text_original}`,
    );
    return searchableContent.includes(normalizedSegmentSearch);
  });
  const segmentsPageCount = Math.max(
    1,
    Math.ceil(filteredSegments.length / SEGMENTS_PER_PAGE),
  );
  const currentSegmentsPage = Math.min(segmentsPage, segmentsPageCount);
  const firstVisibleSegment = (currentSegmentsPage - 1) * SEGMENTS_PER_PAGE;
  const visibleSegments = filteredSegments.slice(
    firstVisibleSegment,
    firstVisibleSegment + SEGMENTS_PER_PAGE,
  );

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
            <div className="detail-heading-actions">
              <StatusBadge status={document.status} />
              {document.status === "concluido" && (
                <button
                  className="button-primary"
                  type="button"
                  onClick={onOpenReport}
                >
                  Ver relatório
                </button>
              )}
              {document.status === "erro" && (
                <button
                  className="button-primary"
                  type="button"
                  disabled={retrying}
                  onClick={handleRetry}
                >
                  {retrying ? "Reenviando..." : "Reprocessar"}
                </button>
              )}
            </div>
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
                  {filteredSegments.length === segments.length
                    ? pluralize(segments.length, "trecho", "trechos")
                    : `${filteredSegments.length} de ${segments.length} trechos`}
                </span>
              )}
            </div>

            {segments.length > 0 && (
              <div className="list-toolbar document-segment-tools">
                <input
                  className="list-search"
                  type="search"
                  value={segmentSearch}
                  placeholder="Pesquisar por texto ou número do trecho"
                  aria-label="Pesquisar no conteúdo extraído"
                  onChange={(event) => {
                    setSegmentSearch(event.target.value);
                    setSegmentsPage(1);
                  }}
                />
              </div>
            )}

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
            ) : filteredSegments.length === 0 ? (
              <div className="history-empty compact">
                <p>Nenhum trecho encontrado.</p>
                <span>Tente pesquisar por outro termo ou número.</span>
                <button
                  className="button-ghost"
                  type="button"
                  onClick={() => setSegmentSearch("")}
                >
                  Limpar pesquisa
                </button>
              </div>
            ) : (
              <>
                <ol className="document-segments">
                  {visibleSegments.map((segment) => (
                    <li key={segment.id}>
                      <span>Trecho {segment.position}</span>
                      <p>{segment.text_original}</p>
                    </li>
                  ))}
                </ol>

                {filteredSegments.length > SEGMENTS_PER_PAGE && (
                  <nav
                    className="document-segments-pagination"
                    aria-label="Paginação do conteúdo extraído"
                  >
                    <span>
                      Exibindo {firstVisibleSegment + 1}–
                      {Math.min(
                        firstVisibleSegment + SEGMENTS_PER_PAGE,
                        filteredSegments.length,
                      )} de {filteredSegments.length}
                    </span>
                    <div>
                      <button
                        className="button-ghost"
                        type="button"
                        disabled={currentSegmentsPage === 1}
                        onClick={() =>
                          setSegmentsPage((page) => Math.max(1, page - 1))
                        }
                      >
                        Anterior
                      </button>
                      <span>
                        Página {currentSegmentsPage} de {segmentsPageCount}
                      </span>
                      <button
                        className="button-ghost"
                        type="button"
                        disabled={currentSegmentsPage === segmentsPageCount}
                        onClick={() =>
                          setSegmentsPage((page) =>
                            Math.min(segmentsPageCount, page + 1),
                          )
                        }
                      >
                        Próxima
                      </button>
                    </div>
                  </nav>
                )}
              </>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default DocumentDetails;
