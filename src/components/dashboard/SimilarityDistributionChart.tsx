import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SimilarityDistribution } from "../../api/dashboard";

interface SimilarityDistributionChartProps {
  distribution: SimilarityDistribution;
}

const classifications = [
  { key: "low", label: "Baixa", color: "#94a3b8" },
  { key: "moderate", label: "Moderada", color: "#d97706" },
  { key: "high", label: "Alta", color: "#2563eb" },
  { key: "very_high", label: "Muito alta", color: "#dc2626" },
] as const;

function SimilarityDistributionChart({ distribution }: SimilarityDistributionChartProps) {
  const data = classifications.map((classification) => ({
    name: classification.label,
    value: distribution[classification.key],
    fill: classification.color,
  }));
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="dashboard-chart-card dashboard-similarity-card" aria-labelledby="dashboard-similarity-title">
      <div className="dashboard-chart-heading">
        <div>
          <h2 id="dashboard-similarity-title">Distribuição de similaridade</h2>
          <p>Classificações das correspondências encontradas pelo motor híbrido.</p>
        </div>
        <span className="dashboard-chart-total">{total} correspondências</span>
      </div>

      {total === 0 ? (
        <p className="dashboard-chart-empty">Nenhuma correspondência classificada ainda.</p>
      ) : (
        <div className="dashboard-chart dashboard-similarity-chart" role="img" aria-label="Distribuição das classificações de similaridade">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#ececf1" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#6e6c80", fontSize: 11 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#6e6c80", fontSize: 11 }} />
              <Tooltip formatter={(value) => [`${value}`, "Correspondências"]} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default SimilarityDistributionChart;
