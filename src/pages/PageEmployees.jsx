import { useState } from "react";
import { Ic, Avt, Badge, Card, PageHeader, Table, Empty, SearchInp } from "../components/UI";

export default function PageEmployees({ emp, routes }) {
  const [search, setSearch] = useState("");

  const list = emp.filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase())
  );

  const approved  = emp.filter(e => e.status === "approved").length;
  const pending   = emp.filter(e => e.status === "pending").length;
  const rejected  = emp.filter(e => e.status === "rejected").length;

  return (
    <div className="space-y-5 max-w-[1400px]">
      <PageHeader title="Employees" sub="Directory of all registered employees">
        <SearchInp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or ID…"/>
      </PageHeader>

      {/* Summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 fu">
        {[
          { label: "Total",    value: emp.length,  color: "#5b5bd6" },
          { label: "Approved", value: approved,    color: "#10b981" },
          { label: "Pending",  value: pending,     color: "#f59e0b" },
          { label: "Rejected", value: rejected,    color: "#ef4444" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: s.color + "0e", border: `1px solid ${s.color}22` }}>
            <p className="text-2xl font-display font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-bold text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <Card className="overflow-hidden fu d2">
        <Table headers={["Employee","Address","Shift","Route","Status"]} minW="560px">
          {list.length === 0
            ? <tr><td colSpan={5}><Empty icon="users" text="No employees found"/></td></tr>
            : list.map(e => {
              const route = routes.find(r => r.id === e.routeId);
              return (
                <tr key={e.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avt name={e.name}/>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{e.name}</p>
                        <p className="text-[11px] font-mono text-slate-400">{e.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 max-w-[180px]">
                    <span className="block truncate">{e.address || <span className="italic text-slate-300">—</span>}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background:"#f1f5f9", color:"#475569" }}>{e.shift}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {route
                      ? <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-indigo-400"/>
                          <span className="text-xs font-bold text-indigo-600">{route.name}</span>
                        </div>
                      : <span className="text-xs text-slate-300 italic">Unassigned</span>
                    }
                  </td>
                  <td className="px-5 py-3.5"><Badge s={e.status}/></td>
                </tr>
              );
            })
          }
        </Table>
      </Card>
    </div>
  );
}