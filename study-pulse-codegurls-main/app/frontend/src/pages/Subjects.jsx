
Action: file_editor create /app/frontend/src/pages/Subjects.jsx --file-text "import { useEffect, useState } from \"react\";
import api, { formatApiErrorDetail } from \"../lib/api\";
import { Plus, Trash2, Save, Loader2, BookOpen, X, Edit3 } from \"lucide-react\";
import { toast } from \"sonner\";

export default function Subjects() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await api.get(\"/profile\");
    setProfile(data);
  };
  useEffect(() => {
    load();
  }, []);

  const startNew = () =>
    setEditing({ id: \"\", name: \"\", chapters: [\"\"], previous_marks: \"\" });
  const startEdit = (s) =>
    setEditing({ ...s, chapters: s.chapters?.length ? [...s.chapters] : [\"\"], previous_marks: s.previous_marks ?? \"\" });

  const cancel = () => setEditing(null);

  const save = async () => {
    if (!editing.name.trim()) {
      toast.error(\"Name required\");
      return;
    }
    setBusy(true);
    const payload = {
      id: editing.id || crypto.randomUUID(),
      name: editing.name.trim(),
      chapters: editing.chapters.map((c) => c.trim()).filter(Boolean),
      previous_marks: editing.previous_marks === \"\" || editing.previous_marks == null ? null : Number(editing.previous_marks),
    };
    try {
      if (editing.id) {
        await api.put(`/subjects/${editing.id}`, payload);
        toast.success(\"Subject updated\");
      } else {
        await api.post(\"/subjects\", payload);
        toast.success(\"Subject added\");
      }
      setEditing(null);
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm(\"Delete this subject? Logs will remain.\")) return;
    await api.delete(`/subjects/${id}`);
    toast.success(\"Subject removed\");
    load();
  };

  if (!profile) return <div className=\"flex justify-center py-20\"><Loader2 className=\"w-8 h-8 animate-spin text-blue-600\" /></div>;

  return (
    <div className=\"space-y-6 sp-fade-up\" data-testid=\"subjects-page\">
      <div className=\"flex flex-wrap items-end justify-between gap-3\">
        <div>
          <p className=\"text-xs font-bold uppercase tracking-widest text-slate-500\">Subjects</p>
          <h1 className=\"font-display font-black text-3xl sm:text-4xl text-slate-900\">Manage your syllabus</h1>
        </div>
        <button onClick={startNew} className=\"sp-btn-primary flex items-center gap-2\" data-testid=\"subject-new-btn\">
          <Plus className=\"w-4 h-4\" /> Add subject
        </button>
      </div>

      <div className=\"grid sm:grid-cols-2 lg:grid-cols-3 gap-5\">
        {profile.subjects.map((s) => (
          <div key={s.id} className=\"sp-card p-5\" data-testid={`subject-card-${s.id}`}>
            <div className=\"flex items-start justify-between gap-2\">
              <div className=\"flex items-center gap-2\">
                <div className=\"w-9 h-9 rounded-2xl bg-[#E6F0FF] flex items-center justify-center text-[#0066FF]\">
                  <BookOpen className=\"w-4 h-4\" />
                </div>
                <div>
                  <p className=\"font-display font-bold text-lg text-slate-900\">{s.name}</p>
                  <p className=\"text-xs text-slate-500\">{s.chapters?.length || 0} chapters</p>
                </div>
              </div>
              <div className=\"flex gap-1\">
                <button onClick={() => startEdit(s)} className=\"w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center\" data-testid={`subject-edit-${s.id}`}>
                  <Edit3 className=\"w-3.5 h-3.5 text-slate-600\" />
                </button>
                <button onClick={() => remove(s.id)} className=\"w-8 h-8 rounded-full bg-[#FFEBEB] hover:bg-[#FF6B6B] hover:text-white text-[#FF6B6B] flex items-center justify-center\" data-testid={`subject-delete-${s.id}`}>
                  <Trash2 className=\"w-3.5 h-3.5\" />
                </button>
              </div>
            </div>
            <div className=\"mt-4 flex flex-wrap gap-1.5\">
              {s.chapters?.slice(0, 6).map((c, i) => (
                <span key={i} className=\"text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700\">{c}</span>
              ))}
              {s.chapters?.length > 6 && (
                <span className=\"text-xs font-bold px-2 py-1 rounded-full bg-[#E6F0FF] text-[#0066FF]\">+{s.chapters.length - 6}</span>
              )}
            </div>
            {s.previous_marks != null && (
              <p className=\"text-xs text-slate-500 mt-3\">Last score: <span className=\"font-bold text-slate-900\">{s.previous_marks}/100</span></p>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <div className=\"fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm\" data-testid=\"subject-modal\">
          <div className=\"sp-card w-full max-w-lg p-6 sp-fade-up\">
            <div className=\"flex items-center justify-between mb-4\">
              <h3 className=\"font-display font-bold text-xl text-slate-900\">{editing.id ? \"Edit subject\" : \"New subject\"}</h3>
              <button onClick={cancel} className=\"w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center\">
                <X className=\"w-4 h-4 text-slate-600\" />
              </button>
            </div>
            <div className=\"space-y-4\">
              <div>
                <label className=\"sp-label\">Subject name</label>
                <input className=\"sp-input\" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} data-testid=\"modal-name-input\" />
              </div>
              <div>
                <label className=\"sp-label\">Chapters</label>
                {editing.chapters.map((c, i) => (
                  <div key={i} className=\"flex gap-2 mb-2\">
                    <input
                      className=\"sp-input\"
                      value={c}
                      onChange={(e) => {
                        const next = [...editing.chapters];
                        next[i] = e.target.value;
                        setEditing({ ...editing, chapters: next });
                      }}
                    />
                    {editing.chapters.length > 1 && (
                      <button
                        onClick={() => setEditing({ ...editing, chapters: editing.chapters.filter((_, j) => j !== i) })}
                        className=\"w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center\"
                      >
                        <Trash2 className=\"w-4 h-4 text-slate-600\" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setEditing({ ...editing, chapters: [...editing.chapters, \"\"] })}
                  className=\"text-sm font-bold text-[#0066FF] flex items-center gap-1 hover:underline\"
                >
                  <Plus className=\"w-4 h-4\" /> Add chapter
                </button>
              </div>
              <div>
                <label className=\"sp-label\">Previous marks (optional)</label>
                <input
                  type=\"number\"
                  min=\"0\"
                  max=\"100\"
                  className=\"sp-input\"
                  value={editing.previous_marks}
                  onChange={(e) => setEditing({ ...editing, previous_marks: e.target.value })}
                />
              </div>
              <div className=\"flex justify-end gap-2 pt-2\">
                <button onClick={cancel} className=\"sp-btn-secondary\">Cancel</button>
                <button onClick={save} disabled={busy} className=\"sp-btn-primary flex items-center gap-2\" data-testid=\"modal-save-btn\">
                  {busy && <Loader2 className=\"w-4 h-4 animate-spin\" />}
                  <Save className=\"w-4 h-4\" /> Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"
Observation: Create successful: /app/frontend/src/pages/Subjects.jsx
