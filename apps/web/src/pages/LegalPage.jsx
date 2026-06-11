import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowLeft, LockKeyhole, Scale } from 'lucide-react';
import PublicFooter from '@/components/PublicFooter.jsx';

const content = {
  privacidad: {
    icon: LockKeyhole,
    title: 'Privacidad',
    description: 'Cómo DriveControl protege y utiliza la información de tu flota.',
    sections: [
      ['Uso de la información', 'Los datos registrados se utilizan únicamente para gestionar vehículos, conductores, documentos, alertas y reportes dentro de la cuenta correspondiente.'],
      ['Aislamiento por cuenta', 'Cada usuario accede exclusivamente a la información asociada a su cuenta autenticada.'],
      ['Seguridad', 'DriveControl utiliza autenticación y controles de acceso para reducir el riesgo de acceso no autorizado. No publiques credenciales ni información sensible en campos operativos.'],
    ],
  },
  terminos: {
    icon: Scale,
    title: 'Términos de uso',
    description: 'Condiciones generales para utilizar DriveControl.',
    sections: [
      ['Propósito', 'DriveControl apoya la gestión documental de flotas y la prevención de vencimientos. La plataforma no reemplaza la validación ante autoridades o entidades emisoras.'],
      ['Responsabilidad de la información', 'El usuario es responsable de mantener datos correctos y actualizados para que alertas y reportes sean confiables.'],
      ['Disponibilidad', 'Las funciones pueden evolucionar mientras el producto continúa mejorando. Los cambios buscarán conservar la seguridad y la integridad de la información.'],
    ],
  },
};

export default function LegalPage({ type }) {
  const page = content[type] || content.privacidad;
  const Icon = page.icon;
  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet><title>{page.title} | DriveControl</title></Helmet>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-lg font-black text-syntix-navy">Drive<span className="text-syntix-green">Control</span></Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-syntix-green"><ArrowLeft className="h-4 w-4" /> Volver al inicio</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="inline-flex rounded-2xl bg-syntix-green/10 p-3 text-syntix-green"><Icon className="h-7 w-7" /></div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-syntix-navy">{page.title}</h1>
          <p className="mt-3 text-slate-600">{page.description}</p>
          <div className="mt-10 space-y-8">
            {page.sections.map(([title, description]) => (
              <section key={title}>
                <h2 className="text-lg font-black text-slate-900">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
              </section>
            ))}
          </div>
          <p className="mt-10 border-t border-slate-100 pt-6 text-xs text-slate-400">Última actualización: junio de 2026 · DriveControl v1.0.0</p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

LegalPage.propTypes = { type: PropTypes.oneOf(['privacidad', 'terminos']).isRequired };
