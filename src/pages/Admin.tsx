import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Activity, AlertTriangle, ClipboardList } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

type Analytics = {
  totalUsers: number;
  totalScreenings: number;
  avgPhq9: number;
  highRiskCount: number;
  severityDistribution: { severity: string; count: number }[];
  phq9Trend: { date: string; avg: number }[];
  highRiskUsers: { user_id: string; display_name: string | null; phq9_score: number; severity: string; created_at: string }[];
};

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "hsl(var(--muted-foreground))", "hsl(var(--destructive))"];

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      const admin = !!roleRow;
      setIsAdmin(admin);
      if (!admin) { setLoading(false); return; }

      const { data: analytics, error } = await supabase.rpc("get_admin_analytics");
      if (error) {
        toast.error(error.message);
      } else {
        setData(analytics as unknown as Analytics);
      }
      setLoading(false);
    })();
  }, [user, authLoading]);

  if (authLoading) return <div className="container py-20 text-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (isAdmin === false) {
    return (
      <div className="container py-20 max-w-lg">
        <div className="glass-card p-8 text-center">
          <AlertTriangle className="w-10 h-10 mx-auto text-primary mb-3" />
          <h1 className="text-2xl font-display font-semibold mb-2">Admin access required</h1>
          <p className="text-muted-foreground text-sm">
            Your account doesn't have the <code className="px-1.5 py-0.5 rounded bg-muted">admin</code> role yet.
            Ask a database admin to add a row to <code className="px-1.5 py-0.5 rounded bg-muted">user_roles</code>:
          </p>
          <pre className="mt-3 text-left text-xs bg-muted/60 rounded-lg p-3 overflow-x-auto">
{`INSERT INTO user_roles (user_id, role)
VALUES ('${user.id}', 'admin');`}
          </pre>
        </div>
      </div>
    );
  }
  if (loading || !data) return <div className="container py-20 text-center text-muted-foreground">Loading analytics…</div>;

  const stats = [
    { label: "Total users", value: data.totalUsers, icon: Users },
    { label: "Screenings", value: data.totalScreenings, icon: ClipboardList },
    { label: "Avg PHQ-9", value: data.avgPhq9, icon: Activity },
    { label: "High-risk", value: data.highRiskCount, icon: AlertTriangle },
  ];

  return (
    <div className="container py-10 md:py-14 space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-display font-semibold">Admin dashboard</h1>
        <p className="text-muted-foreground mt-1">Aggregate insights across your community.</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
            <s.icon className="w-5 h-5 text-primary mb-3" />
            <div className="text-3xl font-display font-semibold">{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:col-span-2">
          <h2 className="font-display text-xl font-semibold mb-4">Average PHQ-9 (last 30 days)</h2>
          {data.phq9Trend.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No screening data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.phq9Trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 27]} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card p-6">
          <h2 className="font-display text-xl font-semibold mb-4">Severity distribution</h2>
          {data.severityDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.severityDistribution} dataKey="count" nameKey="severity" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {data.severityDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-display text-xl font-semibold mb-4">High-risk users (PHQ-9 ≥ 15)</h2>
        {data.highRiskUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No high-risk users right now. 🌿</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/60">
                  <th className="py-2 pr-4 font-medium">User</th>
                  <th className="py-2 pr-4 font-medium">PHQ-9</th>
                  <th className="py-2 pr-4 font-medium">Severity</th>
                  <th className="py-2 font-medium">Last screening</th>
                </tr>
              </thead>
              <tbody>
                {data.highRiskUsers.map((u) => (
                  <tr key={u.user_id} className="border-b border-border/40 last:border-0">
                    <td className="py-3 pr-4">{u.display_name ?? <span className="text-muted-foreground">Anonymous</span>}</td>
                    <td className="py-3 pr-4 font-mono">{u.phq9_score}</td>
                    <td className="py-3 pr-4 capitalize">{u.severity}</td>
                    <td className="py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
