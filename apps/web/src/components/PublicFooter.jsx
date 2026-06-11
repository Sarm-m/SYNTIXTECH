import React from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer id="contacto" className="border-t border-blue-400/10 bg-[#020617] text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_0.7fr_0.7fr] lg:px-8">
        <div>
          <Link to="/" className="text-xl font-black text-white">Drive<span className="text-blue-400">Control</span></Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">
            Gestión documental de flotas para anticipar vencimientos, reducir riesgos y mantener la operación bajo control.
          </p>
          <div className="mt-5 flex max-w-xl gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs leading-5 text-slate-400">
            <LockKeyhole className="h-5 w-5 shrink-0 text-blue-300" />
            Tus datos se mantienen privados por cuenta y se usan únicamente para la gestión documental de tu flota.
          </div>
        </div>
        <div>
          <p className="text-sm font-black text-white">Producto</p>
          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <Link className="block hover:text-white" to="/demo/dashboard">Ver demo</Link>
            <Link className="block hover:text-white" to="/#funciones">Funciones</Link>
            <Link className="block hover:text-white" to="/#seguridad">Seguridad</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-black text-white">Información</p>
          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <Link className="block hover:text-white" to="/privacidad">Privacidad</Link>
            <Link className="block hover:text-white" to="/terminos">Términos</Link>
            <p>Soporte disponible desde la plataforma.</p>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 px-4 py-5 text-center text-xs leading-6 text-slate-500">
        <p>DriveControl — desarrollado por Sarm</p>
        <p>© 2026 SYNTIX TECH. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
