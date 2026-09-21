import type { ProcessingStatus } from "./documents";
import { api } from "./client";

export interface DashboardSummary {
  total_batches: number;
  total_documents: number;
  completed_batches: number;
  processing_batches: number;
}

export interface BatchStatusDistribution {
  pendente: number;
  processando: number;
  concluido: number;
  erro: number;
}

export interface SimilarityDistribution {
  low: number;
  moderate: number;
  high: number;
  very_high: number;
}

export interface AnalysisOverTime {
  period: string;
  count: number;
}

export interface RecentAnalysis {
  id: number;
  status: ProcessingStatus;
  created_at: string;
  finished_at: string | null;
  document_count: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  status_distribution: BatchStatusDistribution;
  similarity_distribution: SimilarityDistribution;
  analyses_over_time: AnalysisOverTime[];
  recent_analyses: RecentAnalysis[];
}

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await api.get<DashboardData>("/dashboard");
  return data;
}
