import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { ShieldCheck, TrendingDown, Zap, FileCheck, CheckCircle2 } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader.jsx';
import ModalFactory from '@/components/ModalFactory.jsx';
import useModalManager from '@/hooks/useModalManager.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { applyLandingHashFromLocation } from '@/utils/landingNavigation.js';
import heroFleetBackground from '@/assets/hero-fleet-background.png';

const LANDING_TEAM = [
  { name: 'Sebastian Ramirez Maldonado', role: 'Scrum Master', desc: 'Facilitador del equipo, asegura que se sigan las prácticas ágiles y elimina impedimentos.' },
  { name: 'Samuel Freile', role: 'Configuration Manager', desc: 'Responsable de la gestión de versiones, entornos y control de cambios del proyecto.' },
  { name: 'Sebastian Rodriguez Ramirez', role: 'QA Lead', desc: 'Líder de aseguramiento de calidad, diseña y ejecuta estrategias de pruebas para garantizar la excelencia.' },
  { name: 'Solon Losada', role: 'DevOps Engineer', desc: 'Encargado de la integración y despliegue continuo, infraestructura y automatización de procesos.' },
  { name: 'Sebastian Vargas', role: 'Product Owner y Sprint Planner', desc: 'Define la visión del producto, prioriza el backlog y planifica los sprints para maximizar el valor.' },
];

const LANDING_PLANES = [
  {
    name: 'Inicial',
    price: '$0',
    desc: 'Para probar el MVP con funciones básicas.',
    features: ['1 flota demo', 'Alertas básicas', 'Gestión SOAT (demo)'],
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    desc: 'Para equipos pequeños con operación realista.',
    features: ['Hasta 20 vehículos', 'Alertas por vencimiento', 'Dashboard y reportes básicos'],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'A convenir',
    desc: 'Para operaciones grandes y requerimientos avanzados.',
    features: ['Flotas ilimitadas', 'Roles y permisos', 'Integraciones (futuro)'],
    highlight: false,
  },
];

