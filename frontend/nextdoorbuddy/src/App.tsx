import { Routes, Route, Navigate } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Troc from "./pages/Troc"
import TrocForm from "./pages/TrocForm"
import MyTrocs from "./pages/MyTrocs"
import Signup from "./pages/Signup"
import Profile from "./pages/Profile"
import AdminUsers from "./pages/AdminUsers"
import AdminQuartiers from "./pages/AdminQuartiers"
import AdminTrocs from "./pages/AdminTrocs"
import Events from "./pages/Events"
import EventForm from "./pages/EventForm"
import TestCarousel from "./pages/TestCarousel"
import MyEvents from "./pages/MyEvents"
import Chat from "./pages/Chat"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { ChatProvider } from "./contexts/ChatContext"
import EventDetails from "./pages/EventsDetail.tsx";

// Composant pour les routes protégées
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Composant pour les routes admin
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/trocs" element={
        <ProtectedRoute>
          <Troc />
        </ProtectedRoute>
      } />
      <Route path="/trocs/create" element={
        <ProtectedRoute>
          <TrocForm />
        </ProtectedRoute>
      } />
      <Route path="/trocs/edit/:id" element={
        <ProtectedRoute>
          <TrocForm />
        </ProtectedRoute>
      } />
      <Route path="/trocs/my-trocs" element={
        <ProtectedRoute>
          <MyTrocs />
        </ProtectedRoute>
      } />
      <Route path="/events" element={
        <ProtectedRoute>
          <Events />
        </ProtectedRoute>
      } />
      <Route path="/events/my-events" element={
        <ProtectedRoute>
          <MyEvents />
        </ProtectedRoute>
      } />
      <Route path="/chat" element={
        <ProtectedRoute>
          <Chat />
        </ProtectedRoute>
      } />
      <Route path="/events/:id" element={
        <ProtectedRoute>
          <EventDetails />
        </ProtectedRoute>
      } />
      <Route path="/events/create" element={
        <ProtectedRoute>
          <EventForm />
        </ProtectedRoute>
      } />
      <Route path="/events/edit/:id" element={
        <ProtectedRoute>
          <EventForm />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <AdminRoute>
          <AdminUsers />
        </AdminRoute>
      } />
      <Route path="/admin/quartiers" element={
        <AdminRoute>
          <AdminQuartiers />
        </AdminRoute>
      } />
      <Route path="/admin/trocs" element={
        <AdminRoute>
          <AdminTrocs />
        </AdminRoute>
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/test-carousel" element={<TestCarousel />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <AppRoutes />
      </ChatProvider>
    </AuthProvider>
  );
}

export default App
