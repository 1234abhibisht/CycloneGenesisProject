import React from 'react';
import { Outlet } from 'react-router-dom';

export const LandingLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] to-gray-900 text-[#0B2A33]">
      <main className="container mx-auto p-6 flex flex-col min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};
