import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import {
  getDocumentAnalysis,
  type DocumentAnalysis,
  type HybridMatch,
  type SegmentAnalysis,
  type SimilarityClassification,
} from "../api/analysis";
import {
  getBatch,
  listDocumentSegments,
  type DocumentInfo,
  type Segment,
} from "../api/documents";
import AnalysisSummary from "../components/analysis/AnalysisSummary";
import SimilarityResultItem from "../components/analysis/SimilarityResultItem";
import StatusBadge from "../components/StatusBadge";
import { formatDateTime, normalizeSearchText } from "../utils/format";
import "./AnalysisReport.css";

interface AnalysisReportProps {
  batchId: number;
  documentId: number;
  onBack: () => void;
  onOpenDocument: () => void;
}

interface LoadedReport {
  document: DocumentInfo;
  analysis: DocumentAnalysis;
  segments: Segment[];
}

interface RankedMatch {
  rank: number;
  segmentAnalysis: SegmentAnalysis;
  match: HybridMatch;
  analyzedSegment?: Segment;
}

type ResultFilter = "all" | "suspicious" | Extract<
  SimilarityClassification,
  "HIGH" | "VERY_HIGH"
>;

const POLL_INTERVAL_MS = 2500;
const RESULTS_PER_PAGE = 10;
const TOP_SUSPICIOUS_LIMIT = 5;

function isProcessing(status: DocumentAnalysis["status"]): boolean {
  return status === "pendente" || status === "processando";
}

function loadErrorMessage(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return "Não foi possível conectar ao servidor para carregar o relatório.";
  }

  if (error.response.status === 401) {
    return "Sua sessão expirou. Entre novamente para acessar este relatório.";
  }
  if (error.response.status === 403) {
    return "Você não tem permissão para acessar este relatório.";
  }
  if (error.response.status === 404) {
    return "O documento ou o relatório solicitado não foi encontrado.";
  }

  const detail = error.response.data?.detail;
  return typeof detail === "string"
    ? detail
    : "Não foi possível carregar o relatório de similaridade.";
}

