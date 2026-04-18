import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getHousehold, HouseholdDetail } from "../api/client";
import { UploadPanel } from "../components/UploadPanel";

const currency = (value?: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value || 0);

export const HouseholdDetailPage = () => {
  const { id } = useParams();
  const [household, setHousehold] = useState<HouseholdDetail | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    if (!id) return;
    try {
      setHousehold(await getHousehold(id));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch household");
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  if (!id) return <p className="error">Missing household id.</p>;
  if (error) return <p className="error">{error}</p>;
  if (!household) return <p>Loading household...</p>;

  return (
    <div className="page-grid detail-layout">
      <UploadPanel householdId={id} onUploaded={load} />
      <section className="panel">
        <h2>{household.name}</h2>
        <div className="stat-grid">
          <article>
            <span>Annual income</span>
            <strong>{currency(household.annualIncome)}</strong>
          </article>
          <article>
            <span>Net worth</span>
            <strong>{currency(household.netWorth)}</strong>
          </article>
          <article>
            <span>Liquid net worth</span>
            <strong>{currency(household.liquidNetWorth)}</strong>
          </article>
          <article>
            <span>Tax bracket</span>
            <strong>{household.taxBracket || "Unknown"}</strong>
          </article>
        </div>

        <h3>Members</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Relationship</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {household.members.map((member) => (
                <tr key={member.id}>
                  <td>{member.fullName}</td>
                  <td>{member.relationship || "-"}</td>
                  <td>{member.email || "-"}</td>
                  <td>{member.phone || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Financial Accounts</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Account #</th>
                <th>Custodian</th>
                <th>Type</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {household.accounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.accountNumberMasked || "-"}</td>
                  <td>{account.custodian || "-"}</td>
                  <td>{account.accountType || "-"}</td>
                  <td>{currency(account.accountValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Audio Insights History</h3>
        <ul className="insight-list">
          {household.insights.map((insight) => (
            <li key={insight.id}>
              <p>{insight.summary || "No summary available"}</p>
              <small>{new Date(insight.createdAt).toLocaleString()}</small>
            </li>
          ))}
          {household.insights.length === 0 ? <li>No insights yet.</li> : null}
        </ul>
      </section>
    </div>
  );
};
