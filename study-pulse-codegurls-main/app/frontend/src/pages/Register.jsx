
Action: file_editor create /app/frontend/src/pages/Register.jsx --file-text "import { useState } from \"react\";
import { Link, useNavigate } from \"react-router-dom\";
import { useAuth } from \"../contexts/AuthContext\";
import { Sparkles, Loader2 } from \"lucide-react\";
import { toast } from \"sonner\";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState(\"\");
  const [email, setEmail] = useState(\"\");
  const [password, setPassword] = useState(\"\");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(\"Password must be at least 6 characters\");
      return;
    }
    setBusy(true);
    const res = await register(email, password, name);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(\"Account created!\");
    nav(\"/onboarding\");
  };

  return (
    <div className=\"min-h-screen grid lg:grid-cols-2\">
      <div
        className=\"hidden lg:flex relative overflow-hidden\"
        style={{
          backgroundImage:
            \"url('https://images.pexels.com/photos/5896750/pexels-photo-5896750.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940')\",
          backgroundSize: \"cover\",
          backgroundPosition: \"center\",
        }}
      >
        <div className=\"absolute inset-0 bg-gradient-to-br from-blue-100/40 to-white/20\" />
        <div className=\"relative z-10 p-12 flex flex-col justify-between text-slate-900\">
          <div className=\"flex items-center gap-2\">
            <div className=\"w-10 h-10 rounded-2xl bg-[#0066FF] flex items-center justify-center text-white\">
              <Sparkles className=\"w-5 h-5\" strokeWidth={2.5} />
            </div>
            <span className=\"font-display font-black text-2xl\">StudyPulse</span>
          </div>
          <div className=\"max-w-md bg-white/80 backdrop-blur-md p-6 rounded-3xl\">
            <h2 className=\"font-display font-black text-3xl leading-tight\">Built for ambitious students.</h2>
            <p className=\"mt-3 text-slate-700 font-medium text-sm\">
              Map your syllabus, log every session, and let StudyPulse forecast your exam-day score.
            </p>
          </div>
        </div>
      </div>
      <div className=\"flex items-center justify-center p-6 sm:p-12\">
        <div className=\"w-full max-w-md sp-fade-up\">
          <h1 className=\"font-display font-black text-4xl text-slate-900\">Create your account</h1>
          <p className=\"mt-2 text-slate-500 font-medium\">Start tracking your study pulse in 60 seconds.</p>
          <form onSubmit={onSubmit} className=\"mt-8 space-y-5\">
            <div>
              <label className=\"sp-label\" htmlFor=\"name\">Full name</label>
              <input id=\"name\" required data-testid=\"register-name-input\" value={name} onChange={(e) => setName(e.target.value)} className=\"sp-input\" placeholder=\"Alex Kumar\" />
            </div>
            <div>
              <label className=\"sp-label\" htmlFor=\"email\">Email</label>
              <input id=\"email\" type=\"email\" required data-testid=\"register-email-input\" value={email} onChange={(e) => setEmail(e.target.value)} className=\"sp-input\" placeholder=\"you@school.edu\" />
            </div>
            <div>
              <label className=\"sp-label\" htmlFor=\"password\">Password</label>
              <input id=\"password\" type=\"password\" required data-testid=\"register-password-input\" value={password} onChange={(e) => setPassword(e.target.value)} className=\"sp-input\" placeholder=\"At least 6 characters\" />
            </div>
            <button type=\"submit\" data-testid=\"register-submit-button\" disabled={busy} className=\"sp-btn-primary w-full flex items-center justify-center gap-2\">
              {busy && <Loader2 className=\"w-4 h-4 animate-spin\" />}
              Create account
            </button>
          </form>
          <p className=\"mt-6 text-sm text-slate-600 text-center font-medium\">
            Already have an account?{\" \"}
            <Link to=\"/login\" className=\"font-bold text-[#0066FF] hover:underline\" data-testid=\"link-login\">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
"
Observation: Create successful: /app/frontend/src/pages/Register.jsx
