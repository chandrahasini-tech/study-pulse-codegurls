
Action: file_editor create /app/frontend/src/pages/DailyLog.jsx --file-text "import { useEffect, useState } from \"react\";
import { useNavigate } from \"react-router-dom\";
import api, { formatApiErrorDetail } from \"../lib/api\";
import { Loader2, Trash2, Clock, BookOpen } from \"lucide-react\";
import { toast } from \"sonner\";

const ratings = [
  { key: \"revise_again\", label: \"Revise Again\" },
  { key: \"need_more_time\", label: \"Need More Time\" },
  { key: \"perfect\", label: \"Perfect\" },
];

export default function DailyLog() {
  const nav = useNavigate();
  const [profile, setProfile] = useState(null);
  const [logs, setLogs] = useState([]);
  const [subjectId, setSubjectId] = useState(\"\");
  const [time, setTime] = useState(45);
  const [topics, setTopics] = useState(\"\");
  const [rating, setRating] = useState(\"perfect\");
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [p, l] = await Promise.all([api.get(\"/profile\"), api.get(\"/logs?days=14\")]);
    setProfile(p.data);
    setLogs(l.data);
    if (!subjectId && p.data.subjects?.[0]) setSubjectId(p.data.subjects[0].id);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!subjectId) {
      toast.error(\"Pick a subject first\");
      return;
    }
    if (Number(time) < 0) {
      toast.error(\"Time cannot be negative\");
      return;
    }
    setBusy(true);
    try {
      await api.post(\"/logs\", {
        subject_id: subjectId,
        time_minutes: Number(time),
        topics,
        rating,
        log_date: logDate,
      });
      toast.success(\"Logged! Keep the pulse going.\");
      setTopics(\"\");
      setTime(45);
      setRating(\"perfect\");
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    await api.delete(`/logs/${id}`);
    toast.success(\"Log removed\");
    load();
  };

  if (!profile) return <div className=\"flex justify-center py-20\"><Loader2 className=\"w-8 h-8 animate-spin text-blue-600\" /></div>;

  return (
    <div className=\"space-y-6 sp-fade-up\" data-testid=\"daily-log-page\">
      <div>
        <p className=\"text-xs font-bold uppercase tracking-widest text-slate-500\">Daily log</p>
        <h1 className=\"font-display font-black text-3xl sm:text-4xl text-slate-900\">Log a study session</h1>
        <p className=\"text-slate-500 font-medium mt-1\">Track time, topics, and how confident you feel.</p>
      </div>

      <div className=\"grid lg:grid-cols-5 gap-6\">
        <div className=\"sp-card p-6 lg:col-span-3\">
          <form onSubmit={submit} className=\"space-y-5\">
            <div className=\"grid sm:grid-cols-2 gap-4\">
              <div>
                <label className=\"sp-label\">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className=\"sp-input\"
                  data-testid=\"log-subject-select\"
                >
                  {profile.subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className=\"sp-label\">Date</label>
                <input
                  type=\"date\"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className=\"sp-input\"
                  max={new Date().toISOString().slice(0, 10)}
                  data-testid=\"log-date-input\"
                />
              </div>
            </div>
            <div>
              <label className=\"sp-label\">Time spent (minutes)</label>
              <input
                type=\"number\"
                min=\"0\"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className=\"sp-input\"
                data-testid=\"log-time-input\"
              />
            </div>
            <div>
              <label className=\"sp-label\">Topics covered (comma-separated)</label>
              <textarea
                rows={4}
                placeholder=\"Quadratic equations, completing the square, vertex form...\"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                className=\"sp-input resize-none\"
                data-testid=\"log-topics-input\"
              />
            </div>
            <div>
              <label className=\"sp-label\">How was it?</label>
              <div className=\"flex gap-2\">
                {ratings.map((r) => (
                  <button
                    type=\"button\"
                    key={r.key}
                    onClick={() => setRating(r.key)}
                    data-active={rating === r.key}
                    data-kind={r.key}
                    data-testid={`log-rating-${r.key}`}
                    className=\"sp-rating-pill bg-slate-50 text-slate-700\"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className=\"flex justify-between items-center pt-2\">
              <button type=\"button\" onClick={() => nav(\"/dashboard\")} className=\"sp-btn-secondary\" data-testid=\"log-cancel\">Cancel</button>
              <button type=\"submit\" disabled={busy} className=\"sp-btn-primary flex items-center gap-2\" data-testid=\"log-submit\">
                {busy && <Loader2 className=\"w-4 h-4 animate-spin\" />} Save log
              </button>
            </div>
          </form>
        </div>

        <div className=\"sp-card p-6 lg:col-span-2\">
          <h3 className=\"font-display font-bold text-xl text-slate-900 mb-4\">Recent logs</h3>
          {logs.length === 0 && (
            <p className=\"text-sm text-slate-500\">No logs yet. Save your first session to start tracking.</p>
          )}
          <div className=\"space-y-3 max-h-[28rem] overflow-y-auto pr-1\">
            {logs.map((l) => (
              <div key={l.id} className=\"rounded-2xl border border-slate-200 p-4\" data-testid={`log-item-${l.id}`}>
                <div className=\"flex items-center justify-between gap-2\">
                  <div className=\"flex items-center gap-2\">
                    <BookOpen className=\"w-4 h-4 text-[#0066FF]\" />
                    <span className=\"font-bold text-slate-900 text-sm\">{l.subject_name}</span>
                  </div>
                  <button onClick={() => remove(l.id)} className=\"text-slate-400 hover:text-[#FF6B6B] transition-colors\" data-testid={`log-delete-${l.id}`}>
                    <Trash2 className=\"w-4 h-4\" />
                  </button>
                </div>
                <div className=\"text-xs text-slate-500 mt-1 flex items-center gap-3\">
                  <span className=\"flex items-center gap-1\"><Clock className=\"w-3 h-3\" /> {l.time_minutes}m</span>
                  <span>{l.log_date}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold ${
                      l.rating === \"perfect\" ? \"bg-[#E6FFF7] text-[#06D6A0]\" :
                      l.rating === \"need_more_time\" ? \"bg-[#FFF9E6] text-[#B45309]\" :
                      \"bg-[#FFEBEB] text-[#FF6B6B]\"
                    }`}
                  >
                    {l.rating.replace(\"_\", \" \")}
                  </span>
                </div>
                {l.topics && <p className=\"text-sm text-slate-700 mt-2\">{l.topics}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
"
Observation: Create successful: /app/frontend/src/pages/DailyLog.jsx
