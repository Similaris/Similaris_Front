import { useEffect, useMemo, useState } from "react";
import {
  isFinalStatus,
  listDocuments,
  retryDocument,
  type DocumentInfo,
} from "../api/documents";
import { getApiErrorMessage } from "../api/client";
import DocumentUpload from "../components/DocumentUpload";
import StatusBadge from "../components/StatusBadge";
import { formatDateTime, normalizeSearchText } from "../utils/format";
import "./Documents.css";

const DOCUMENTS_PER_PAGE = 8;

type DocumentStatusFilter = "all" | DocumentInfo["status"];
type DocumentTypeFilter = "all" | "pdf" | "docx";

interface DocumentsProps {
  onOpenReport: (batchId: number, documentId: number) => void;
}

function Documents({ onOpenReport }: DocumentsProps) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [error, setError] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [documentsPage, setDocumentsPage] = useState(1);
  const [documentSearch, setDocumentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<DocumentTypeFilter>("all");
  const [retryingDocumentId, setRetryingDocumentId] = useState<number | null>(null);

  useEffect(() => {
    refreshDocuments();
  }, []);

  useEffect(() => {
    if (!documents.some((document) => !isFinalStatus(document.status))) return;

    const timer = window.setTimeout(async () => {
      try {
        setDocuments(await listDocuments());
      } catch {
        // Mantém a lista atual; a próxima interação tentará novamente.
      }
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [documents]);

  async function refreshDocuments() {
    setLoadingList(true);
    setError("");
    try {
      const loadedDocuments = await listDocuments();
      setDocuments(loadedDocuments);
      setDocumentsPage(1);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Não foi possível carregar os documentos."),
      );
    } finally {
      setLoadingList(false);
    }
  }

  async function handleRetry(documentId: number) {
    setError("");
    setRetryingDocumentId(documentId);
    try {
      const retriedDocument = await retryDocument(documentId);
      setDocuments((current) =>
        current.map((document) =>
          document.id === retriedDocument.id ? retriedDocument : document,
        ),
      );
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Não foi possível reenviar o documento."),
      );
    } finally {
      setRetryingDocumentId(null);
    }
  }

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = normalizeSearchText(documentSearch);
    return documents.filter((document) => {
      const matchesSearch =
        !normalizedSearch ||
        normalizeSearchText(document.filename).includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "all" || document.status === statusFilter;
      const matchesType =
        typeFilter === "all" || document.file_type.toLowerCase() === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [documentSearch, documents, statusFilter, typeFilter]);

  const documentsPageCount = Math.max(
    1,
    Math.ceil(filteredDocuments.length / DOCUMENTS_PER_PAGE),
  );
  const currentDocumentsPage = Math.min(documentsPage, documentsPageCount);
  const firstVisibleDocument = (currentDocumentsPage - 1) * DOCUMENTS_PER_PAGE;
  const visibleDocuments = filteredDocuments.slice(
    firstVisibleDocument,
    firstVisibleDocument + DOCUMENTS_PER_PAGE,
  );

  return (
    <main className="page">
        <div className="page-heading">
          <h1>Documentos</h1>
          <p>Envie trabalhos em PDF ou DOCX para segmentação e análise.</p>
        </div>

        <section className="card">
          <div className="card-heading">
            <h2>Novo envio</h2>
          </div>
          <DocumentUpload
            onOpenReport={onOpenReport}
            onDocumentsChanged={refreshDocuments}
          />
        </section>

        <section className="card">
          <div className="card-heading">
            <h2>Meus documentos</h2>
            {!loadingList && documents.length > 0 && (
              <span className="card-count">
                {filteredDocuments.length === documents.length
                  ? documents.length
                  : `${filteredDocuments.length} de ${documents.length}`}
              </span>
            )}
          </div>

          {!loadingList && documents.length > 0 && (
            <div className="list-toolbar document-list-tools">
              <input
                className="list-search"
                type="search"
                value={documentSearch}
                placeholder="Pesquisar por nome do documento"
                aria-label="Pesquisar documentos"
                onChange={(event) => {
                  setDocumentSearch(event.target.value);
                  setDocumentsPage(1);
                }}
              />
              <select
                className="list-filter"
                value={statusFilter}
                aria-label="Filtrar documentos por status"
                onChange={(event) => {
                  setStatusFilter(event.target.value as DocumentStatusFilter);
                  setDocumentsPage(1);
                }}
              >
                <option value="all">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="processando">Processando</option>
                <option value="concluido">Concluído</option>
                <option value="erro">Erro</option>
              </select>
              <select
                className="list-filter"
                value={typeFilter}
                aria-label="Filtrar documentos por tipo"
                onChange={(event) => {
                  setTypeFilter(event.target.value as DocumentTypeFilter);
                  setDocumentsPage(1);
                }}
              >
                <option value="all">Todos os tipos</option>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
              </select>
            </div>
          )}

          {loadingList ? (
            <p className="empty-state">Carregando...</p>
          ) : error ? (
            <div className="history-feedback">
              <p className="feedback-error" role="alert">{error}</p>
              <button className="button-ghost" type="button" onClick={refreshDocuments}>
                Tentar novamente
              </button>
            </div>
          ) : documents.length === 0 ? (
            <p className="empty-state">
              Nenhum documento enviado ainda. O primeiro upload aparecerá aqui.
            </p>
          ) : filteredDocuments.length === 0 ? (
            <div className="history-empty compact document-filter-empty">
              <p>Nenhum documento encontrado.</p>
              <span>Altere a pesquisa ou os filtros selecionados.</span>
              <button
                className="button-ghost"
                type="button"
                onClick={() => {
                  setDocumentSearch("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                  setDocumentsPage(1);
                }}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Arquivo</th>
                      <th>Tipo</th>
                      <th>Status</th>
                      <th>Enviado em</th>
                      <th>Relatório</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleDocuments.map((document) => (
                      <tr key={document.id}>
                        <td className="table-file">{document.filename}</td>
                        <td>{document.file_type.toUpperCase()}</td>
                        <td>
                          <StatusBadge status={document.status} />
                        </td>
                        <td className="table-date">
                          {formatDateTime(document.created_at)}
                        </td>
                        <td className="table-action">
                          {document.status === "concluido" ? (
                            <button
                              className="button-ghost"
                              type="button"
                              onClick={() =>
                                onOpenReport(document.batch_id, document.id)
                              }
                              aria-label={`Ver relatório de ${document.filename}`}
                            >
                              Ver relatório
                            </button>
                          ) : document.status === "erro" ? (
                            <button
                              className="button-ghost"
                              type="button"
                              disabled={retryingDocumentId === document.id}
                              onClick={() => handleRetry(document.id)}
                              aria-label={`Reprocessar ${document.filename}`}
                            >
                              {retryingDocumentId === document.id
                                ? "Reenviando..."
                                : "Reprocessar"}
                            </button>
                          ) : (
                            <span aria-hidden="true">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredDocuments.length > DOCUMENTS_PER_PAGE && (
                <nav
                  className="documents-pagination"
                  aria-label="Paginação dos documentos"
                >
                  <span>
                    Exibindo {firstVisibleDocument + 1}–
                    {Math.min(
                      firstVisibleDocument + DOCUMENTS_PER_PAGE,
                      filteredDocuments.length,
                    )} de {filteredDocuments.length}
                  </span>
                  <div>
                    <button
                      className="button-ghost"
                      type="button"
                      disabled={currentDocumentsPage === 1}
                      onClick={() =>
                        setDocumentsPage((page) => Math.max(1, page - 1))
                      }
                    >
                      Anterior
                    </button>
                    <span>
                      Página {currentDocumentsPage} de {documentsPageCount}
                    </span>
                    <button
                      className="button-ghost"
                      type="button"
                      disabled={currentDocumentsPage === documentsPageCount}
                      onClick={() =>
                        setDocumentsPage((page) =>
                          Math.min(documentsPageCount, page + 1),
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
    </main>
  );
}

export default Documents;
