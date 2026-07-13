import './App.css'
import { BrowserRouter,Routes,Route,Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

const DashboardPlaceholder = () => (
  <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
    <h1 className="text-xl font-semibold">Protected Dashboard Screen!</h1>
  </div>
);


export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC/OPEN Routes */} 
        <Route path="/login" element={<Login/>}/>
        <Route path="/register" element={<Register />} />

        {/* PROTECTED/PRIVATE Routes (Caged by our guard) */} 
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPlaceholder />} />
          {/* Any future private screens go right here! */}
          {/* FALLBACK / AUTO-REDIRECTS*/}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}