function AnalysisReport({
  batchId,
  documentId,
  onBack,
  onOpenDocument,
}: AnalysisReportProps) {
  const [report, setReport] = useState<LoadedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<ResultFilter>("all");
  const [resultsPage, setResultsPage] = useState(1);
  const [matchSearch, setMatchSearch] = useState("");
  const [showAllMatches, setShowAllMatches] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    setFilter("all");
    setResultsPage(1);
    setMatchSearch("");
    setShowAllMatches(false);

    async function loadReport(showLoading: boolean) {
      if (showLoading) {
        setLoading(true);
        setReport(null);
      }
      setError("");

      try {
        const [batch, analysis, segments] = await Promise.all([
          getBatch(batchId),
          getDocumentAnalysis(documentId),
          listDocumentSegments(documentId),
        ]);
        if (cancelled) return;

        const document = batch.documents.find((item) => item.id === documentId);
        if (!document || analysis.document_id !== documentId) {
          setReport(null);
          setError("O documento não pertence a esta análise.");
          return;
        }

        setReport({ document, analysis, segments });

        if (isProcessing(analysis.status)) {
          timer = window.setTimeout(() => loadReport(false), POLL_INTERVAL_MS);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(loadErrorMessage(requestError));
        }
      } finally {
        if (!cancelled && showLoading) setLoading(false);
      }
    }

    loadReport(true);

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [batchId, documentId, reloadKey]);

  const rankedMatches = useMemo<RankedMatch[]>(() => {
    if (!report) return [];

    const segmentsById = new Map(
      report.segments.map((segment) => [segment.id, segment]),
    );
    const segmentsByText = new Map(
      report.segments.map((segment) => [
        normalizeSearchText(segment.text_original),
        segment,
      ]),
    );

    const matches = report.analysis.segments
      .flatMap((segmentAnalysis) => {
        const idSegment = segmentsById.get(segmentAnalysis.segment_id);
        const textSegment = segmentsByText.get(
          normalizeSearchText(segmentAnalysis.text),
        );
        // Older reports may contain a stale segment id. Keep the text and
        // metadata paired so the comparison never displays the adjacent
        // segment by accident.
        const analyzedSegment =
          idSegment &&
          normalizeSearchText(idSegment.text_original) ===
            normalizeSearchText(segmentAnalysis.text)
            ? idSegment
            : textSegment ?? idSegment;

        return segmentAnalysis.matches.map((match) => ({
          segmentAnalysis,
          match,
          analyzedSegment,
        }));
      })
      .sort((left, right) => right.match.final_score - left.match.final_score);

    return matches.map((match, index) => ({ ...match, rank: index + 1 }));
  }, [report]);

  const topSuspiciousMatches = useMemo(() => {
    const seenSegments = new Set<number>();

    return rankedMatches
      .filter(({ segmentAnalysis, match }) => {
        if (!match.is_suspicious || seenSegments.has(segmentAnalysis.segment_id)) {
          return false;
        }

        seenSegments.add(segmentAnalysis.segment_id);
        return true;
      })
      .slice(0, TOP_SUSPICIOUS_LIMIT);
  }, [rankedMatches]);

  const searchedMatches = useMemo(() => {
    const normalizedSearch = normalizeSearchText(matchSearch);
    if (!normalizedSearch) return rankedMatches;

    return rankedMatches.filter(({ segmentAnalysis, match, analyzedSegment }) => {
      const searchableContent = normalizeSearchText(
        [
          segmentAnalysis.text,
          match.reference_segment.text_original,
          match.reference_document.title,
          match.reference_document.source,
          match.reference_document.corpus_id,
          analyzedSegment?.position,
          match.reference_segment.position,
        ].join(" "),
      );
      return searchableContent.includes(normalizedSearch);
    });
  }, [matchSearch, rankedMatches]);

  const filteredMatches = useMemo(() => {
    if (filter === "all") return searchedMatches;
    if (filter === "suspicious") {
      return searchedMatches.filter(({ match }) => match.is_suspicious);
    }
    return searchedMatches.filter(({ match }) => match.classification === filter);
  }, [filter, searchedMatches]);

  const resultsPageCount = Math.max(
    1,
    Math.ceil(filteredMatches.length / RESULTS_PER_PAGE),
  );
  const currentResultsPage = Math.min(resultsPage, resultsPageCount);
  const firstVisibleResult = (currentResultsPage - 1) * RESULTS_PER_PAGE;
  const visibleMatches = filteredMatches.slice(
    firstVisibleResult,
    firstVisibleResult + RESULTS_PER_PAGE,
  );

  const filterOptions: Array<{
    value: ResultFilter;
    label: string;
    count: number;
  }> = [
    { value: "all", label: "Todos", count: searchedMatches.length },
    {
      value: "suspicious",
      label: "Suspeitos",
      count: searchedMatches.filter(({ match }) => match.is_suspicious).length,
    },
    {
      value: "HIGH",
      label: "Alta similaridade",
      count: searchedMatches.filter(({ match }) => match.classification === "HIGH")
        .length,
    },
    {
      value: "VERY_HIGH",
      label: "Similaridade muito alta",
      count: searchedMatches.filter(
        ({ match }) => match.classification === "VERY_HIGH",
      ).length,
    },
  ];

  function retry() {
    setReloadKey((value) => value + 1);
  }

  return (
    <main className="page analysis-report-page">
      <div className="detail-navigation analysis-report-navigation">
        <button className="text-button" type="button" onClick={onBack}>
          ← Voltar à análise
        </button>
        <span aria-hidden="true">·</span>
        <button className="text-button" type="button" onClick={onOpenDocument}>
          Ver conteúdo extraído
        </button>
      </div>

      {loading ? (
        <section className="card">
          <p className="empty-state" role="status">
            Carregando relatório de similaridade...
          </p>
        </section>
      ) : error ? (
        <section className="card analysis-report-state">
          <h1>Não foi possível abrir o relatório</h1>
          <p className="feedback-error" role="alert">
            {error}
          </p>
          <div className="analysis-state-actions">
            <button className="button-primary" type="button" onClick={retry}>
              Tentar novamente
            </button>
            <button className="button-ghost" type="button" onClick={onBack}>
              Voltar à análise
            </button>
          </div>
        </section>
      ) : report === null ? (
        <section className="card analysis-report-state">
          <h1>Relatório indisponível</h1>
          <p>Não foi possível localizar os dados deste documento.</p>
          <button className="button-primary" type="button" onClick={retry}>
            Tentar novamente
          </button>
        </section>
      ) : (
        <>
          <div className="page-heading detail-heading analysis-report-heading">
            <div>
              <span className="analysis-report-eyebrow">Relatório de similaridade</span>
              <h1>{report.analysis.filename}</h1>
              <p>
                Análise #{batchId} ·{" "}
                {report.document.finished_at
                  ? `Finalizada em ${formatDateTime(report.document.finished_at)}`
                  : `Enviada em ${formatDateTime(report.document.created_at)}`}
              </p>
            </div>
            <StatusBadge status={report.analysis.status} />
          </div>

          {isProcessing(report.analysis.status) ? (
            <section className="card analysis-report-state" aria-live="polite">
              <h2>
                {report.analysis.status === "pendente"
                  ? "Análise aguardando processamento"
                  : "Análise em processamento"}
              </h2>
              <p>
                {report.analysis.status === "pendente"
                  ? "O relatório será disponibilizado assim que o processamento começar e for concluído."
                  : "O motor está processando os trechos deste documento. Esta página será atualizada automaticamente quando o relatório estiver disponível."}
              </p>
              <div className="analysis-state-actions">
                <button className="button-ghost" type="button" onClick={retry}>
                  Atualizar agora
                </button>
                <button
                  className="button-ghost"
                  type="button"
                  onClick={onOpenDocument}
                >
                  Ver conteúdo extraído
                </button>
              </div>
            </section>
          ) : report.analysis.status === "erro" ? (
            <section className="card analysis-report-state is-failed">
              <h2>A análise deste documento falhou</h2>
              <p className="feedback-error" role="alert">
                {report.analysis.error_message ||
                  "Não foi possível concluir a análise de similaridade deste documento."}
              </p>
              <div className="analysis-state-actions">
                <button className="button-ghost" type="button" onClick={retry}>
                  Atualizar
                </button>
                <button
                  className="button-ghost"
                  type="button"
                  onClick={onOpenDocument}
                >
                  Ver conteúdo extraído
                </button>
              </div>
            </section>
          ) : (
            <>
              <AnalysisSummary
                analysis={report.analysis}
                totalMatches={rankedMatches.length}
              />

              <aside className="analysis-human-review" aria-label="Aviso importante">
                <strong>Análise humana recomendada</strong>
                <p>
                  Os resultados apresentados pelo Similaris servem como apoio à
                  identificação de possíveis similaridades textuais e não representam,
                  isoladamente, uma conclusão definitiva de plágio. Recomenda-se análise
                  humana dos trechos identificados.
                </p>
              </aside>

              {rankedMatches.length === 0 ? (
                <section className="card analysis-no-results">
                  <h2>
                    {report.analysis.total_segments === 0
                      ? "Nenhum trecho disponível para análise"
                      : "Nenhuma similaridade relevante encontrada"}
                  </h2>
                  <p>
                    {report.analysis.total_segments === 0
                      ? "A análise foi concluída, mas o documento não possui trechos extraídos para apresentar neste relatório."
                      : "Nenhuma correspondência foi encontrada para os trechos deste documento."}
                  </p>
                </section>
              ) : (
                <section
                  className="card analysis-results-section"
                  aria-labelledby="analysis-results-title"
                >
                  <div className="analysis-results-heading">
                    <div>
                      <span className="analysis-results-eyebrow">
                        Prioridade de revisão
                      </span>
                      <h2 id="analysis-results-title">Top trechos mais suspeitos</h2>
                      <p>
                        A melhor correspondência de cada trecho, ordenada pelo
                        maior score final.
                      </p>
                    </div>
                    <span className="card-count">
                      {topSuspiciousMatches.length} em destaque
                    </span>
                  </div>

                  {topSuspiciousMatches.length === 0 ? (
                    <div className="analysis-filter-empty">
                      <p>Nenhum trecho foi classificado como suspeito.</p>
                    </div>
                  ) : (
                    <div className="analysis-results-list analysis-top-results-list">
                      {topSuspiciousMatches.map(
                        ({ rank, segmentAnalysis, match, analyzedSegment }) => (
                          <SimilarityResultItem
                            key={`${segmentAnalysis.segment_id}-${match.reference_document.id}-${match.reference_segment.id}`}
                            rank={rank}
                            segmentAnalysis={segmentAnalysis}
                            match={match}
                            analyzedSegment={analyzedSegment}
                            featured
                          />
                        ),
                      )}
                    </div>
                  )}

                  <div className="analysis-all-results-toggle">
                    <div>
                      <strong>Comparação completa</strong>
                      <span>
                        Consulte todas as {rankedMatches.length} correspondências
                        com pesquisa, filtros e paginação.
                      </span>
                    </div>
                    <button
                      className={showAllMatches ? "button-ghost" : "button-primary"}
                      type="button"
                      aria-expanded={showAllMatches}
                      aria-controls="all-analysis-results"
                      onClick={() => setShowAllMatches((visible) => !visible)}
                    >
                      {showAllMatches
                        ? "Ocultar todas as comparações"
                        : "Ver comparação de todos os trechos"}
                    </button>
                  </div>

                  {showAllMatches && (
                    <div id="all-analysis-results" className="analysis-all-results">
                      <div className="analysis-all-results-heading">
                        <div>
                          <h3>Todas as correspondências</h3>
                          <p>Resultados ordenados do maior score final para o menor.</p>
                        </div>
                        <span className="card-count">
                          {filteredMatches.length} de {rankedMatches.length}
                        </span>
                      </div>

                      <div className="list-toolbar analysis-list-tools">
                        <input
                          className="list-search"
                          type="search"
                          value={matchSearch}
                          placeholder="Pesquisar nos trechos ou no documento fonte"
                          aria-label="Pesquisar correspondências"
                          onChange={(event) => {
                            setMatchSearch(event.target.value);
                            setResultsPage(1);
                          }}
                        />
                      </div>

                      <div
                        className="analysis-filters"
                        role="group"
                        aria-label="Filtrar correspondências"
                      >
                        {filterOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={filter === option.value ? "is-active" : undefined}
                            aria-pressed={filter === option.value}
                            onClick={() => {
                              setFilter(option.value);
                              setResultsPage(1);
                            }}
                          >
                            {option.label}
                            <span>{option.count}</span>
                          </button>
                        ))}
                      </div>

                      {filteredMatches.length === 0 ? (
                        <div className="analysis-filter-empty">
                          <p>Nenhuma correspondência atende a este filtro.</p>
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => {
                              setFilter("all");
                              setMatchSearch("");
                              setResultsPage(1);
                            }}
                          >
                            Limpar pesquisa e filtros
                          </button>
                        </div>
                      ) : (
                        <div className="analysis-results-list">
                          {visibleMatches.map(
                            ({ rank, segmentAnalysis, match, analyzedSegment }) => (
                              <SimilarityResultItem
                                key={`${segmentAnalysis.segment_id}-${match.reference_document.id}-${match.reference_segment.id}`}
                                rank={rank}
                                segmentAnalysis={segmentAnalysis}
                                match={match}
                                analyzedSegment={analyzedSegment}
                              />
                            ),
                          )}
                        </div>
                      )}

                      {filteredMatches.length > RESULTS_PER_PAGE && (
                        <nav
                          className="analysis-pagination"
                          aria-label="Paginação das correspondências"
                        >
                          <span>
                            Exibindo {firstVisibleResult + 1}–
                            {Math.min(
                              firstVisibleResult + RESULTS_PER_PAGE,
                              filteredMatches.length,
                            )} de {filteredMatches.length}
                          </span>
                          <div>
                            <button
                              className="button-ghost"
                              type="button"
                              disabled={currentResultsPage === 1}
                              onClick={() =>
                                setResultsPage((page) => Math.max(1, page - 1))
                              }
                            >
                              Anterior
                            </button>
                            <span>
                              Página {currentResultsPage} de {resultsPageCount}
                            </span>
                            <button
                              className="button-ghost"
                              type="button"
                              disabled={currentResultsPage === resultsPageCount}
                              onClick={() =>
                                setResultsPage((page) =>
                                  Math.min(resultsPageCount, page + 1),
                                )
                              }
                            >
                              Próxima
                            </button>
                          </div>
                        </nav>
                      )}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}

export default AnalysisReport;
