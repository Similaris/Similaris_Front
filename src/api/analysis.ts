import type { ProcessingStatus } from "./documents";
import { api } from "./client";

export type SimilarityClassification =
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "VERY_HIGH";

export interface ReferenceDocument {
  id: number;
  corpus_id: string;
  source: string;
  language: string;
  title: string;
}

export interface ReferenceSegment {
  id: number;
  position: number;
  start_offset: number;
  end_offset: number;
  text_original: string;
}

export interface HybridMatch {
  reference_document: ReferenceDocument;
  reference_segment: ReferenceSegment;
  tfidf_score: number;
  jaccard_score: number;
  semantic_score: number;
  lexical_score: number;
  final_score: number;
  classification: SimilarityClassification;
  is_suspicious: boolean;
}

export interface SegmentAnalysis {
  segment_id: number;
  text: string;
  matches: HybridMatch[];
  best_match: HybridMatch | null;
  segment_score: number;
  classification: SimilarityClassification;
  is_suspicious: boolean;
}

export interface DocumentAnalysis {
  document_id: number;
  filename: string;
  status: ProcessingStatus;
  error_message: string | null;
  total_segments: number;
  analyzed_segments: number;
  suspicious_segments: number;
  overall_score: number;
  suspicious_segment_percentage: number;
  extraction_ms: number | null;
  lexical_ms: number;
  semantic_ms: number;
  analysis_profile: Record<string, unknown> | null;
  reference_fingerprint: string | null;
  segments: SegmentAnalysis[];
}

export async function getDocumentAnalysis(
  documentId: number,
): Promise<DocumentAnalysis> {
  const { data } = await api.get<DocumentAnalysis>(
    `/documents/${documentId}/analysis`,
  );
  return data;
}
