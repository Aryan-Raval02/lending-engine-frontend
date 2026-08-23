import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface RiskGaugeProps {
  score: number; // 0 to 100
  size?: number;
}

const RiskGauge: React.FC<RiskGaugeProps> = ({ score, size = 60 }) => {
  
  // Determine color based on score
  let color = '#4caf50'; // Green (LOW)
  if (score < 40) color = '#b71c1c'; // Dark Red (VERY HIGH)
  else if (score < 60) color = '#f44336'; // Red (HIGH)
  else if (score < 80) color = '#ff9800'; // Orange (MEDIUM)
  
  const data = {
    datasets: [
      {
        data: [score, 100 - score],
        backgroundColor: [color, 'rgba(255, 255, 255, 0.1)'],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
        cutout: '80%',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: { enabled: false },
      legend: { display: false }
    }
  };

  return (
    <div style={{ position: 'relative', width: size, height: size / 2, display: 'inline-block' }}>
      <Doughnut data={data} options={options} />
      <div style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translate(-50%, -100%)',
        fontSize: size * 0.25,
        fontWeight: 'bold',
        color: 'var(--text-primary)',
        lineHeight: 1
      }}>
        {score}
      </div>
    </div>
  );
};

export default RiskGauge;
