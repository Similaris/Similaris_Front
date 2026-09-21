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
  uploadDocuments,
  type BatchDetail,
} from "../api/documents";
import StatusBadge from "./StatusBadge";
import "../pages/Documents.css";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];
const MAX_FILE_SIZE_MB = 20;
const BATCH_POLL_INTERVAL_MS = 2500;

interface DocumentUploadProps {
  onOpenReport: (batchId: number, documentId: number) => void;
  onDocumentsChanged?: () => void;
  featured?: boolean;
}

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
  return Math.round((batch.processed_documents / batch.total_documents) * 100);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function hasValidExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

function DocumentUpload({
  onOpenReport,
  onDocumentsChanged,
  featured = false,
}: DocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [trackedBatchId, setTrackedBatchId] = useState<number | null>(null);
  const [batchDetail, setBatchDetail] = useState<BatchDetail | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onOpenReportRef = useRef(onOpenReport);
  const onDocumentsChangedRef = useRef(onDocumentsChanged);

  useEffect(() => {
    onOpenReportRef.current = onOpenReport;
    onDocumentsChangedRef.current = onDocumentsChanged;
  }, [onDocumentsChanged, onOpenReport]);

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
          onDocumentsChangedRef.current?.();
          const completedDocument = detail.documents.find(
            (document) => document.status === "concluido",
          );
          if (completedDocument) {
            onOpenReportRef.current(detail.id, completedDocument.id);
          }
          return;
        }
      } catch {
        // Falhas transitórias são verificadas novamente no próximo ciclo.
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
    if (!uploading) acceptFiles(Array.from(event.dataTransfer.files));
  }

  async function handleUpload() {
    if (selectedFiles.length === 0) return;
    setError("");
    setUploading(true);
    try {
      const result = await uploadDocuments(selectedFiles);
      setBatchDetail(null);
      setTrackedBatchId(result.batch_id);
      setSelectedFiles([]);
      onDocumentsChangedRef.current?.();
    } catch (requestError) {
      if (isAxiosError(requestError) && requestError.response) {
        const detail = requestError.response.data?.detail;
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
    <div className={`document-upload${featured ? " is-featured" : ""}`}>
      <div
        className={`dropzone${dragging ? " is-dragging" : ""}${
          uploading ? " is-disabled" : ""
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <svg className="dropzone-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 16V4m0 0-4 4m4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <p className="dropzone-title">
          <strong>Envie um arquivo para analisar</strong>
          <span>Arraste e solte aqui ou selecione no computador</span>
        </p>
        <button
          type="button"
          className="button-primary dropzone-select"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          Selecionar arquivo
        </button>
        <p className="dropzone-hint">
          PDF ou DOCX · até {MAX_FILE_SIZE_MB} MB por arquivo
        </p>
        <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_EXTENSIONS.join(",")} onChange={handleFileSelection} hidden />
      </div>

      {selectedFiles.length > 0 && (
        <ul className="file-list">
          {selectedFiles.map((file) => (
            <li key={`${file.name}-${file.size}`}>
              <span className="file-name">{file.name}</span>
              <span className="file-size">{formatFileSize(file.size)}</span>
              <button type="button" className="file-remove" onClick={() => setSelectedFiles((files) => files.filter((item) => item !== file))} disabled={uploading} aria-label={`Remover ${file.name}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}

      {selectedFiles.length > 0 && (
        <div className="form-actions">
          <button type="button" className="button-primary" onClick={handleUpload} disabled={uploading}>
            {uploading ? "Enviando..." : `Enviar ${selectedFiles.length} arquivo${selectedFiles.length > 1 ? "s" : ""}`}
          </button>
          <button type="button" className="button-ghost" onClick={() => { setSelectedFiles([]); setError(""); }} disabled={uploading}>
            Limpar
          </button>
        </div>
      )}

      {trackedBatchId !== null && (
        <div className="batch-monitor" role="status">
          {batchDetail === null ? (
            <p className="batch-monitor-loading">Consultando andamento do lote #{trackedBatchId}...</p>
          ) : (
            <>
              <div className="batch-monitor-head">
                <h3>Lote #{batchDetail.id}</h3>
                <span className={`batch-monitor-state${isFinalStatus(batchDetail.status) ? ` is-${batchDetail.status}` : ""}`}>
                  {batchStateLabel(batchDetail)}
                </span>
              </div>
              <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={batchDetail.total_documents} aria-valuenow={batchDetail.processed_documents}>
                <div className="progress-bar" style={{ width: `${progressPercent(batchDetail)}%` }} />
              </div>
              <ul className="batch-docs">
                {batchDetail.documents.map((document) => (
                  <li key={document.id}>
                    <div className="batch-doc-row">
                      <span className="batch-doc-name">{document.filename}</span>
                      <StatusBadge status={document.status} />
                    </div>
                    {document.status === "erro" && document.error_message && (
                      <p className="batch-doc-error">{document.error_message}</p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default DocumentUpload;
