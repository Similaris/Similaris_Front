import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalysisOverTime } from "../../api/dashboard";

interface AnalysisTimelineChartProps {
  analyses: AnalysisOverTime[];
}

function formatPeriod(period: string): string {
  const date = new Date(`${period}-01T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return period;

  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  })
    .format(date)
    .replace(".", "");
}

function AnalysisTimelineChart({ analyses }: AnalysisTimelineChartProps) {
  const data = analyses.map((analysis) => ({
    ...analysis,
    label: formatPeriod(analysis.period),
  }));

  return (
    <section className="dashboard-chart-card" aria-labelledby="dashboard-timeline-title">
      <div className="dashboard-chart-heading">
        <div>
          <h2 id="dashboard-timeline-title">Análises ao longo do tempo</h2>
          <p>Quantidade de lotes enviados por mês.</p>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="dashboard-chart-empty">A evolução aparecerá aqui após o primeiro envio.</p>
      ) : (
        <div className="dashboard-chart" role="img" aria-label="Evolução mensal das análises">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#ececf1" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#6e6c80", fontSize: 11 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#6e6c80", fontSize: 11 }} />
              <Tooltip labelFormatter={(_, payload) => payload[0]?.payload.period ?? ""} formatter={(value) => [`${value}`, "Análises"]} />
              <Line type="monotone" dataKey="count" stroke="#6d28d9" strokeWidth={2.5} dot={{ r: 4, fill: "#6d28d9" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default AnalysisTimelineChart;
