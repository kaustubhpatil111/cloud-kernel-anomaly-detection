import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler, TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import styles from './ChartSection.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, TimeScale);

export default function ChartSection({ lossHistory, timestamps, currentLoss, anomalyThreshold, onThresholdChange }) {
  const getLossColor = (loss) => {
    if (loss > anomalyThreshold) return '#ef4444';
    if (loss > anomalyThreshold * 0.8) return '#f97316';
    return '#10b981';
  };

  const chartData = {
    labels: timestamps,
    datasets: [
      {
        label: 'Anomaly Score',
        data: lossHistory,
        borderColor: getLossColor(currentLoss),
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, `${getLossColor(currentLoss)}80`);
          gradient.addColorStop(1, `${getLossColor(currentLoss)}10`);
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointRadius: (ctx) => ctx.raw > anomalyThreshold ? 6 : 3,
        pointBackgroundColor: (ctx) => ctx.raw > anomalyThreshold ? '#ef4444' : '#3b82f6',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointHoverRadius: 8,
      },
      {
        label: 'Threshold',
        data: Array(lossHistory.length).fill(anomalyThreshold),
        borderColor: '#f97319',
        borderWidth: 2,
        borderDash: [5,5],
        pointRadius: 0,
        fill: false,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    interaction: { mode: 'index', intersect: false },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'var(--border)' },
        ticks: { color: 'var(--text)' },
        title: { display: true, text: 'Anomaly Score', color: 'var(--text)' }
      },
      x: {
        type: 'time',
        time: { unit: 'second', displayFormats: { second: 'HH:mm:ss' } },
        grid: { display: false },
        ticks: { color: 'var(--text)' }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'var(--code-bg)',
        titleColor: 'var(--text-h)',
        bodyColor: 'var(--text)',
        borderColor: 'var(--accent)',
        borderWidth: 2,
      }
    }
  };

  return (
    <div className={`${styles.section} glass`}>
      <div className={styles.header}>
        <h2>📈 Real‑time Anomaly Score</h2>
        <label className={styles.slider}>
          <span>Threshold: {anomalyThreshold}</span>
          <input
            type="range"
            min="5" max="8" step="0.1"
            value={anomalyThreshold}
            onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
          />
        </label>
      </div>
      <div className={styles.chartWrap}>
        {lossHistory.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Awaiting data stream...</p>
          </div>
        )}
      </div>
    </div>
  );
}