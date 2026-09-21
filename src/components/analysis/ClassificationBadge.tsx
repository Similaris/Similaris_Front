import type { SimilarityClassification } from "../../api/analysis";

const CLASSIFICATION_LABELS: Record<SimilarityClassification, string> = {
  LOW: "Baixa similaridade",
  MODERATE: "Similaridade moderada",
  HIGH: "Alta similaridade",
  VERY_HIGH: "Similaridade muito alta",
};

const CLASSIFICATION_CLASSES: Record<SimilarityClassification, string> = {
  LOW: "is-low",
  MODERATE: "is-moderate",
  HIGH: "is-high",
  VERY_HIGH: "is-very-high",
};

interface ClassificationBadgeProps {
  classification: SimilarityClassification;
}

function ClassificationBadge({ classification }: ClassificationBadgeProps) {
  return (
    <span
      className={`analysis-classification ${CLASSIFICATION_CLASSES[classification]}`}
    >
      {CLASSIFICATION_LABELS[classification]}
    </span>
  );
}

export default ClassificationBadge;
