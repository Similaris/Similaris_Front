import type { ProcessingStatus } from "../api/documents";

const STATUS_LABELS: Record<ProcessingStatus, string> = {
  pendente: "Pendente",
  processando: "Processando",
  concluido: "Concluído",
  erro: "Erro",
};

interface StatusBadgeProps {
  status: ProcessingStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`status-pill is-${status}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export default StatusBadge;
