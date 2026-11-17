import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminScreen } from "./components/AdminScreen";
import { StudioScreen } from "./components/StudioScreen";
import { AuthProvider, useAuth } from "./state/AuthProvider";
import { StudioProvider } from "./state/StudioProvider";

function AdminRoute() {
  const { ready, role } = useAuth();
  if (!ready) {
    return <div className="min-h-screen bg-surface-container-low" />;
  }
  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <AdminScreen />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StudioProvider>
          <Routes>
            <Route path="/" element={<StudioScreen />} />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </StudioProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
