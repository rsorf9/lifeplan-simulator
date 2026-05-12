import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthGate } from './components/AuthGate';
import { DashboardPage } from './pages/DashboardPage';
import { ScenarioEditorPage } from './pages/ScenarioEditorPage';
import { AdminPage } from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/scenario/:id" element={<ScenarioEditorPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </AuthGate>
    </BrowserRouter>
  );
}
