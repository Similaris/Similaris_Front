import { formatPercentage } from "../../utils/format";

interface SimilarityMetricProps {
  label: string;
  score: number;
  emphasized?: boolean;
  description?: string;
}

function SimilarityMetric({
  label,
  score,
  emphasized = false,
  description,
}: SimilarityMetricProps) {
  return (
    <div className={`analysis-metric${emphasized ? " is-emphasized" : ""}`}>
      <span title={description}>{label}</span>
      <strong>{formatPercentage(score)}</strong>
    </div>
  );
}

export default SimilarityMetric;
