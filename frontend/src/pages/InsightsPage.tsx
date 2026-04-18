import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { getInsights, InsightPayload } from "../api/client";

const COLORS = ["#ff6b35", "#1f6feb", "#2ea043", "#fb8500", "#006d77"];

export const InsightsPage = () => {
  const [insights, setInsights] = useState<InsightPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getInsights()
      .then(setInsights)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to fetch insights"));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!insights) return <p>Loading insights...</p>;

  const accountTypeAgg = Object.values(
    insights.accountDistribution.reduce<Record<string, { name: string; value: number }>>(
      (acc, item) => {
        if (!acc[item.accountType]) acc[item.accountType] = { name: item.accountType, value: 0 };
        acc[item.accountType].value += item.value;
        return acc;
      },
      {}
    )
  );

  return (
    <div className="insights-grid">
      <section className="panel highlight">
        <h2>Portfolio Snapshot</h2>
        <div className="kpi-row">
          <article>
            <span>Households</span>
            <strong>{insights.totals.households}</strong>
          </article>
          <article>
            <span>Members</span>
            <strong>{insights.totals.members}</strong>
          </article>
          <article>
            <span>Assets Tracked</span>
            <strong>${Math.round(insights.totals.assets).toLocaleString()}</strong>
          </article>
        </div>
      </section>

      <section className="panel chart">
        <h3>Income vs Expense Floor</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={insights.incomeExpense}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="household" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="income" fill="#1f6feb" />
            <Bar dataKey="expensesLow" fill="#ff6b35" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="panel chart">
        <h3>Net Worth vs Liquid Net Worth</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={insights.netWorthBreakdown}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="household" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="netWorth" fill="#fb8500" />
            <Bar dataKey="liquidNetWorth" fill="#2ea043" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="panel chart">
        <h3>Account Type Distribution</h3>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie data={accountTypeAgg} dataKey="value" nameKey="name" outerRadius={120}>
              {accountTypeAgg.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </section>

      <section className="panel chart">
        <h3>Members per Household</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={insights.membersPerHousehold}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="household" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="members" fill="#006d77" />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
};
