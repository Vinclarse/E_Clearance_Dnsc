import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ExecutiveDashboard from "./pages/ExecutiveDashboard.jsx";
import ClearanceTemplates from "./pages/ClearanceTemplates.jsx";
import StudentDirectory from "./pages/StudentDirectory.jsx";
import SignatoryRoles from "./pages/SignatoryRoles.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
  return (
    <div className="page-wrapper">
      <Navbar />
      <Routes>
        <Route path="/" element={<ExecutiveDashboard />} />
        <Route path="/clearance-templates" element={<ClearanceTemplates />} />
        <Route path="/student-directory" element={<StudentDirectory />} />
        <Route path="/signatory-roles" element={<SignatoryRoles />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}