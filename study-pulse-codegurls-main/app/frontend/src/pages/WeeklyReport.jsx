
Action: file_editor create /app/frontend/src/pages/WeeklyReport.jsx --file-text "import { useEffect, useState } from \"react\";
import api from \"../lib/api\";
import \"../lib/chartSetup\";
import { Bar } from \"react-chartjs-2\";
import { TrendingUp, TrendingDown, Loader2, Calendar, BookOpen } from \"lucide-react\";

const fmtMins = (m) => `${Math.floor(m / 60)}h ${m % 60}m`;

export default function WeeklyReport() {
  const [weekly, setWeekly] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    Promise.all([api.get(\"/analytics/weekly\"), api.get(\"/logs?days=14\")]).then(([w, l]) => {
      setWeekly(w.data);
      setLogs(l.data);
    });
  }, []);

  if (!weekly) return <div className=\"flex justify-center py-20\"><Loader2 className=\"w-8 h-8 animate-spin text-blue-600\" /></div>;

  const delta = weekly.delta_pct ?? 0;
  const positive = delta >= 0;

  const barData = {
    labels: weekly.by_subject.map((b) => b.subject),
    datasets: [
      {
        label: \"Minutes this week\",
        data: weekly.by_subject.map((b) => b.minutes),
        backgroundColor: \"#0066FF\",
        borderRadius: 12,
      },
    ],
  };
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: \"#E2E8F0\" } },
    },
  };

  return (
    <div className=\"space-y-6 sp-fade-up\" data-testid=\"weekly-page\">
      <div>
        <p className=\"text-xs font-bold uppercase tracking-widest text-slate-500\">Weekly report</p>
        <h1 className=\"font-display font-black text-3xl sm:text-4xl text-slate-900\">Your last 7 days</h1>
      </div>

      <div className=\"grid sm:grid-cols-3 gap-6\">
        <div className=\"sp-card p-6\">
          <p className=\"text-xs font-bold uppercase tracking-widest text-slate-500\">This week</p>
          <p className=\"font-display font-black text-3xl text-slate-900 mt-2\">{fmtMins(weekly.current_week_minutes)}</p>
          <p className=\"text-sm text-slate-500 mt-1\">{weekly.current_week_topics_count} topics covered</p>
        </div>
        <div className=\"sp-card p-6\">
          <p className=\"text-xs font-bold uppercase tracking-widest text-slate-500\">Last week</p>
          <p className=\"font-display font-black text-3xl text-slate-900 mt-2\">{fmtMins(weekly.previous_week_minutes)}</p>
          <p className=\"text-sm text-slate-500 mt-1\">{weekly.previous_week_topics_count} topics covered</p>
        </div>
        <div className=\"sp-card p-6\">
          <p className=\"text-xs font-bold uppercase tracking-widest text-slate-500\">Change</p>
          <div className=\"flex items-center gap-2 mt-2\">
            {positive ? <TrendingUp className=\"w-7 h-7 text-[#06D6A0]\" /> : <TrendingDown className=\"w-7 h-7 text-[#FF6B6B]\" />}
            <p className={`font-display font-black text-3xl ${positive ? \"text-[#06D6A0]\" : \"text-[#FF6B6B]\"}`} data-testid=\"weekly-delta\">
              {positive ? \"+\" : \"\"}{delta}%
            </p>
          </div>
          <p className=\"text-sm text-slate-500 mt-1\">{positive ? \"Trending up\" : \"Pace slowing\"}</p>
        </div>
      </div>

      <div className=\"sp-card p-6\">
        <h3 className=\"font-display font-bold text-xl text-slate-900 mb-4\">Hours per subject (this week)</h3>
        <div className=\"h-72\">
          {weekly.by_subject.length === 0 ? (
            <p className=\"text-sm text-slate-500\">No subjects logged this week.</p>
          ) : (
            <Bar data={barData} options={barOptions} />
          )}
        </div>
      </div>

      <div className=\"sp-card p-6\">
        <h3 className=\"font-display font-bold text-xl text-slate-900 mb-4\">Recent topics</h3>
        <div className=\"space-y-2\">
          {logs.filter((l) => l.topics).slice(0, 12).map((l) => (
            <div key={l.id} className=\"flex items-start gap-3 p-3 rounded-2xl bg-slate-50\">
              <Calendar className=\"w-4 h-4 text-slate-400 mt-1\" />
              <div className=\"flex-1\">
                <div className=\"flex items-center gap-2\">
                  <BookOpen className=\"w-3.5 h-3.5 text-[#0066FF]\" />
                  <span className=\"text-xs font-bold text-slate-700\">{l.subject_name}</span>
                  <span className=\"text-xs text-slate-400\">• {l.log_date}</span>
                </div>
                <p className=\"text-sm text-slate-800 mt-0.5\">{l.topics}</p>
              </div>
            </div>
          ))}
          {logs.filter((l) => l.topics).length === 0 && (
            <p className=\"text-sm text-slate-500\">No topics logged yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
"
Observation: Create successful: /app/frontend/src/pages/WeeklyReport.jsx
