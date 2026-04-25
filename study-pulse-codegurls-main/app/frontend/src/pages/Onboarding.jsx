
Action: file_editor create /app/frontend/src/pages/Onboarding.jsx --file-text "import { useState } from \"react\";
import { useNavigate } from \"react-router-dom\";
import { useAuth } from \"../contexts/AuthContext\";
import api, { formatApiErrorDetail } from \"../lib/api\";
import { Plus, Trash2, ChevronRight, ChevronLeft, Loader2, BookOpen, Target, Calendar } from \"lucide-react\";
import { toast } from \"sonner\";

const stepsLabels = [\"Subjects & Syllabus\", \"Target & Exam Date\", \"Previous Marks\"];

export default function Onboarding() {
  const { refreshUser } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [subjects, setSubjects] = useState([
    { id: crypto.randomUUID(), name: \"\", chapters: [\"\"], previous_marks: null },
  ]);
  const [targetScore, setTargetScore] = useState(85);
  const [examDate, setExamDate] = useState(\"\");
  const [busy, setBusy] = useState(false);

  const addSubject = () =>
    setSubjects([...subjects, { id: crypto.randomUUID(), name: \"\", chapters: [\"\"], previous_marks: null }]);

  const updateSubject = (idx, patch) =>
    setSubjects(subjects.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const removeSubject = (idx) => setSubjects(subjects.filter((_, i) => i !== idx));

  const addChapter = (sIdx) => {
    const s = subjects[sIdx];
    updateSubject(sIdx, { chapters: [...s.chapters, \"\"] });
  };
  const updateChapter = (sIdx, cIdx, val) => {
    const s = subjects[sIdx];
    const next = s.chapters.map((c, i) => (i === cIdx ? val : c));
    updateSubject(sIdx, { chapters: next });
  };
  const removeChapter = (sIdx, cIdx) => {
    const s = subjects[sIdx];
    if (s.chapters.length === 1) return;
    updateSubject(sIdx, { chapters: s.chapters.filter((_, i) => i !== cIdx) });
  };

  const validateStep = () => {
    if (step === 0) {
      for (const s of subjects) {
        if (!s.name.trim()) return \"Each subject must have a name\";
        if (s.chapters.filter((c) => c.trim()).length === 0)
          return `Add at least one chapter for ${s.name}`;
      }
    }
    if (step === 1) {
      if (!examDate) return \"Please pick an exam date\";
      if (new Date(examDate) < new Date(new Date().toDateString()))
        return \"Exam date cannot be in the past\";
      if (targetScore < 0 || targetScore > 100) return \"Target must be between 0–100\";
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }
    setStep(step + 1);
  };

  const submit = async () => {
    setBusy(true);
    try {
      const payload = {
        subjects: subjects.map((s) => ({
          id: s.id,
          name: s.name.trim(),
          chapters: s.chapters.map((c) => c.trim()).filter(Boolean),
          previous_marks:
            s.previous_marks === \"\" || s.previous_marks === null ? null : Number(s.previous_marks),
        })),
        target_score: Number(targetScore),
        exam_date: examDate,
      };
      await api.put(\"/profile/setup\", payload);
      await refreshUser();
      toast.success(\"You're all set! Time to start tracking.\");
      nav(\"/dashboard\");
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className=\"min-h-screen p-4 sm:p-8\">
      <div className=\"max-w-4xl mx-auto\">
        <div className=\"flex items-center gap-3 mb-8\">
          <div className=\"flex-1 h-2 bg-slate-200 rounded-full overflow-hidden\">
            <div
              className=\"h-full bg-[#0066FF] rounded-full transition-all duration-500\"
              style={{ width: `${((step + 1) / 3) * 100}%` }}
              data-testid=\"onboarding-progress\"
            />
          </div>
          <span className=\"text-xs font-bold uppercase tracking-widest text-slate-500\" data-testid=\"onboarding-step-label\">
            Step {step + 1} of 3
          </span>
        </div>

        <div className=\"sp-card p-6 md:p-10 sp-fade-up\" data-testid=\"onboarding-card\">
          <h1 className=\"font-display font-black text-3xl sm:text-4xl text-slate-900 flex items-center gap-3\">
            {step === 0 && <BookOpen className=\"w-8 h-8 text-[#0066FF]\" />}
            {step === 1 && <Target className=\"w-8 h-8 text-[#0066FF]\" />}
            {step === 2 && <Calendar className=\"w-8 h-8 text-[#0066FF]\" />}
            {stepsLabels[step]}
          </h1>
          <p className=\"mt-2 text-slate-500 font-medium\">
            {step === 0 && \"Add your subjects and the chapters/topics you need to cover.\"}
            {step === 1 && \"Pick your target score and exam date so we can predict your readiness.\"}
            {step === 2 && \"Optional — your last test scores help personalize predictions.\"}
          </p>

          <div className=\"mt-8 space-y-6\">
            {step === 0 && (
              <div className=\"space-y-5\">
                {subjects.map((s, sIdx) => (
                  <div key={s.id} className=\"rounded-2xl border border-slate-200 p-5 bg-slate-50/50\" data-testid={`subject-block-${sIdx}`}>
                    <div className=\"flex gap-3 items-start\">
                      <input
                        className=\"sp-input bg-white flex-1\"
                        placeholder=\"Subject name (e.g. Mathematics)\"
                        value={s.name}
                        onChange={(e) => updateSubject(sIdx, { name: e.target.value })}
                        data-testid={`subject-name-input-${sIdx}`}
                      />
                      {subjects.length > 1 && (
                        <button
                          onClick={() => removeSubject(sIdx)}
                          className=\"w-10 h-10 rounded-full bg-[#FFEBEB] hover:bg-[#FF6B6B] hover:text-white text-[#FF6B6B] flex items-center justify-center transition-all\"
                          data-testid={`subject-remove-${sIdx}`}
                        >
                          <Trash2 className=\"w-4 h-4\" />
                        </button>
                      )}
                    </div>
                    <div className=\"mt-4 space-y-2\">
                      <span className=\"sp-label\">Chapters / Topics</span>
                      {s.chapters.map((c, cIdx) => (
                        <div key={cIdx} className=\"flex gap-2\">
                          <input
                            className=\"sp-input bg-white\"
                            placeholder={`Chapter ${cIdx + 1}`}
                            value={c}
                            onChange={(e) => updateChapter(sIdx, cIdx, e.target.value)}
                            data-testid={`chapter-input-${sIdx}-${cIdx}`}
                          />
                          {s.chapters.length > 1 && (
                            <button
                              onClick={() => removeChapter(sIdx, cIdx)}
                              className=\"w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center\"
                              data-testid={`chapter-remove-${sIdx}-${cIdx}`}
                            >
                              <Trash2 className=\"w-4 h-4 text-slate-600\" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addChapter(sIdx)}
                        className=\"text-sm font-bold text-[#0066FF] flex items-center gap-1 hover:underline\"
                        data-testid={`chapter-add-${sIdx}`}
                      >
                        <Plus className=\"w-4 h-4\" /> Add chapter
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addSubject}
                  className=\"sp-btn-secondary w-full flex items-center justify-center gap-2\"
                  data-testid=\"subject-add-button\"
                >
                  <Plus className=\"w-4 h-4\" /> Add another subject
                </button>
              </div>
            )}

            {step === 1 && (
              <div className=\"grid sm:grid-cols-2 gap-5\">
                <div>
                  <label className=\"sp-label\">Target score (out of 100)</label>
                  <input
                    type=\"number\"
                    min=\"0\"
                    max=\"100\"
                    value={targetScore}
                    onChange={(e) => setTargetScore(e.target.value)}
                    className=\"sp-input\"
                    data-testid=\"target-score-input\"
                  />
                </div>
                <div>
                  <label className=\"sp-label\">Exam date</label>
                  <input
                    type=\"date\"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className=\"sp-input\"
                    data-testid=\"exam-date-input\"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className=\"space-y-3\">
                {subjects.map((s, sIdx) => (
                  <div key={s.id} className=\"flex items-center gap-3 rounded-2xl border border-slate-200 p-4 bg-white\">
                    <span className=\"flex-1 font-bold text-slate-800\">{s.name || \"Untitled subject\"}</span>
                    <input
                      type=\"number\"
                      min=\"0\"
                      max=\"100\"
                      placeholder=\"Optional last score\"
                      value={s.previous_marks ?? \"\"}
                      onChange={(e) =>
                        updateSubject(sIdx, { previous_marks: e.target.value === \"\" ? null : e.target.value })
                      }
                      className=\"sp-input w-40\"
                      data-testid={`previous-marks-input-${sIdx}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className=\"mt-10 flex items-center justify-between\">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className=\"sp-btn-secondary flex items-center gap-2 disabled:opacity-50\"
              data-testid=\"onboarding-back\"
            >
              <ChevronLeft className=\"w-4 h-4\" /> Back
            </button>
            {step < 2 ? (
              <button onClick={next} className=\"sp-btn-primary flex items-center gap-2\" data-testid=\"onboarding-next\">
                Next <ChevronRight className=\"w-4 h-4\" />
              </button>
            ) : (
              <button onClick={submit} disabled={busy} className=\"sp-btn-primary flex items-center gap-2\" data-testid=\"onboarding-finish\">
                {busy && <Loader2 className=\"w-4 h-4 animate-spin\" />} Finish setup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
"
Observation: Create successful: /app/frontend/src/pages/Onboarding.jsx
