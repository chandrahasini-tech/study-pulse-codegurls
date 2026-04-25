Now create the pages and remaining components in parallel:
Action: file_editor create /app/frontend/src/pages/Login.jsx --file-text "import { useState } from \"react\";
import { Link, useNavigate } from \"react-router-dom\";
import { useAuth } from \"../contexts/AuthContext\";
import { Sparkles, Loader2 } from \"lucide-react\";
import { toast } from \"sonner\";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState(\"\");
  const [password, setPassword] = useState(\"\");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await login(email, password);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(\"Welcome back!\");
    nav(res.data.onboarded ? \"/dashboard\" : \"/onboarding\");
  };

  return (
    <div className=\"min-h-screen grid lg:grid-cols-2\">
      <div
        className=\"hidden lg:flex relative overflow-hidden\"
        style={{
          backgroundImage:
            \"url('https://images.unsplash.com/photo-1762503203730-ca33982518af?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzV8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGNvbG9yZnVsJTIwc29mdCUyMHBhc3RlbCUyMGdyYWRpZW50JTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NzcxMjc3MTN8MA&ixlib=rb-4.1.0&q=85')\",
          backgroundSize: \"cover\",
          backgroundPosition: \"center\",
        }}
      >
        <div className=\"absolute inset-0 bg-white/30\" />
        <div className=\"relative z-10 p-12 flex flex-col justify-between text-slate-900\">
          <div className=\"flex items-center gap-2\">
            <div className=\"w-10 h-10 rounded-2xl bg-[#0066FF] flex items-center justify-center text-white\">
              <Sparkles className=\"w-5 h-5\" strokeWidth={2.5} />
            </div>
            <span className=\"font-display font-black text-2xl\">StudyPulse</span>
          </div>
          <div className=\"max-w-md\">
            <h2 className=\"font-display font-black text-4xl leading-tight\">
              Track every study session.<br/>
              Predict your readiness.
            </h2>
            <p className=\"mt-4 text-slate-700 font-medium\">
              A pulse on your prep — daily logs, weekly trends, and exam-day predictions.
            </p>
          </div>
        </div>
      </div>
      <div className=\"flex items-center justify-center p-6 sm:p-12\">
        <div className=\"w-full max-w-md sp-fade-up\">
          <h1 className=\"font-display font-black text-4xl text-slate-900\">Welcome back</h1>
          <p className=\"mt-2 text-slate-500 font-medium\">Sign in to continue your StudyPulse journey.</p>
          <form onSubmit={onSubmit} className=\"mt-8 space-y-5\">
            <div>
              <label className=\"sp-label\" htmlFor=\"email\">Email</label>
              <input
                id=\"email\"
                type=\"email\"
                required
                data-testid=\"login-email-input\"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className=\"sp-input\"
                placeholder=\"you@school.edu\"
              />
            </div>
            <div>
              <label className=\"sp-label\" htmlFor=\"password\">Password</label>
              <input
                id=\"password\"
                type=\"password\"
                required
                data-testid=\"login-password-input\"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className=\"sp-input\"
                placeholder=\"••••••••\"
              />
            </div>
            <button
              type=\"submit\"
              data-testid=\"login-submit-button\"
              disabled={busy}
              className=\"sp-btn-primary w-full flex items-center justify-center gap-2\"
            >
              {busy && <Loader2 className=\"w-4 h-4 animate-spin\" />}
              Sign in
            </button>
          </form>
          <p className=\"mt-6 text-sm text-slate-600 text-center font-medium\">
            New here?{\" \"}
            <Link to=\"/register\" className=\"font-bold text-[#0066FF] hover:underline\" data-testid=\"link-register\">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
"
Observation: Create successful: /app/frontend/src/pages/Login.jsx
