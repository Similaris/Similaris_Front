import { useEffect, useRef, useState, type ChangeEvent } from "react";
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
  return new Date(isoDate).toLocaleString("pt-BR");
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

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setError("");

    const invalidType = files.find((file) => !hasValidExtension(file.name));
    if (invalidType) {
      setError(`Formato não suportado: ${invalidType.name}. Use PDF ou DOCX.`);
      event.target.value = "";
      return;
    }

    const tooLarge = files.find(
      (file) => file.size > MAX_FILE_SIZE_MB * 1024 * 1024,
    );
    if (tooLarge) {
      setError(
        `O arquivo ${tooLarge.name} excede o limite de ${MAX_FILE_SIZE_MB} MB.`,
      );
      event.target.value = "";
      return;
    }

    setSelectedFiles(files);
  }

  function clearSelection() {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    <div className="documents-page">
      <header className="documents-header">
        <h1>Similaris</h1>
        <div className="documents-user">
          <span>{user.name}</span>
          <button type="button" onClick={onLogout}>
            Sair
          </button>
        </div>
      </header>

      <main className="documents-content">
        <section className="documents-card">
          <h2>Enviar documentos</h2>
          <p className="documents-hint">
            Selecione arquivos PDF ou DOCX (até {MAX_FILE_SIZE_MB} MB cada) para
            segmentação e análise.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS.join(",")}
            onChange={handleFileSelection}
            disabled={uploading}
          />

          {selectedFiles.length > 0 && (
            <ul className="documents-selected">
              {selectedFiles.map((file) => (
                <li key={file.name}>
                  {file.name} <span>({formatFileSize(file.size)})</span>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="documents-error">{error}</p>}

          <div className="documents-actions">
            <button
              type="button"
              className="documents-upload-button"
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
            >
              {uploading ? "Enviando..." : "Enviar"}
            </button>
            {selectedFiles.length > 0 && !uploading && (
              <button type="button" onClick={clearSelection}>
                Limpar
              </button>
            )}
          </div>

          {lastUpload && (
            <div className="documents-upload-result">
              <h3>Lote #{lastUpload.batch_id} criado</h3>
              <ul>
                {lastUpload.documents.map((document) => (
                  <li key={document.id}>
                    <strong>{document.filename}</strong>{" "}
                    {document.status === "erro"
                      ? `— falhou: ${document.error_message}`
                      : `— ${document.segment_count} segmentos gerados`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="documents-card">
          <h2>Meus documentos</h2>
          {loadingList ? (
            <p className="documents-hint">Carregando...</p>
          ) : documents.length === 0 ? (
            <p className="documents-hint">Nenhum documento enviado ainda.</p>
          ) : (
            <table className="documents-table">
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
                    <td>{document.filename}</td>
                    <td>{document.file_type.toUpperCase()}</td>
                    <td>
                      <span className={`documents-status is-${document.status}`}>
                        {STATUS_LABELS[document.status] ?? document.status}
                      </span>
                    </td>
                    <td>{formatDate(document.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

export default Documents;
