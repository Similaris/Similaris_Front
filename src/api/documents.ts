import { api } from "./client";

export interface DocumentInfo {
  id: number;
  batch_id: number;
  filename: string;
  file_type: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface UploadedDocument extends DocumentInfo {
  segment_count: number;
}

export interface BatchUploadResponse {
  batch_id: number;
  status: string;
  documents: UploadedDocument[];
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

export async function listDocumentSegments(
  documentId: number,
): Promise<Segment[]> {
  const { data } = await api.get<Segment[]>(
    `/documents/${documentId}/segments`,
  );
  return data;
}
