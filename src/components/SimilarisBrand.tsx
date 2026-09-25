import similarisLogo from "../assets/similaris-logo.jpeg";
import "./SimilarisBrand.css";

interface SimilarisBrandProps {
  compact?: boolean;
  light?: boolean;
  showSubtitle?: boolean;
}

function SimilarisBrand({
  compact = false,
  light = false,
  showSubtitle = false,
}: SimilarisBrandProps) {
  return (
    <span className={`similaris-brand${compact ? " is-compact" : ""}${light ? " is-light" : ""}`}>
      <img src={similarisLogo} alt="" className="similaris-brand-logo" />
      <span className="similaris-brand-copy">
        <strong>Similaris</strong>
        {showSubtitle && <small>Detecção de Plágio Acadêmico</small>}
      </span>
    </span>
  );
}

export default SimilarisBrand;
