import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Components/Layout";
import ProtectedRoute from "./Components/ProtectedRoute";
import AdminRoute from "./Components/AdminRoute";
import AdminDashboard from "./Pages/AdminDashboard";
import UserManagement from "./Pages/UserManagement";
import CharityManagement from "./Pages/CharityManagement";
import SubscriptionManagement from "./Pages/SubscriptionManagement";
import DrawManagement from "./Pages/DrawManagement";
import WinnersManagement from "./Pages/WinnersManagement";
import MyMembership from "./Pages/MyMembership";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Dashboard from "./Pages/Dashboard";
import Charities from "./Pages/Charities";
import GolfScores from "./Pages/GolfScores";
import Membership from "./Pages/Membership";
import Draws from "./Pages/Draws";
import NotFound from "./Pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/charities" element={<Charities />} />
          <Route path="/draws" element={<Draws />} />

          {/* Protected pages */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/golf-scores" element={<GolfScores />} />
            <Route path="/my-membership" element={<MyMembership />} />
          </Route>

          {/* Admin pages */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/charities" element={<CharityManagement />} />
            <Route path="/admin/subscriptions" element={<SubscriptionManagement />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/draws" element={<DrawManagement />} />
            <Route path="/admin/winners" element={<WinnersManagement />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
