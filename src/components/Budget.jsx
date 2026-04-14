import { Editable, DeleteBtn, AddBtn, Badge } from "./shared.jsx";
import { uid } from "../utils/helpers.js";

export default function BudgetTab({ data, setData }) {
  const { budget, overview } = data;
  const setBudget = (b) => setData(d => ({ ...d, budget: b }));
  const updTransportBudget = (id, field, val) => setData(d => ({ ...d, overview: { ...d.overview, transports: d.overview.transports.map(t => t.id === id ? { ...t, [field]: parseFloat(val) || 0 } : t) } }));
  const updStayBudget = (id, field, val) => setData(d => ({ ...d, overview: { ...d.overview, stays: d.overview.stays.map(s => s.id === id ? { ...s, [field]: parseFloat(val) || 0 } : s) } }));

  let tBudg = 0, tAct = 0;
  overview.transports.forEach(t => { tBudg += (t.budgeted || 0); tAct += (t.actual || 0); });
  overview.stays.forEach(s => { tBudg += (s.budgeted || 0); tAct += (s.actual || 0); });
  budget.categories.forEach(c => c.items.forEach(i => { tBudg += i.budgeted; tAct += i.actual; }));
  const remaining = budget.totalBudget - tAct;
  const pct = budget.totalBudget > 0 ? (tAct / budget.totalBudget) * 100 : 0;
  let trBudg = 0, trAct = 0; overview.transports.forEach(t => { trBudg += (t.budgeted || 0); trAct += (t.actual || 0); });
  let stBudg = 0, stAct = 0; overview.stays.forEach(s => { stBudg += (s.budgeted || 0); stAct += (s.actual || 0); });

  return <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
    <div>
      <div style={{ display: "flex", gap: 24, alignItems: "baseline", marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>Total Budget</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
            <span style={{ fontSize: 14, color: "var(--muted)" }}>$</span>
            <Editable value={budget.totalBudget.toString()} onChange={v => setBudget({ ...budget, totalBudget: parseFloat(v) || 0 })} type="number" style={{ fontSize: 30, fontWeight: 700, width: 120 }} />
          </div>
        </div>
        <div style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "var(--muted)", lineHeight: 1.8 }}>
          Allocated <strong style={{ color: "var(--fg)" }}>${tBudg.toLocaleString()}</strong>
          <span style={{ margin: "0 10px", opacity: 0.3 }}>·</span>
          Spent <strong style={{ color: "var(--fg)" }}>${tAct.toLocaleString()}</strong>
          <span style={{ margin: "0 10px", opacity: 0.3 }}>·</span>
          Remaining <strong style={{ color: remaining >= 0 ? "var(--green-text)" : "var(--red-text)" }}>${remaining.toLocaleString()}</strong>
        </div>
      </div>
      <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: pct > 100 ? "var(--red-text)" : "var(--accent)", borderRadius: 2, transition: "width 0.3s" }} />
      </div>
    </div>

    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Transport</span>
        <Badge bg="var(--accent-dim)" text="var(--accent)" label="Linked" />
        <span style={{ fontSize: 12, color: "var(--muted)" }}>${trAct.toLocaleString()} / ${trBudg.toLocaleString()}</span>
      </div>
      {overview.transports.map(t => (
        <div key={t.id} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 10, alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 13, gridColumn: "1 / -1" }}>{t.route || "—"}</span>
          <Editable value={(t.budgeted || 0).toString()} onChange={v => updTransportBudget(t.id, "budgeted", v)} type="number" placeholder="0" style={{ textAlign: "right", fontSize: 12 }} />
          <Editable value={(t.actual || 0).toString()} onChange={v => updTransportBudget(t.id, "actual", v)} type="number" placeholder="0" style={{ textAlign: "right", fontSize: 12 }} />
        </div>
      ))}
      {overview.transports.length === 0 && <span style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Add transports in Overview</span>}
    </div>

    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Stays</span>
        <Badge bg="var(--accent-dim)" text="var(--accent)" label="Linked" />
        <span style={{ fontSize: 12, color: "var(--muted)" }}>${stAct.toLocaleString()} / ${stBudg.toLocaleString()}</span>
      </div>
      {overview.stays.map(s => (
        <div key={s.id} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 10, alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 13, gridColumn: "1 / -1" }}>{s.name || "—"}</span>
          <Editable value={(s.budgeted || 0).toString()} onChange={v => updStayBudget(s.id, "budgeted", v)} type="number" placeholder="0" style={{ textAlign: "right", fontSize: 12 }} />
          <Editable value={(s.actual || 0).toString()} onChange={v => updStayBudget(s.id, "actual", v)} type="number" placeholder="0" style={{ textAlign: "right", fontSize: 12 }} />
        </div>
      ))}
      {overview.stays.length === 0 && <span style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Add stays in Overview</span>}
    </div>

    {budget.categories.map(cat => {
      let cb = 0, ca = 0;
      cat.items.forEach(i => { cb += i.budgeted; ca += i.actual; });
      return <div key={cat.id}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Editable value={cat.group} onChange={v => setBudget({ ...budget, categories: budget.categories.map(c => c.id === cat.id ? { ...c, group: v } : c) })} style={{ fontWeight: 700, fontSize: 15, width: 170 }} />
            <span style={{ fontSize: 12, color: "var(--muted)" }}>${ca.toLocaleString()} / ${cb.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <AddBtn label="Item" onClick={() => setBudget({ ...budget, categories: budget.categories.map(c => c.id === cat.id ? { ...c, items: [...c.items, { id: uid(), name: "", budgeted: 0, actual: 0, notes: "" }] } : c) })} />
            <DeleteBtn onClick={() => setBudget({ ...budget, categories: budget.categories.filter(c => c.id !== cat.id) })} />
          </div>
        </div>
        {cat.items.map(item => (
          <div key={item.id} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
            <Editable value={item.name} onChange={v => setBudget({ ...budget, categories: budget.categories.map(c => c.id === cat.id ? { ...c, items: c.items.map(i => i.id === item.id ? { ...i, name: v } : i) } : c) })} placeholder="Item" style={{ minWidth: 120, flex: "1 1 150px" }} />
            <Editable value={item.budgeted.toString()} onChange={v => setBudget({ ...budget, categories: budget.categories.map(c => c.id === cat.id ? { ...c, items: c.items.map(i => i.id === item.id ? { ...i, budgeted: parseFloat(v) || 0 } : i) } : c) })} type="number" placeholder="0" style={{ textAlign: "right", fontSize: 12, width: 80 }} />
            <Editable value={item.actual.toString()} onChange={v => setBudget({ ...budget, categories: budget.categories.map(c => c.id === cat.id ? { ...c, items: c.items.map(i => i.id === item.id ? { ...i, actual: parseFloat(v) || 0 } : i) } : c) })} type="number" placeholder="0" style={{ textAlign: "right", fontSize: 12, width: 80 }} />
            <Editable value={item.notes} onChange={v => setBudget({ ...budget, categories: budget.categories.map(c => c.id === cat.id ? { ...c, items: c.items.map(i => i.id === item.id ? { ...i, notes: v } : i) } : c) })} placeholder="Notes" style={{ fontSize: 12, color: "var(--muted)", minWidth: 120, flex: "1 1 150px" }} />
            <DeleteBtn onClick={() => setBudget({ ...budget, categories: budget.categories.map(c => c.id === cat.id ? { ...c, items: c.items.filter(i => i.id !== item.id) } : c) })} />
          </div>
        ))}
      </div>;
    })}
    <div style={{ display: "flex", justifyContent: "center" }}><AddBtn label="Category" onClick={() => setBudget({ ...budget, categories: [...budget.categories, { id: uid(), group: "New Category", items: [] }] })} /></div>
  </div>;
}
