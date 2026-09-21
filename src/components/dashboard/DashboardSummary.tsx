import type { DashboardSummary as DashboardSummaryData } from "../../api/dashboard";

interface DashboardSummaryProps {
  summary: DashboardSummaryData;
}

const summaryCards: Array<{
  key: keyof DashboardSummaryData;
  label: string;
  detail: string;
  tone: string;
}> = [
  {
    key: "total_batches",
    label: "Análises realizadas",
    detail: "Lotes enviados",
    tone: "primary",
  },
  {
    key: "total_documents",
    label: "Documentos analisados",
    detail: "Documentos em todos os lotes",
    tone: "blue",
  },
  {
    key: "completed_batches",
    label: "Concluídas",
    detail: "Análises finalizadas",
    tone: "success",
  },
  {
    key: "processing_batches",
    label: "Em processamento",
    detail: "Análises em andamento",
    tone: "warning",
  },
];

function DashboardSummary({ summary }: DashboardSummaryProps) {
  return (
    <section className="dashboard-summary" aria-label="Visão geral das análises">
      {summaryCards.map((card) => (
        <article key={card.key} className={`dashboard-summary-card is-${card.tone}`}>
          <span>{card.label}</span>
          <strong>{summary[card.key]}</strong>
          <small>{card.detail}</small>
        </article>
      ))}
    </section>
  );
}

export default DashboardSummary;
