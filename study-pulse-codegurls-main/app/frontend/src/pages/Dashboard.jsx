
Action: file_editor create /app/frontend/src/pages/Dashboard.jsx --file-text "import { useEffect, useState } from \"react\";
import { Link } from \"react-router-dom\";
import api from \"../lib/api\";
import \"../lib/chartSetup\";
import { Line, Doughnut } from \"react-chartjs-2\";
import { useAuth } from \"../contexts/AuthContext\";
import { AlertTriangle, BellOff, Flame, TrendingUp, Clock, BookMarked, CheckCircle2, PencilLine } from \"lucide-react\";

const fmtMins = (m) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h && min) return `${h}h ${min}m`;
  if (h) return `${h}h`;
  return `${min}m`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [daily, setDaily] = useState([]);
  const [weekly, setWeekly] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [subjects, setSubjects] = useState([]);

  const load = async () => {
    const [d, w, f, p, s] = await Promise.all([
      api.get(\"/analytics/daily?days=7\"),
      api.get(\"/analytics/weekly\"),
      api.get(\"/analytics/feedback\"),
      api.get(\"/analytics/prediction\"),
      api.get(\"/analytics/subjects\"),
    ]);
    setDaily(d.data);
    setWeekly(w.data);
    setFeedback(f.data);
    setPrediction(p.data);
    setSubjects(s.data);
  };

  useEffect(() => {
    load();
  }, []);

  const lineData = {
    labels: daily.map((d) => new Date(d.date).toLocaleDateString(\"en-US\", { weekday: \"short\" })),
    datasets: [
      {
        label: \"Minutes studied\",
        data: daily.map((d) => d.minutes),
        borderColor: \"#0066FF\",
        backgroundColor: \"rgba(0,102,255,0.1)\",
        fill: true,
        tension: 0.4,
      },
    ],
  };
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: \"#E2E8F0\" }, ticks: { stepSize: 30 } },
    },
  };

  const readiness = prediction?.readiness_pct ?? 0;
  const gaugeData = {
    labels: [\"Ready\", \"Gap\"],
    datasets: [
      {
        data: [readiness, 100 - readiness],
        backgroundColor: [\"#0066FF\", \"#E6F0FF\"],
        borderWidth: 0,
        cutout: \"75%\",
      },
    ],
  };
  const gaugeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };

  return (
    <div className=\"space-y-6 sp-fade-up\" data-testid=\"dashboard-page\">
      {/* Greeting */}
      <div className=\"flex flex-wrap items-end justify-between gap-4\">
        <div>
          <p className=\"text-xs font-bold uppercase tracking-widest text-slate-500\">Today</p>
          <h1 className=\"font-display font-black text-3xl sm:text-4xl text-slate-900\">
            Hey {user?.name?.split(\" \")[0]}, ready to study?
          </h1>
        </div>
        <Link to=\"/log\" className=\"sp-btn-primary flex items-center gap-2\" data-testid=\"dashboard-add-log\">
          <PencilLine className=\"w-4 h-4\" /> Log today's session
        </Link>
      </div>

      {/* Alerts */}
      {feedback?.missed_today && (
        <div className=\"rounded-3xl bg-[#FFEBEB] border border-[#FFD1D1] p-5 flex items-start gap-3\" data-testid=\"alert-missed-today\">
          <BellOff className=\"w-5 h-5 text-[#FF6B6B] mt-0.5\" strokeWidth={2.5} />
          <div>
            <p className=\"font-bold text-[#B91C1C]\">You haven't logged today yet</p>
            <p className=\"text-sm text-[#7F1D1D]/80 mt-0.5\">A 30-minute log keeps your streak alive.</p>
          </div>
        </div>
      )}

      {prediction?.show_panel && prediction?.available && (
        <div className=\"rounded-3xl bg-[#0F172A] text-white p-6 sm:p-8 grid sm:grid-cols-3 gap-6\" data-testid=\"prediction-panel\">
          <div className=\"sm:col-span-2\">
            <p className=\"text-xs font-bold uppercase tracking-widest text-[#06D6A0]\">Exam mode • {prediction.days_to_exam} days left</p>
            <h2 className=\"font-display font-black text-3xl mt-2\">Predicted score: {prediction.expected_score}/100</h2>
            <p className=\"text-slate-300 mt-2 text-sm\">
              Target: {prediction.target_score} • Syllabus: {prediction.completion_pct}% • Quality: {prediction.quality_pct}%
            </p>
          </div>
          <div className=\"rounded-2xl bg-[#06D6A0]/10 border border-[#06D6A0]/30 p-4\">
            <p className=\"text-[#06D6A0] font-bold text-sm\">Hours invested</p>
            <p className=\"font-display font-black text-3xl mt-1\">{prediction.hours_studied}h</p>
          </div>
        </div>
      )}

      {/* Bento grid */}
      <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">
        <div className=\"sp-card md:col-span-2 p-6\" data-testid=\"card-progress-chart\">
          <div className=\"flex items-center justify-between mb-4\">
            <div>
              <p className=\"text-xs font-bold uppercase tracking-widest text-slate-500\">Last 7 days</p>
              <h3 className=\"font-display font-bold text-xl text-slate-900\">Daily progress</h3>
            </div>
            <div className=\"flex items-center gap-2 text-slate-500\">
              <Clock className=\"w-4 h-4\" />
              <span className=\"text-sm font-bold\">{fmtMins(daily.reduce((a, d) => a + d.minutes, 0))} total</span>
            </div>
          </div>
          <div className=\"h-64\">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        <div className=\"sp-card p-6 flex flex-col items-center\" data-testid=\"card-readiness-gauge\">
          <p className=\"text-xs font-bold uppercase tracking-widest text-slate-500 self-start\">Readiness</p>
          <h3 className=\"font-display font-bold text-xl text-slate-900 self-start mb-3\">Exam readiness</h3>
          <div className=\"relative h-48 w-48\">
            <Doughnut data={gaugeData} options={gaugeOptions} />
            <div className=\"absolute inset-0 flex flex-col items-center justify-center\">
              <span className=\"font-display font-black text-4xl text-slate-900\">{Math.round(readiness)}%</span>
              <span className=\"text-xs font-bold text-slate-500 uppercase\">ready</span>
            </div>
          </div>
          <p className=\"text-sm text-slate-500 mt-3 text-center\">
            {prediction?.available
              ? `${prediction.days_to_exam} days until exam`
              : \"Complete onboarding for predictions\"}
          </p>
        </div>
      </div>

      {/* Weekly compare + Focus */}
      <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">
        <div className=\"sp-card p-6\" data-testid=\"card-weekly-compare\">
          <p className=\"text-xs font-bold uppercase tracking-widest text-slate-500\">This week</p>
          <h3 className=\"font-display font-bold text-xl text-slate-900\">Hours studied</h3>
          <p className=\"font-display font-black text-4xl text-slate-900 mt-3\">
            {fmtMins(weekly?.current_week_minutes || 0)}
          </p>
          <div className=\"mt-2 inline-flex items-center gap-1 text-sm font-bold\">
            <TrendingUp className={`w-4 h-4 ${(weekly?.delta_pct || 0) >= 0 ? \"text-[#06D6A0]\" : \"text-[#FF6B6B] rotate-180\"}`} />
            <span className={(weekly?.delta_pct || 0) >= 0 ? \"text-[#06D6A0]\" : \"text-[#FF6B6B]\"}>
              {weekly?.delta_pct >= 0 ? \"+\" : \"\"}{weekly?.delta_pct ?? 0}% vs last week
            </span>
          </div>
          <p className=\"text-sm text-slate-500 mt-1\">{weekly?.current_week_topics_count || 0} unique topics covered</p>
        </div>

        <div className=\"sp-card md:col-span-2 p-6\" data-testid=\"card-focus-subjects\">
          <div className=\"flex items-center justify-between mb-4\">
            <div>
              <p className=\"text-xs font-bold uppercase tracking-widest text-slate-500\">Focus zone</p>
              <h3 className=\"font-display font-bold text-xl text-slate-900\">Subjects that need attention</h3>
            </div>
            <Flame className=\"w-5 h-5 text-[#FF6B6B]\" />
          </div>
          {(!feedback?.focus_subjects || feedback.focus_subjects.length === 0) && (
            <p className=\"text-sm text-slate-500\">Add some subjects and study sessions to get insights.</p>
          )}
          <div className=\"space-y-3\">
            {feedback?.focus_subjects?.map((f) => (
              <div key={f.subject_id} className=\"flex items-center gap-4 rounded-2xl bg-slate-50 p-4\" data-testid={`focus-row-${f.subject_id}`}>
                <div className=\"w-10 h-10 rounded-2xl bg-[#FFEBEB] flex items-center justify-center\">
                  <BookMarked className=\"w-5 h-5 text-[#FF6B6B]\" />
                </div>
                <div className=\"flex-1\">
                  <p className=\"font-bold text-slate-900\">{f.subject_name}</p>
                  <p className=\"text-xs text-slate-500\">
                    {f.completion}% complete • {fmtMins(f.total_minutes)} • {f.revise_count} revise prompts
                  </p>
                </div>
                <Link to=\"/log\" className=\"text-sm font-bold text-[#0066FF] hover:underline\">
                  Log
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revise topics */}
      {feedback?.revise_topics?.length > 0 && (
        <div className=\"sp-card p-6\" data-testid=\"card-revise-topics\">
          <div className=\"flex items-center gap-2 mb-3\">
            <AlertTriangle className=\"w-5 h-5 text-[#FFD166]\" />
            <h3 className=\"font-display font-bold text-xl text-slate-900\">You marked these for revision</h3>
          </div>
          <div className=\"grid sm:grid-cols-2 lg:grid-cols-3 gap-3\">
            {feedback.revise_topics.map((r, i) => (
              <div key={i} className=\"rounded-2xl bg-[#FFF9E6] border border-[#FFD166]/40 p-4\">
                <p className=\"text-xs font-bold uppercase tracking-widest text-[#B45309]\">{r.subject}</p>
                <p className=\"font-bold text-slate-900 mt-1 text-sm\">{r.topics}</p>
                <p className=\"text-xs text-slate-500 mt-1\">{r.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subject grid */}
      <div className=\"sp-card p-6\" data-testid=\"card-subject-grid\">
        <div className=\"flex items-center justify-between mb-4\">
          <div>
            <p className=\"text-xs font-bold uppercase tracking-widest text-slate-500\">All subjects</p>
            <h3 className=\"font-display font-bold text-xl text-slate-900\">Subject performance</h3>
          </div>
          <Link to=\"/subjects\" className=\"text-sm font-bold text-[#0066FF] hover:underline\" data-testid=\"link-manage-subjects\">
            Manage subjects
          </Link>
        </div>
        <div className=\"grid sm:grid-cols-2 lg:grid-cols-3 gap-4\">
          {subjects.map((s) => (
            <div key={s.subject_id} className=\"rounded-2xl border border-slate-200 p-4\" data-testid={`subject-stat-${s.subject_id}`}>
              <div className=\"flex items-center justify-between\">
                <p className=\"font-bold text-slate-900\">{s.subject_name}</p>
                <span className=\"text-xs font-bold text-[#0066FF] bg-[#E6F0FF] px-2 py-1 rounded-full\">
                  {s.completion_pct}%
                </span>
              </div>
              <div className=\"mt-3 h-2 rounded-full bg-slate-100 overflow-hidden\">
                <div className=\"h-full bg-[#0066FF]\" style={{ width: `${s.completion_pct}%` }} />
              </div>
              <div className=\"mt-3 flex flex-wrap gap-1.5 text-xs font-bold\">
                <span className=\"px-2 py-1 rounded-full bg-[#E6FFF7] text-[#06D6A0]\">
                  <CheckCircle2 className=\"w-3 h-3 inline mr-1\" />{s.perfect}
                </span>
                <span className=\"px-2 py-1 rounded-full bg-[#FFF9E6] text-[#B45309]\">{s.need_more_time} need time</span>
                <span className=\"px-2 py-1 rounded-full bg-[#FFEBEB] text-[#FF6B6B]\">{s.revise_again} revise</span>
              </div>
              <p className=\"text-xs text-slate-500 mt-2\">{fmtMins(s.total_minutes)} total</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
"
Observation: Create successful: /app/frontend/src/pages/Dashboard.jsx
