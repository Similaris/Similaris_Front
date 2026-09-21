import type { DocumentAnalysis } from "../../api/analysis";
import { formatPercentage } from "../../utils/format";

interface AnalysisSummaryProps {
  analysis: DocumentAnalysis;
  totalMatches: number;
}

function AnalysisSummary({ analysis, totalMatches }: AnalysisSummaryProps) {
  return (
    <section className="analysis-summary" aria-label="Resumo do relatório">
      <article className="analysis-summary-card is-primary">
        <span>Similaridade geral</span>
        <strong>{formatPercentage(analysis.overall_score)}</strong>
        <small>Score combinado do documento</small>
      </article>

      <article className="analysis-summary-card">
        <span>Trechos suspeitos</span>
        <strong>
          {analysis.suspicious_segments} de {analysis.total_segments}
        </strong>
        <small>
          {formatPercentage(analysis.suspicious_segment_percentage)} dos trechos
        </small>
      </article>

      <article className="analysis-summary-card">
        <span>Trechos analisados</span>
        <strong>
          {analysis.analyzed_segments} de {analysis.total_segments}
        </strong>
        <small>Processados pelo motor de análise</small>
      </article>

      <article className="analysis-summary-card">
        <span>Correspondências</span>
        <strong>{totalMatches}</strong>
        <small>Resultados encontrados na base</small>
      </article>
    </section>
  );
}

export default AnalysisSummary;
