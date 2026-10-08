import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import ApplyJob from "./pages/ApplyJob";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PostJob from "./pages/PostJob";
import ProviderJob from "./pages/ProviderJob";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Messages from "./pages/Messages";
import MessageInbox from "./pages/MessageInbox";
import AdminVerification from "./pages/AdminVerification";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
  path="/admin/verifications"
  element={
    <ProtectedRoute role="admin">
      <AdminVerification />
    </ProtectedRoute>
  }
/>
        <Route path="/" element={<Home />} />

        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/jobs/:id/apply" element={<ApplyJob />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/provider/jobs/:id" element={<ProviderJob />} />

        <Route path="/notifications" element={<Notifications />} />

        <Route path="/profile" element={<Profile />} />
        <Route path="/users/:id/profile" element={<PublicProfile />} />
        <Route path="/messages" element={<MessageInbox />} />
        <Route path="/messages/:userId" element={<Messages />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}