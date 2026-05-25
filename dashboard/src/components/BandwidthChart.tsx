import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: '#18181b',
      titleColor: '#a1a1aa',
      bodyColor: '#ffffff',
      borderColor: '#27272a',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      display: false,
      grid: {
        display: false,
      },
    },
    y: {
      display: false,
      grid: {
        display: false,
      },
    },
  },
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
};

interface BandwidthChartProps {
  dataPoints: number[];
  color?: string;
}

export default function BandwidthChart({ dataPoints, color = 'emerald' }: BandwidthChartProps) {
  const colors = {
    emerald: {
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgb(16, 185, 129)',
    },
    blue: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgb(59, 130, 246)',
    },
  };

  const selectedColor = color === 'blue' ? colors.blue : colors.emerald;

  const data = {
    labels: dataPoints.map((_, i) => i.toString()),
    datasets: [
      {
        fill: true,
        label: 'Bandwidth',
        data: dataPoints,
        borderColor: selectedColor.border,
        backgroundColor: selectedColor.bg,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="w-full h-full min-h-[60px]">
      <Line options={options} data={data} />
    </div>
  );
}
