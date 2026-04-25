
Action: file_editor create /app/frontend/src/App.js --file-text "import \"./App.css\";
import { BrowserRouter, Routes, Route, Navigate } from \"react-router-dom\";
import { AuthProvider, useAuth } from \"./contexts/AuthContext\";
import { Toaster } from \"sonner\";
import Login from \"./pages/Login\";
import Register from \"./pages/Register\";
import Onboarding from \"./pages/Onboarding\";
import Dashboard from \"./pages/Dashboard\";
import DailyLog from \"./pages/DailyLog\";
import WeeklyReport from \"./pages/WeeklyReport\";
import Subjects from \"./pages/Subjects\";
import ProtectedRoute from \"./components/ProtectedRoute\";
import Layout from \"./components/Layout\";
import { Loader2 } from \"lucide-react\";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className=\"min-h-screen flex items-center justify-center\">
        <Loader2 className=\"w-8 h-8 animate-spin text-blue-600\" />
      </div>
    );
  }
  if (!user) return <Navigate to=\"/login\" replace />;
  return <Navigate to={user.onboarded ? \"/dashboard\" : \"/onboarding\"} replace />;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.onboarded ? \"/dashboard\" : \"/onboarding\"} replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path=\"/\" element={<RootRedirect />} />
      <Route path=\"/login\" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path=\"/register\" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path=\"/onboarding\" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route
        path=\"/dashboard\"
        element={
          <ProtectedRoute requireOnboarded={true}>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path=\"/log\"
        element={
          <ProtectedRoute requireOnboarded={true}>
            <Layout><DailyLog /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path=\"/weekly\"
        element={
          <ProtectedRoute requireOnboarded={true}>
            <Layout><WeeklyReport /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path=\"/subjects\"
        element={
          <ProtectedRoute requireOnboarded={true}>
            <Layout><Subjects /></Layout>
          </ProtectedRoute>
        }
      />
      <Route path=\"*\" element={<Navigate to=\"/\" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className=\"App\">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster position=\"bottom-right"\" richColors />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
"
Observation: Overwrite successful: /app/frontend/src/App.js
