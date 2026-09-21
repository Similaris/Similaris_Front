import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { BatchStatusDistribution } from "../../api/dashboard";

interface StatusDistributionChartProps {
  distribution: BatchStatusDistribution;
}

const statuses = [
  { key: "pendente", label: "Pendente", color: "#d97706" },
  { key: "processando", label: "Processando", color: "#2563eb" },
  { key: "concluido", label: "Concluído", color: "#16a34a" },
  { key: "erro", label: "Erro", color: "#dc2626" },
] as const;

function StatusDistributionChart({ distribution }: StatusDistributionChartProps) {
  const data = statuses.map((status) => ({
    name: status.label,
    value: distribution[status.key],
    color: status.color,
  }));
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="dashboard-chart-card" aria-labelledby="dashboard-status-title">
      <div className="dashboard-chart-heading">
        <div>
          <h2 id="dashboard-status-title">Status das análises</h2>
          <p>Distribuição dos lotes enviados.</p>
        </div>
        <span className="dashboard-chart-total">{total} no total</span>
      </div>

      {total === 0 ? (
        <p className="dashboard-chart-empty">Ainda não há análises para distribuir.</p>
      ) : (
        <div className="dashboard-chart dashboard-status-chart" role="img" aria-label="Distribuição dos status das análises">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.filter((item) => item.value > 0)}
                dataKey="value"
                nameKey="name"
                innerRadius="57%"
                outerRadius="78%"
                paddingAngle={3}
              >
                {data
                  .filter((item) => item.value > 0)
                  .map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}`, "Análises"]} />
              <Legend verticalAlign="bottom" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <ul className="dashboard-chart-values" aria-label="Valores por status">
        {data.map((item) => (
          <li key={item.name}>
            <span style={{ backgroundColor: item.color }} aria-hidden="true" />
            {item.name}
            <strong>{item.value}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default StatusDistributionChart;
