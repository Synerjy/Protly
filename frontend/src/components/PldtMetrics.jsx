import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

export default function PldtMetrics({ plddtData, sequence }) {
  const mean = plddtData?.mean ?? null;

  const chartData = useMemo(() => {
    const perResidue = plddtData?.per_residue || [];
    if (!perResidue.length) return null;

    // Down-sample if too many residues for readability
    const step = Math.max(1, Math.floor(perResidue.length / 80));
    const sampled = perResidue.filter((_, i) => i % step === 0);
    const labels = sampled.map((_, i) => (i * step + 1).toString());

    return {
      labels,
      datasets: [
        {
          data: sampled,
          borderColor: '#1B2559',
          backgroundColor: 'rgba(27, 37, 89, 0.06)',
          borderWidth: 1.5,
          pointRadius: 0,
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [plddtData?.per_residue]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y;
            const residueIdx = parseInt(ctx.label) - 1;
            const aa = sequence?.[residueIdx] || '';
            const conf =
              val > 90 ? 'Very High' : val > 70 ? 'Confident' : val > 50 ? 'Low' : 'Very Low';
            return [`pLDDT: ${val.toFixed(1)} (${conf})`, aa ? `Amino Acid: ${aa}` : ''].filter(
              Boolean
            );
          },
          title: (items) => `Residue ${items[0]?.label}`,
        },
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: true,
        min: 0,
        max: 100,
        ticks: {
          font: { size: 10, family: 'Inter' },
          color: '#A3AED0',
          stepSize: 25,
        },
        grid: {
          color: '#E9EDF722',
        },
      },
    },
  };

  return (
    <div className="card" id="plddt-metrics-card">
      <div className="card__header">
        <div className="card__title">
          <span
            className="card__title-icon"
            style={{ color: 'var(--accent)' }}
          >
            ❤️
          </span>
          pLDDT Score
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>ⓘ</span>
        </div>
        <div className="card__actions">
          <button className="card__action-btn" title="Calendar">
            📅
          </button>
          <button className="card__action-btn" title="More">
            ⋮
          </button>
        </div>
      </div>

      <div className="card__body">
        <p
          style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}
        >
          <strong>pLDDT Analysis</strong>
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            The average confidence score is
          </span>
          <span
            style={{
              background: 'var(--bg)',
              borderRadius: 'var(--radius-full)',
              padding: '2px 10px',
              fontWeight: 700,
              fontSize: 13,
              color: 'var(--text-primary)',
            }}
          >
            {mean !== null ? mean.toFixed(2) : '—'}
          </span>
        </div>

        {/* Sparkline chart */}
        {chartData ? (
          <div className="plddt-metrics__chart">
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div
            className="plddt-metrics__chart"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: 13,
            }}
          >
            No data yet
          </div>
        )}

        <p className="plddt-metrics__desc">
          pLDDT is a per-residue confidence estimate (0-100). Scores above 90 indicate very high
          confidence; 70-90 suggests a generally reliable backbone prediction.
        </p>
      </div>
    </div>
  );
}
