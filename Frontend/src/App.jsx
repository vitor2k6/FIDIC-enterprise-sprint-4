import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ScatterChart, Scatter, Legend
} from "recharts";

const API = "http://localhost:8000";

const RISK_COLORS = {
  "Baixo Risco": "#22c55e",
  "Médio Risco": "#f59e0b",
  "Alto Risco":  "#ef4444",
};

const fmt = (v, decimals = 2) =>
  typeof v === "number" ? v.toFixed(decimals) : v ?? "-";

const fmtBRL = (v) =>
  typeof v === "number"
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "-";

// ── KPI Card ──────────────────────────────────────────────
function KpiCard({ label, value, sub, color }) {
  return (
    <div className="kpi-card" style={{ borderTop: `3px solid ${color}` }}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value" style={{ color }}>{value}</span>
      {sub && <span className="kpi-sub">{sub}</span>}
    </div>
  );
}

// ── Badge de risco ────────────────────────────────────────
function RiskBadge({ value }) {
  const color = RISK_COLORS[value] ?? "#94a3b8";
  return (
    <span className="risk-badge" style={{ background: color + "22", color, border: `1px solid ${color}` }}>
      {value}
    </span>
  );
}

// ── Tabela ────────────────────────────────────────────────
function Table({ data, loading }) {
  if (loading) return <div className="loading">Carregando...</div>;
  if (!data?.length) return <div className="loading">Nenhum resultado.</div>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Cedente</th><th>UF</th><th>Score</th>
            <th>Classificação</th><th>Inadimplência</th>
            <th>Atraso Médio</th><th>Perda Total</th><th>Qtd Boletos</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i}>
              <td className="mono">{r.id_cedente}</td>
              <td>{r.uf}</td>
              <td>
                <div className="score-bar-wrap">
                  <div className="score-bar" style={{
                    width: `${(r.score_risco * 100).toFixed(0)}%`,
                    background: r.score_risco >= 0.75 ? "#22c55e" : r.score_risco >= 0.5 ? "#f59e0b" : "#ef4444"
                  }} />
                  <span>{fmt(r.score_risco, 3)}</span>
                </div>
              </td>
              <td><RiskBadge value={r.classificacao_risco} /></td>
              <td>{(r.taxa_inadimplencia * 100).toFixed(1)}%</td>
              <td>{fmt(r.atraso_medio, 1)} dias</td>
              <td>{fmtBRL(r.perda_total)}</td>
              <td>{r.qtd_boletos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── App principal ─────────────────────────────────────────
export default function App() {
  const [kpis, setKpis]           = useState(null);
  const [dist, setDist]           = useState([]);
  const [ufData, setUfData]       = useState([]);
  const [topAtraso, setTopAtraso] = useState([]);
  const [scatter, setScatter]     = useState([]);
  const [cedentes, setCedentes]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(1);
  const [ufs, setUfs]             = useState([]);
  const [filtroUf, setFiltroUf]   = useState("");
  const [filtroRisco, setFiltroRisco] = useState("");
  const [loadingTable, setLoadingTable] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Carregar dados estáticos
  useEffect(() => {
    fetch(`${API}/kpis`).then(r => r.json()).then(setKpis);
    fetch(`${API}/distribuicao-risco`).then(r => r.json()).then(setDist);
    fetch(`${API}/cedentes-por-uf`).then(r => r.json()).then(setUfData);
    fetch(`${API}/top-atraso?limit=10`).then(r => r.json()).then(setTopAtraso);
    fetch(`${API}/score-dispersao?sample=400`).then(r => r.json()).then(setScatter);
    fetch(`${API}/ufs`).then(r => r.json()).then(setUfs);
  }, []);

  // Carregar tabela com filtros
  useEffect(() => {
    setLoadingTable(true);
    const params = new URLSearchParams({ page, page_size: 20 });
    if (filtroUf) params.set("uf", filtroUf);
    if (filtroRisco) params.set("classificacao", filtroRisco);
    fetch(`${API}/cedentes?${params}`)
      .then(r => r.json())
      .then(d => {
        setCedentes(d.data ?? []);
        setTotal(d.total ?? 0);
        setPages(d.pages ?? 1);
        setLoadingTable(false);
      });
  }, [page, filtroUf, filtroRisco]);

  const scatterByRisk = {
    "Baixo Risco": scatter.filter(d => d.classificacao_risco === "Baixo Risco"),
    "Médio Risco": scatter.filter(d => d.classificacao_risco === "Médio Risco"),
    "Alto Risco":  scatter.filter(d => d.classificacao_risco === "Alto Risco"),
  };

  return (
    <div className="app">
      {/* Header */}
      <header>
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">◈</span>
            <div>
              <h1>FIDIC InsightFlow</h1>
              <p>Dashboard de Gestão de Risco</p>
            </div>
          </div>
          <div className="header-badge">MVP · Sprint 4</div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="tabs">
        {["overview", "analise", "cedentes"].map(t => (
          <button
            key={t}
            className={`tab ${activeTab === t ? "active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {{ overview: "📊 Visão Geral", analise: "📈 Análise", cedentes: "📋 Cedentes" }[t]}
          </button>
        ))}
      </nav>

      <main>

        {/* ── ABA VISÃO GERAL ── */}
        {activeTab === "overview" && (
          <>
            {/* KPIs */}
            <section className="kpi-grid">
              <KpiCard label="Total de Cedentes" value={kpis?.total_cedentes?.toLocaleString("pt-BR") ?? "—"} color="#6366f1" />
              <KpiCard label="Score Médio de Risco" value={kpis ? fmt(kpis.score_medio, 3) : "—"} color="#22c55e" />
              <KpiCard label="Taxa de Inadimplência" value={kpis ? `${(kpis.taxa_inadimplencia_media * 100).toFixed(1)}%` : "—"} color="#ef4444" />
              <KpiCard label="Perda Total" value={kpis ? fmtBRL(kpis.perda_total) : "—"} color="#f59e0b" />
              <KpiCard label="Total de Boletos" value={kpis?.total_boletos?.toLocaleString("pt-BR") ?? "—"} color="#06b6d4" />
              <KpiCard label="Valor Total" value={kpis ? fmtBRL(kpis.valor_total) : "—"} color="#8b5cf6" />
            </section>

            {/* Gráficos principais */}
            <section className="charts-grid">
              {/* Pizza */}
              <div className="chart-card">
                <h3>Distribuição de Risco</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={dist} dataKey="quantidade" nameKey="classificacao" cx="50%" cy="50%" outerRadius={90} label={({ classificacao, percent }) => `${classificacao} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {dist.map((e, i) => <Cell key={i} fill={RISK_COLORS[e.classificacao] ?? "#94a3b8"} />)}
                    </Pie>
                    <Tooltip formatter={(v) => v.toLocaleString("pt-BR")} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Barras UF */}
              <div className="chart-card">
                <h3>Cedentes por UF</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={ufData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="uf" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} />
                    <Bar dataKey="quantidade" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        )}

        {/* ── ABA ANÁLISE ── */}
        {activeTab === "analise" && (
          <section className="charts-grid full">

            {/* Top 10 Atraso */}
            <div className="chart-card wide">
              <h3>Top 10 Cedentes — Maior Atraso Médio (dias)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topAtraso} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis dataKey="id_cedente" type="category" tick={{ fill: "#94a3b8", fontSize: 10 }} width={80} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                    formatter={(v, n) => [v.toFixed(1) + " dias", "Atraso Médio"]} />
                  <Bar dataKey="atraso_medio" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Dispersão */}
            <div className="chart-card wide">
              <h3>Score de Risco × Taxa de Inadimplência</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="score_risco" name="Score" type="number" domain={[0, 1]} tick={{ fill: "#94a3b8", fontSize: 11 }} label={{ value: "Score de Risco", position: "insideBottom", offset: -5, fill: "#64748b" }} />
                  <YAxis dataKey="taxa_inadimplencia" name="Inadimplência" type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} label={{ value: "Taxa Inadimplência", angle: -90, position: "insideLeft", fill: "#64748b" }} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                    formatter={(v) => v.toFixed(4)} />
                  <Legend />
                  {Object.entries(scatterByRisk).map(([label, data]) => (
                    <Scatter key={label} name={label} data={data} fill={RISK_COLORS[label]} opacity={0.7} />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>

          </section>
        )}

        {/* ── ABA CEDENTES ── */}
        {activeTab === "cedentes" && (
          <>
            {/* Filtros */}
            <div className="filters">
              <select value={filtroUf} onChange={e => { setFiltroUf(e.target.value); setPage(1); }}>
                <option value="">Todas as UFs</option>
                {ufs.map(u => <option key={u}>{u}</option>)}
              </select>
              <select value={filtroRisco} onChange={e => { setFiltroRisco(e.target.value); setPage(1); }}>
                <option value="">Todos os Riscos</option>
                <option>Baixo Risco</option>
                <option>Médio Risco</option>
                <option>Alto Risco</option>
              </select>
              <span className="filter-total">{total.toLocaleString("pt-BR")} cedentes</span>
            </div>

            <Table data={cedentes} loading={loadingTable} />

            {/* Paginação */}
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
              <span>Página {page} de {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Próxima →</button>
            </div>
          </>
        )}

      </main>

      <footer>
        <span>FIDIC InsightFlow · Data Alchemists · FIAP 2025</span>
      </footer>
    </div>
  );
}
