import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHouseholds, HouseholdSummary } from "../api/client";
import { UploadPanel } from "../components/UploadPanel";

const currency = (value?: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value || 0);

export const HouseholdListPage = () => {
  const [households, setHouseholds] = useState<HouseholdSummary[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setHouseholds(await getHouseholds());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch households");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="page-grid">
      <UploadPanel
        onUploaded={load}
        householdOptions={households.map((h) => ({ id: h.id, name: h.name }))}
      />
      <section className="panel">
        <div className="panel-header">
          <h2>Households</h2>
          <span>{households.length} total</span>
        </div>
        {loading ? <p>Loading households...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        <div className="card-list">
          {households.map((household) => (
            <Link key={household.id} to={`/households/${household.id}`} className="household-card">
              <h3>{household.name}</h3>
              <p>Income: {currency(household.annualIncome)}</p>
              <p>Net worth: {currency(household.netWorth)}</p>
              <p>Accounts: {household.accountCount}</p>
              <p>Members: {household.memberCount}</p>
            </Link>
          ))}
          {!loading && households.length === 0 ? (
            <p className="hint">Upload an Excel file to get started.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
};
