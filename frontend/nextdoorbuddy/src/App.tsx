import { Routes, Route, Navigate } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Troc from "./pages/Troc"
import TrocForm from "./pages/TrocForm"
import TrocDetail from "./pages/TrocDetail"
import MyTrocs from "./pages/MyTrocs"
import Signup from "./pages/Signup"
import Profile from "./pages/Profile"
import AdminUsers from "./pages/AdminUsers"
import AdminQuartiers from "./pages/AdminQuartiers"
import AdminTrocs from "./pages/AdminTrocs"
import AdminDashboard from "./pages/AdminDashboard"

import Events from "./pages/Events"
import EventForm from "./pages/EventForm"
import TestCarousel from "./pages/TestCarousel"
import MyEvents from "./pages/MyEvents"
import Chat from "./pages/Chat"
import Journal from "./pages/Journal"
import NewJournal from "./pages/NewJournal"
import CreateJournal from "./pages/CreateJournal"
import ArticleForm from "./pages/ArticleForm"
import ArticleDetail from "./pages/ArticleDetail"
import EditionDetail from "./pages/EditionDetail"

import I18nTest from "./pages/I18nTest"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { ChatProvider } from "./contexts/ChatContext"
import EventDetails from "./pages/EventsDetail.tsx";

// Composant pour les routes protégées
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
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
      <Route path="/trocs/:id" element={
        <ProtectedRoute>
          <TrocDetail />
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
      <Route path="/journal" element={
        <ProtectedRoute>
          <Journal />
        </ProtectedRoute>
      } />

      <Route path="/journal/new" element={
        <ProtectedRoute>
          <NewJournal />
        </ProtectedRoute>
      } />

      <Route path="/journal/create-journal" element={
        <ProtectedRoute>
          <CreateJournal />
        </ProtectedRoute>
      } />

      <Route path="/journal/create" element={
        <ProtectedRoute>
          <ArticleForm />
        </ProtectedRoute>
      } />
      <Route path="/journal/edit/:id" element={
        <ProtectedRoute>
          <ArticleForm />
        </ProtectedRoute>
      } />
      <Route path="/journal/:id" element={
        <ProtectedRoute>
          <ArticleDetail />
        </ProtectedRoute>
      } />
      <Route path="/journal/edition/:uuid" element={
        <ProtectedRoute>
          <EditionDetail />
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
      <Route path="/admin/dashboard" element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
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
      <Route path="/i18n-test" element={<I18nTest />} />
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
