import { useState } from "react";
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
  const [logoAvailable, setLogoAvailable] = useState(true);

  return (
    <span className={`similaris-brand${compact ? " is-compact" : ""}${light ? " is-light" : ""}`}>
      {logoAvailable ? (
        <img
          src="/similaris-logo.png"
          alt=""
          className="similaris-brand-logo"
          onError={() => setLogoAvailable(false)}
        />
      ) : (
        <span className="similaris-brand-fallback" aria-hidden="true">
          S
        </span>
      )}
      <span className="similaris-brand-copy">
        <strong>Similaris</strong>
        {showSubtitle && <small>Detecção de Plágio Acadêmico</small>}
      </span>
    </span>
  );
}

export default SimilarisBrand;
