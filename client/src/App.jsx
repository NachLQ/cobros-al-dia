import { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Facturas from './pages/Facturas.jsx';
import FacturaDetalle from './pages/FacturaDetalle.jsx';
import Plantillas from './pages/Plantillas.jsx';
import FacturaForm from './components/FacturaForm.jsx';

function NavItem({ to, children, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex-1 sm:flex-none text-center px-4 py-2 rounded-xl text-sm font-semibold transition ${
          isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function App() {
  const [nuevaOpen, setNuevaOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 sm:pb-8">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-brand-600 text-white grid place-items-center font-bold">€</div>
            <div>
              <h1 className="font-bold leading-tight">Cobros al Día</h1>
              <p className="text-xs text-slate-400 leading-tight hidden sm:block">Seguimiento de cobros</p>
            </div>
          </div>
          <nav className="hidden sm:flex items-center gap-1">
            <NavItem to="/" end>Panel</NavItem>
            <NavItem to="/facturas">Facturas</NavItem>
            <NavItem to="/plantillas">Plantillas</NavItem>
          </nav>
          <button className="btn-primary" onClick={() => setNuevaOpen(true)}>
            <span className="text-lg leading-none">+</span>
            <span className="hidden sm:inline">Nueva factura</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        <Routes>
          <Route path="/" element={<Dashboard onNueva={() => setNuevaOpen(true)} />} />
          <Route path="/facturas" element={<Facturas onNueva={() => setNuevaOpen(true)} />} />
          <Route path="/facturas/:id" element={<FacturaDetalle />} />
          <Route path="/plantillas" element={<Plantillas />} />
        </Routes>
      </main>

      {/* Barra de navegación inferior (mobile) */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 px-3 py-2 flex gap-1">
        <NavItem to="/" end>Panel</NavItem>
        <NavItem to="/facturas">Facturas</NavItem>
        <NavItem to="/plantillas">Plantillas</NavItem>
      </nav>

      <FacturaForm
        open={nuevaOpen}
        onClose={() => setNuevaOpen(false)}
        onSaved={(f) => navigate(`/facturas/${f.id}`)}
      />
    </div>
  );
}
