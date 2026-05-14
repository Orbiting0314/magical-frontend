import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext, useAuthProvider } from './hooks/useAuth';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KnowledgeBase from './pages/KnowledgeBase';
import ComponentDetail from './pages/ComponentDetail';
import AnswerKeys from './pages/AnswerKeys';
import NoteEditor from './pages/NoteEditor';
import Sources from './pages/Sources';
import SourceDetail from './pages/SourceDetail';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="knowledge" element={<KnowledgeBase />} />
              <Route path="knowledge/:id" element={<ComponentDetail />} />
              <Route path="notes/:id" element={<NoteEditor />} />
              <Route path="notes/:id/:slug" element={<NoteEditor />} />
              <Route path="answer-keys" element={<AnswerKeys />} />
              <Route path="sources" element={<Sources />} />
              <Route path="sources/:id" element={<SourceDetail />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
