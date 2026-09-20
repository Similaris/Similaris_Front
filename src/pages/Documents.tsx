import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { isAxiosError } from "axios";
import {
  getBatch,
  isFinalStatus,
  listDocuments,
  uploadDocuments,
  type BatchDetail,
  type DocumentInfo,
} from "../api/documents";
import StatusBadge from "../components/StatusBadge";
import { formatDateTime } from "../utils/format";
import "./Documents.css";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];
const MAX_FILE_SIZE_MB = 20;
const BATCH_POLL_INTERVAL_MS = 2500;

function batchStateLabel(batch: BatchDetail): string {
  if (batch.status === "erro") return "Falha no processamento";
  if (batch.status === "concluido") {
    return batch.document_counts.erro > 0
      ? "Concluído com falhas"
      : "Processamento concluído";
  }
  return `Processando ${batch.processed_documents} de ${batch.total_documents}`;
}

function progressPercent(batch: BatchDetail): number {
  if (batch.total_documents === 0) return 0;
  return Math.round(
    (batch.processed_documents / batch.total_documents) * 100,
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function hasValidExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

function Documents() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [trackedBatchId, setTrackedBatchId] = useState<number | null>(null);
  const [batchDetail, setBatchDetail] = useState<BatchDetail | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshDocuments();
  }, []);

  useEffect(() => {
    if (trackedBatchId === null) return;

    let cancelled = false;
    let timer: number | undefined;

    async function poll() {
      try {
        const detail = await getBatch(trackedBatchId as number);
        if (cancelled) return;
        setBatchDetail(detail);
        if (isFinalStatus(detail.status)) {
          refreshDocuments();
          return;
        }
      } catch {
        // Falha transitória: mantém o último estado e tenta novamente.
      }
      if (!cancelled) {
        timer = window.setTimeout(poll, BATCH_POLL_INTERVAL_MS);
      }
    }

    poll();

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [trackedBatchId]);

  async function refreshDocuments() {
    setLoadingList(true);
    try {
      setDocuments(await listDocuments());
    } catch {
      setError("Não foi possível carregar os documentos.");
    } finally {
      setLoadingList(false);
    }
  }

  function acceptFiles(files: File[]) {
    setError("");

    const invalidType = files.find((file) => !hasValidExtension(file.name));
    if (invalidType) {
      setError(`Formato não suportado: ${invalidType.name}. Use PDF ou DOCX.`);
      return;
    }

    const tooLarge = files.find(
      (file) => file.size > MAX_FILE_SIZE_MB * 1024 * 1024,
    );
    if (tooLarge) {
      setError(
        `O arquivo ${tooLarge.name} excede o limite de ${MAX_FILE_SIZE_MB} MB.`,
      );
      return;
    }

    setSelectedFiles(files);
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    acceptFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (uploading) return;
    acceptFiles(Array.from(event.dataTransfer.files));
  }

  function removeFile(name: string) {
    setSelectedFiles((files) => files.filter((file) => file.name !== name));
  }

  function clearSelection() {
    setSelectedFiles([]);
    setError("");
  }

  async function handleUpload() {
    if (selectedFiles.length === 0) return;
    setError("");
    setUploading(true);
    try {
      const result = await uploadDocuments(selectedFiles);
      setBatchDetail(null);
      setTrackedBatchId(result.batch_id);
      clearSelection();
      await refreshDocuments();
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        const detail = err.response.data?.detail;
        setError(
          typeof detail === "string"
            ? detail
            : "Não foi possível enviar os arquivos.",
        );
      } else {
        setError("Não foi possível conectar ao servidor.");
      }
    } finally {
      setUploading(false);
    }
  }

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

          <div
            className={`dropzone${dragging ? " is-dragging" : ""}${
              uploading ? " is-disabled" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              if (!uploading) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <svg className="dropzone-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 16V4m0 0-4 4m4-4 4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <p className="dropzone-title">
              Arraste arquivos aqui ou{" "}
              <button
                type="button"
                className="dropzone-browse"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                selecione no computador
              </button>
            </p>
            <p className="dropzone-hint">
              PDF ou DOCX · até {MAX_FILE_SIZE_MB} MB por arquivo
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_EXTENSIONS.join(",")}
              onChange={handleFileSelection}
              hidden
            />
          </div>

          {selectedFiles.length > 0 && (
            <ul className="file-list">
              {selectedFiles.map((file) => (
                <li key={file.name}>
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    className="file-remove"
                    onClick={() => removeFile(file.name)}
                    disabled={uploading}
                    aria-label={`Remover ${file.name}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {selectedFiles.length > 0 && (
            <div className="form-actions">
              <button
                type="button"
                className="button-primary"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading
                  ? "Enviando..."
                  : `Enviar ${selectedFiles.length} arquivo${
                      selectedFiles.length > 1 ? "s" : ""
                    }`}
              </button>
              <button
                type="button"
                className="button-ghost"
                onClick={clearSelection}
                disabled={uploading}
              >
                Limpar
              </button>
            </div>
          )}

          {trackedBatchId !== null && (
            <div className="batch-monitor" role="status">
              {batchDetail === null ? (
                <p className="batch-monitor-loading">
                  Consultando andamento do lote #{trackedBatchId}...
                </p>
              ) : (
                <>
                  <div className="batch-monitor-head">
                    <h3>Lote #{batchDetail.id}</h3>
                    <span
                      className={`batch-monitor-state${
                        isFinalStatus(batchDetail.status)
                          ? ` is-${batchDetail.status}`
                          : ""
                      }`}
                    >
                      {batchStateLabel(batchDetail)}
                    </span>
                  </div>

                  <div
                    className="progress"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={batchDetail.total_documents}
                    aria-valuenow={batchDetail.processed_documents}
                  >
                    <div
                      className="progress-bar"
                      style={{ width: `${progressPercent(batchDetail)}%` }}
                    />
                  </div>

                  <ul className="batch-docs">
                    {batchDetail.documents.map((document) => (
                      <li key={document.id}>
                        <div className="batch-doc-row">
                          <span className="batch-doc-name">
                            {document.filename}
                          </span>
                          <StatusBadge status={document.status} />
                        </div>
                        {document.status === "erro" &&
                          document.error_message && (
                            <p className="batch-doc-error">
                              {document.error_message}
                            </p>
                          )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-heading">
            <h2>Meus documentos</h2>
            {!loadingList && documents.length > 0 && (
              <span className="card-count">{documents.length}</span>
            )}
          </div>

          {loadingList ? (
            <p className="empty-state">Carregando...</p>
          ) : documents.length === 0 ? (
            <p className="empty-state">
              Nenhum documento enviado ainda. O primeiro upload aparecerá aqui.
            </p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Arquivo</th>
                    <th>Tipo</th>
                    <th>Status</th>
                    <th>Enviado em</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((document) => (
                    <tr key={document.id}>
                      <td className="table-file">{document.filename}</td>
                      <td>{document.file_type.toUpperCase()}</td>
                      <td>
                        <StatusBadge status={document.status} />
                      </td>
                      <td className="table-date">
                        {formatDateTime(document.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
    </main>
  );
}

export default Documents;
