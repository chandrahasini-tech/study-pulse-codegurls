
Action: file_editor create /app/frontend/src/components/ProtectedRoute.jsx --file-text "import { Navigate } from \"react-router-dom\";
import { useAuth } from \"../contexts/AuthContext\";
import { Loader2 } from \"lucide-react\";

export default function ProtectedRoute({ children, requireOnboarded = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className=\"min-h-screen flex items-center justify-center\" data-testid=\"auth-loading\">
        <Loader2 className=\"w-8 h-8 animate-spin text-blue-600\" />
      </div>
    );
  }
  if (!user) return <Navigate to=\"/login\" replace />;
  if (requireOnboarded && !user.onboarded) return <Navigate to=\"/onboarding\" replace />;
  if (!requireOnboarded && user.onboarded === false && window.location.pathname === \"/dashboard\") {
    return <Navigate to=\"/onboarding\" replace />;
  }
  return children;
}
"
Observation: Create successful: /app/frontend/src/components/ProtectedRoute.jsx
