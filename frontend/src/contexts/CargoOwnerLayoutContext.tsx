import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface CargoOwnerLayoutContextValue {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const CargoOwnerLayoutContext = createContext<CargoOwnerLayoutContextValue | undefined>(undefined);

interface CargoOwnerLayoutProviderProps {
  value: CargoOwnerLayoutContextValue;
  children: ReactNode;
}

export const CargoOwnerLayoutProvider: React.FC<CargoOwnerLayoutProviderProps> = ({
  value,
  children,
}) => (
  <CargoOwnerLayoutContext.Provider value={value}>
    {children}
  </CargoOwnerLayoutContext.Provider>
);

export const useCargoOwnerLayout = () => useContext(CargoOwnerLayoutContext);

