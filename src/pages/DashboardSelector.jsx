import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * DashboardSelector component that automatically redirects to the Sales dashboard
 * instead of showing the selection screen
 */
const DashboardSelector = () => {
  const navigate = useNavigate();

  // Automatically redirect to the sales dashboard on component mount
  useEffect(() => {
    // Use window.location.href for a full page refresh instead of navigate()
    window.location.href = '/sales';
  }, []);

  // This component will not render anything as it will immediately redirect
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div className="text-white text-lg">Weiterleitung...</div>
    </div>
  );
};

export default DashboardSelector;