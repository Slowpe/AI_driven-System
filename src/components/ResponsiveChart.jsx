
import React from 'react';
import { ResponsiveContainer } from 'recharts';

const ResponsiveChart = ({ children }) => (
  <div className="w-full h-72">
    <ResponsiveContainer width="100%" height="100%">
      {children}
    </ResponsiveContainer>
  </div>
);

export default ResponsiveChart;
  