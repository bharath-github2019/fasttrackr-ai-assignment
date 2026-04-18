import { NavLink, Route, Routes } from "react-router-dom";
import { HouseholdListPage } from "./pages/HouseholdListPage";
import { HouseholdDetailPage } from "./pages/HouseholdDetailPage";
import { InsightsPage } from "./pages/InsightsPage";

export const App = () => {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Advisor Console</p>
          <h1>Household Financial Intelligence</h1>
        </div>
        <nav>
          <NavLink to="/" end>
            Households
          </NavLink>
          <NavLink to="/insights">Insights</NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HouseholdListPage />} />
          <Route path="/households/:id" element={<HouseholdDetailPage />} />
          <Route path="/insights" element={<InsightsPage />} />
        </Routes>
      </main>
    </div>
  );
};
