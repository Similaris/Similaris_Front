import type { HybridMatch, SegmentAnalysis } from "../../api/analysis";
import type { Segment } from "../../api/documents";
import { formatPercentage } from "../../utils/format";
import ClassificationBadge from "./ClassificationBadge";
import SimilarityMetric from "./SimilarityMetric";

interface SimilarityResultItemProps {
  rank: number;
  segmentAnalysis: SegmentAnalysis;
  match: HybridMatch;
  analyzedSegment?: Segment;
  featured?: boolean;
}

function displayValue(value: string): string {
  return value.trim() || "Não informado";
}

function positionLabel(position: number | undefined): string {
  return position === undefined ? "Posição indisponível" : `Trecho ${position}`;
}

function offsetLabel(
  startOffset: number | null | undefined,
  endOffset: number | null | undefined,
): string {
  if (startOffset == null || endOffset == null) return "Offsets indisponíveis";
  return `Caracteres ${startOffset}–${endOffset}`;
}

function SimilarityResultItem({
  rank,
  segmentAnalysis,
  match,
  analyzedSegment,
  featured = false,
}: SimilarityResultItemProps) {
  const sourceDocument = match.reference_document;
  const sourceSegment = match.reference_segment;

  return (
    <details className={`analysis-result${featured ? " is-featured" : ""}`}>
      <summary>
        <span className="analysis-result-disclosure" aria-hidden="true">
          ›
        </span>
        <span className="analysis-result-rank" aria-label={`Resultado ${rank}`}>
          {rank}
        </span>

        <span className="analysis-result-heading">
          <strong>{displayValue(sourceDocument.title)}</strong>
          <span className="analysis-result-meta">
            {positionLabel(analyzedSegment?.position)} · Fonte: trecho {sourceSegment.position}
          </span>
          <span className="analysis-result-preview">{segmentAnalysis.text}</span>
        </span>

        <span className="analysis-result-labels">
          {match.is_suspicious && (
            <span className="analysis-suspicious-label">Trecho suspeito</span>
          )}
          <ClassificationBadge classification={match.classification} />
        </span>

        <span className="analysis-result-score">
          <small>Score final</small>
          <strong>{formatPercentage(match.final_score)}</strong>
        </span>
      </summary>

      <div className="analysis-result-body">
        <section aria-labelledby={`result-${rank}-origin`}>
          <h3 id={`result-${rank}-origin`}>Origem da correspondência</h3>
          <dl className="analysis-origin-grid">
            <div>
              <dt>Título</dt>
              <dd>{displayValue(sourceDocument.title)}</dd>
            </div>
            <div>
              <dt>Fonte</dt>
              <dd>{displayValue(sourceDocument.source)}</dd>
            </div>
            <div>
              <dt>Corpus</dt>
              <dd>{displayValue(sourceDocument.corpus_id)}</dd>
            </div>
            <div>
              <dt>Idioma</dt>
              <dd>{displayValue(sourceDocument.language)}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby={`result-${rank}-comparison`}>
          <h3 id={`result-${rank}-comparison`}>Comparação dos textos</h3>
          <div className="analysis-text-comparison">
            <article className="analysis-text-panel is-analyzed">
              <header>
                <strong>Trecho analisado</strong>
                <span>
                  {positionLabel(analyzedSegment?.position)} ·{" "}
                  {offsetLabel(
                    analyzedSegment?.start_offset,
                    analyzedSegment?.end_offset,
                  )}
                </span>
              </header>
              <p>{segmentAnalysis.text}</p>
            </article>

            <article className="analysis-text-panel is-source">
              <header>
                <strong>Trecho encontrado na base</strong>
                <span>
                  Trecho {sourceSegment.position} ·{" "}
                  {offsetLabel(sourceSegment.start_offset, sourceSegment.end_offset)}
                </span>
              </header>
              <p>{sourceSegment.text_original}</p>
            </article>
          </div>
        </section>

        <section aria-labelledby={`result-${rank}-metrics`}>
          <h3 id={`result-${rank}-metrics`}>Scores da correspondência</h3>
          <div className="analysis-metrics-grid">
            <SimilarityMetric
              label="TF-IDF"
              score={match.tfidf_score}
              description="Similaridade lexical por frequência dos termos"
            />
            <SimilarityMetric
              label="Jaccard"
              score={match.jaccard_score}
              description="Sobreposição entre os conjuntos de palavras"
            />
            <SimilarityMetric
              label="Score lexical"
              score={match.lexical_score}
              description="Score lexical combinado pelo motor"
            />
            <SimilarityMetric
              label="SBERT"
              score={match.semantic_score}
              description="Similaridade semântica entre os textos"
            />
            <SimilarityMetric
              label="Score final"
              score={match.final_score}
              emphasized
              description="Score final combinado pelo motor"
            />
          </div>
        </section>
      </div>
    </details>
  );
}

export default SimilarityResultItem;
