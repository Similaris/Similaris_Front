import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { isAxiosError } from "axios";
import type { User } from "../api/client";
import {
  listDocuments,
  uploadDocuments,
  type BatchUploadResponse,
  type DocumentInfo,
} from "../api/documents";
import "./Documents.css";

interface DocumentsProps {
  user: User;
  onLogout: () => void;
}

const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];
const MAX_FILE_SIZE_MB = 20;

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  processando: "Processando",
  concluido: "Concluído",
  erro: "Erro",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function hasValidExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

function Documents({ user, onLogout }: DocumentsProps) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [lastUpload, setLastUpload] = useState<BatchUploadResponse | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshDocuments();
  }, []);

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
      setLastUpload(result);
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
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <span className="app-logo">Similaris</span>

          <div className="app-user">
            <span className="app-avatar" aria-hidden="true">
              {initialsOf(user.name)}
            </span>
            <span className="app-user-name">{user.name}</span>
            <button className="app-logout" type="button" onClick={onLogout}>
              Sair
            </button>
          </div>
        </div>
      </header>

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

          {lastUpload && (
            <div className="upload-summary" role="status">
              <h3>Lote #{lastUpload.batch_id} criado</h3>
              <ul>
                {lastUpload.documents.map((document) => (
                  <li key={document.id}>
                    <strong>{document.filename}</strong>
                    {document.status === "erro"
                      ? ` — falhou: ${document.error_message}`
                      : ` — ${document.segment_count} segmentos gerados`}
                  </li>
                ))}
              </ul>
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
                        <span className={`status-pill is-${document.status}`}>
                          {STATUS_LABELS[document.status] ?? document.status}
                        </span>
                      </td>
                      <td className="table-date">
                        {formatDate(document.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Documents;
