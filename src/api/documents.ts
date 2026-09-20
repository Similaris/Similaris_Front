import { api } from "./client";

export type ProcessingStatus =
  | "pendente"
  | "processando"
  | "concluido"
  | "erro";

export function isFinalStatus(status: ProcessingStatus): boolean {
  return status === "concluido" || status === "erro";
}

export interface DocumentInfo {
  id: number;
  batch_id: number;
  filename: string;
  file_type: string;
  status: ProcessingStatus;
  error_message: string | null;
  extraction_ms: number | null;
  lexical_ms: number | null;
  semantic_ms: number | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface BatchDocumentCounts {
  pendente: number;
  processando: number;
  concluido: number;
  erro: number;
}

export interface BatchSummary {
  id: number;
  status: ProcessingStatus;
  created_at: string;
  finished_at: string | null;
  total_documents: number;
  processed_documents: number;
  document_counts: BatchDocumentCounts;
}

export interface BatchDetail extends BatchSummary {
  documents: DocumentInfo[];
}

export interface BatchUploadResponse {
  batch_id: number;
  status: ProcessingStatus;
  documents: DocumentInfo[];
}

export interface Segment {
  id: number;
  document_id: number;
  position: number;
  start_offset: number | null;
  end_offset: number | null;
  text_original: string;
  text_clean: string | null;
}

export async function uploadDocuments(
  files: File[],
): Promise<BatchUploadResponse> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const { data } = await api.post<BatchUploadResponse>(
    "/documents/upload",
    formData,
  );
  return data;
}

export async function listDocuments(): Promise<DocumentInfo[]> {
  const { data } = await api.get<DocumentInfo[]>("/documents");
  return data;
}

export async function listBatches(): Promise<BatchSummary[]> {
  const { data } = await api.get<BatchSummary[]>("/batches");
  return data;
}

export async function getBatch(batchId: number): Promise<BatchDetail> {
  const { data } = await api.get<BatchDetail>(`/batches/${batchId}`);
  return data;
}

export async function listDocumentSegments(
  documentId: number,
): Promise<Segment[]> {
  const { data } = await api.get<Segment[]>(
    `/documents/${documentId}/segments`,
  );
  return data;
}