// Landing principal: presenta la propuesta de valor y deriva al usuario hacia registro o dashboard.
export default function HomePage() {
  const { activeModal, openModal, closeModal } = useModalManager();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/') return undefined;

    const frameId = requestAnimationFrame(() => {
      applyLandingHashFromLocation(location.hash);
    });

    return () => cancelAnimationFrame(frameId);
  }, [location.pathname, location.hash]);

  const openLogin = () => openModal('login');
  const openRegister = () => openModal('register');

  const handleCtaClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      openRegister();
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      <Helmet>
        <title>SYNTIX TECH | Drive Control</title>
      </Helmet>

      <PublicHeader onLoginClick={openLogin} onRegisterClick={openRegister} />

      {/* Hero Section */}
      <section
        id="inicio"
        className="hero-landing relative pt-20 pb-32 lg:pt-32 lg:pb-48 flex items-center"
        style={{ '--hero-bg-image': `url(${heroFleetBackground})` }}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <span className="inline-block py-1 px-3 rounded-full bg-syntix-green/20 text-syntix-green font-semibold text-sm mb-6 border border-syntix-green/30 backdrop-blur-sm">
              Gestión Inteligente de Flotas
            </span>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Blindaje Operativo para su Flota
            </h1>
            <p className="text-xl text-gray-200 mb-10 leading-relaxed">
              Automatización del cumplimiento legal (SOAT, Tecno, Licencias) para evitar inmovilizaciones y multas. La regla de oro para su tranquilidad.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handleCtaClick} className="bg-syntix-green text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-syntix-green/90 transition-all shadow-lg shadow-syntix-green/30 flex items-center justify-center gap-2">
                {isAuthenticated ? 'Ir al Dashboard' : 'Comenzar Ahora'} <Zap className="w-5 h-5" />
              </button>
              {!isAuthenticated && (
                <button onClick={openLogin} className="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-sm">
                  Acceso Clientes
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Servicios: primera sección tras el hero (orden comercial del menú) */}
      <section id="servicios" className="py-24 bg-white text-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-syntix-navy mb-4">Nuestros Servicios</h2>
          <p className="text-lg text-gray-600 mb-12">Soluciones avanzadas para el monitoreo y cumplimiento de flota.</p>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="p-6 border rounded-xl bg-white">
              <CheckCircle2 className="w-6 h-6 text-syntix-green mb-2" />
              <h3 className="text-xl font-bold text-syntix-navy mb-2">Centralización Documental</h3>
              <p className="text-sm text-gray-600">Todos los papeles de su flota en un solo lugar.</p>
            </div>
            <div className="p-6 border rounded-xl bg-white">
              <CheckCircle2 className="w-6 h-6 text-syntix-green mb-2" />
              <h3 className="text-xl font-bold text-syntix-navy mb-2">Sistema de Alertas</h3>
              <p className="text-sm text-gray-600">Avisos automáticos vía email y plataforma.</p>
            </div>
            <div className="p-6 border rounded-xl bg-white">
              <CheckCircle2 className="w-6 h-6 text-syntix-green mb-2" />
              <h3 className="text-xl font-bold text-syntix-navy mb-2">Reportes de Estado</h3>
              <p className="text-sm text-gray-600">Analítica sobre el cumplimiento de sus conductores.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section id="beneficios" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-syntix-navy mb-4">¿Por qué elegir Drive Control?</h2>
            <p className="text-lg text-gray-600">Nuestra plataforma aplica la "Regla de Oro": el estado de su vehículo es tan bueno como su documento más próximo a vencer.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Zap, title: 'Automatización', desc: 'Cálculo automático de estados y alertas tempranas.' },
              { icon: ShieldCheck, title: 'Cumplimiento Legal', desc: 'Evite inmovilizaciones por documentos vencidos.' },
              { icon: TrendingDown, title: 'Reducción de Costos', desc: 'Minimice gastos en multas y patios.' },
              { icon: FileCheck, title: 'Eficiencia Operativa', desc: 'Toda la información centralizada y accesible.' },
            ].map((b, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-syntix-green/10 flex items-center justify-center mb-6">
                  <b.icon className="w-7 h-7 text-syntix-green" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{b.title}</h3>
                <p className="text-gray-600 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-syntix-navy mb-4">Planes</h2>
            <p className="text-lg text-gray-600">
              Elige el plan que mejor se ajuste a tu operación. (Contenido demostrativo para el MVP)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LANDING_PLANES.map((plan) => (
              <div
                key={plan.name}
                className={[
                  'bg-white rounded-2xl border p-6 shadow-sm flex flex-col',
                  plan.highlight ? 'border-syntix-green shadow-md' : 'border-gray-100',
                ].join(' ')}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{plan.desc}</p>
                  </div>
                  {plan.highlight && (
                    <span className="text-xs font-semibold bg-green-50 text-syntix-green px-3 py-1 rounded-full">
                      Recomendado
                    </span>
                  )}
                </div>

                <div className="mt-6">
                  <div className="text-3xl font-extrabold text-syntix-navy">{plan.price}</div>
                  <div className="text-xs text-gray-500 mt-1">Precio referencial (demo)</div>
                </div>

                <ul className="mt-6 space-y-2 text-sm text-gray-700">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-1 inline-block w-2 h-2 rounded-full bg-syntix-green" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={[
                    'mt-8 w-full rounded-xl px-4 py-2 font-semibold transition',
                    plan.highlight
                      ? 'bg-syntix-navy text-white hover:opacity-90'
                      : 'bg-gray-100 text-syntix-navy hover:bg-gray-200',
                  ].join(' ')}
                  onClick={openRegister}
                >
                  Elegir plan
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nuestro Equipo: respaldo de confianza al final del flujo comercial */}
      <section id="equipo" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-syntix-navy mb-4">Nuestro Equipo</h2>
            <p className="text-lg text-gray-600">
              El talento detrás de SYNTIX TECH. Un equipo multidisciplinario comprometido con la excelencia y la innovación en la gestión de flotas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {LANDING_TEAM.map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow group"
              >
                <div className="w-20 h-20 bg-syntix-navy text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 group-hover:bg-syntix-green transition-colors shadow-inner">
                  {member.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-sm font-semibold text-syntix-green mb-3">{member.role}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-syntix-navy rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-syntix-green rounded-full opacity-20 blur-3xl"></div>
            <h3 className="text-2xl md:text-4xl font-bold text-white mb-4 relative z-10">
              <span className="text-syntix-green">$7.1M COP</span> promedio por multa/patio evitada
            </h3>
            <p className="text-gray-300 text-lg relative z-10">El retorno de inversión de Drive Control es inmediato al prevenir una sola inmovilización.</p>
          </div>
        </div>
      </section>

      <ModalFactory
        modalType={activeModal}
        onClose={closeModal}
        onSwitchToRegister={openRegister}
        onSwitchToLogin={openLogin}
      />
    </div>
  );
}
