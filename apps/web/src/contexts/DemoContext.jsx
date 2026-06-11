import React, { createContext, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { buildDemoData } from '@/utils/demoData.js';

const DemoContext = createContext(null);

export function DemoProvider({ children }) {
  const value = useMemo(() => buildDemoData(), []);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo debe usarse dentro de DemoProvider');
  return context;
}

DemoProvider.propTypes = { children: PropTypes.node.isRequired };
