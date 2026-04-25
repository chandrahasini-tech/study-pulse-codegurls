
Action: file_editor create /app/frontend/src/components/Layout.jsx --file-text "import { Link, NavLink, useNavigate } from \"react-router-dom\";
import { useAuth } from \"../contexts/AuthContext\";
import { LayoutDashboard, BookOpen, PencilLine, BarChart3, LogOut, Sparkles } from \"lucide-react\";

const navItems = [
  { to: \"/dashboard\", label: \"Dashboard\", icon: LayoutDashboard, testid: \"nav-dashboard\" },
  { to: \"/log\", label: \"Daily Log\", icon: PencilLine, testid: \"nav-daily-log\" },
  { to: \"/weekly\", label: \"Weekly Report\", icon: BarChart3, testid: \"nav-weekly\" },
  { to: \"/subjects\", label: \"Subjects\", icon: BookOpen, testid: \"nav-subjects\" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate(\"/login\");
  };

  return (
    <div className=\"min-h-screen\">
      <header className=\"sp-glass-header sticky top-0 z-50\">
        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between\">
          <Link to=\"/dashboard\" className=\"flex items-center gap-2\" data-testid=\"brand-logo\">
            <div className=\"w-9 h-9 rounded-2xl bg-[#0066FF] flex items-center justify-center text-white\">
              <Sparkles className=\"w-5 h-5\" strokeWidth={2.5} />
            </div>
            <span className=\"font-display font-black text-xl text-slate-900 tracking-tight\">StudyPulse</span>
          </Link>
          <nav className=\"hidden md:flex items-center gap-1\">
            {navItems.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                data-testid={it.testid}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    isActive
                      ? \"bg-[#E6F0FF] text-[#0066FF]\"
                      : \"text-slate-600 hover:bg-slate-100\"
                  }`
                }
              >
                <it.icon className=\"w-4 h-4\" strokeWidth={2.5} />
                {it.label}
              </NavLink>
            ))}
          </nav>
          <div className=\"flex items-center gap-3\">
            <div className=\"hidden sm:flex flex-col items-end\">
              <span className=\"text-xs text-slate-500 font-medium\">Hi,</span>
              <span className=\"text-sm font-bold text-slate-900\" data-testid=\"user-name\">{user?.name}</span>
            </div>
            <button
              onClick={onLogout}
              data-testid=\"logout-button\"
              className=\"w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all\"
              title=\"Logout\"
            >
              <LogOut className=\"w-4 h-4 text-slate-700\" strokeWidth={2.5} />
            </button>
          </div>
        </div>
        {/* mobile nav */}
        <nav className=\"md:hidden flex overflow-x-auto gap-1 px-4 pb-3\">
          {navItems.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap ${
                  isActive ? \"bg-[#E6F0FF] text-[#0066FF]\" : \"text-slate-600 bg-slate-50\"
                }`
              }
            >
              <it.icon className=\"w-3.5 h-3.5\" strokeWidth={2.5} />
              {it.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">{children}</main>
    </div>
  );
}
"
Observation: Create successful: /app/frontend/src/components/Layout.jsx
