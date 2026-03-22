import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

export default function PldtMetrics({ plddtData, sequence }) {
  const mean = plddtData?.mean ?? null;
  const perResidue = plddtData?.per_residue || [];
  const sequenceLength = sequence?.length || 0;
  
  const isValidated = perResidue.length > 0 && perResidue.length === sequenceLength;

  const chartData = useMemo(() => {
    if (!perResidue.length) return [];
    return perResidue.map((val, i) => {
      let conf = 'Very Low';
      if (val > 90) conf = 'Very High';
      else if (val > 70) conf = 'Confident';
      else if (val > 50) conf = 'Low';

      return {
        residueIndex: i + 1,
        plddt: val,
        aminoAcid: sequence?.[i] || '?',
        confidence: conf,
      };
    });
  }, [perResidue, sequence]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: '#fff',
          border: '1px solid #E9EDF7',
          padding: '8px 12px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          fontSize: 13,
          color: 'var(--navy)',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Residue {data.residueIndex}</div>
          <div>Amino Acid: <strong>{data.aminoAcid}</strong></div>
          <div>pLDDT: <strong>{typeof data.plddt === 'number' ? data.plddt.toFixed(2) : data.plddt}</strong></div>
          <div style={{ 
            color: data.plddt > 90 ? '#05cd99' : data.plddt > 70 ? '#4318FF' : data.plddt > 50 ? '#FFCE20' : '#EE5D50',
            fontWeight: 500,
            marginTop: 4
          }}>
            {data.confidence}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card" id="plddt-metrics-card">
      <div className="card__header">
        <div className="card__title">
          <span
            className="card__title-icon"
            style={{ background: 'rgba(27, 37, 89, 0.08)', color: 'var(--navy)' }}
          >
            ❤️
          </span>
          pLDDT Score
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>ⓘ</span>
        </div>
        <div className="card__actions">
          <button className="card__action-btn" title="Calendar">📅</button>
          <button className="card__action-btn" title="More">⋮</button>
        </div>
      </div>

      <div className="card__body">
        {/* Validation Check */}
        {perResidue.length > 0 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6, 
            marginBottom: 12,
            padding: '8px 12px',
            background: isValidated ? 'rgba(5, 205, 153, 0.1)' : 'rgba(238, 93, 80, 0.1)',
            borderRadius: 6,
            color: isValidated ? 'var(--success)' : 'var(--danger)',
            fontSize: 13,
            fontWeight: 500
          }}>
            <span>{isValidated ? '✓' : '⚠️'}</span>
            <span>
              {isValidated 
                ? `Validation Passed: PDB array size (${perResidue.length}) matches sequence length (${sequenceLength}).`
                : `Validation Failed: PDB array size (${perResidue.length}) does not match sequence length (${sequenceLength}).`}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
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
              color: 'var(--navy)',
            }}
          >
            {mean !== null ? mean.toFixed(2) : '—'}
          </span>
        </div>

        {/* Recharts Area Chart */}
        {chartData.length > 0 ? (
          <div className="plddt-metrics__chart" style={{ height: 280, width: '100%', marginTop: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPlddt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B2559" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1B2559" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9EDF7" />
                <XAxis 
                  dataKey="residueIndex" 
                  tick={{ fontSize: 10, fill: '#A3AED0' }} 
                  axisLine={false} 
                  tickLine={false}
                  minTickGap={20}
                />
                <YAxis 
                  domain={[0, 100]} 
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 10, fill: '#A3AED0' }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="plddt" 
                  stroke="#1B2559" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPlddt)" 
                  activeDot={{ r: 4, strokeWidth: 0, fill: '#4318FF' }}
                />
              </AreaChart>
            </ResponsiveContainer>
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
              height: 200
            }}
          >
             No data yet
          </div>
        )}

        <p className="plddt-metrics__desc" style={{ marginTop: 16 }}>
          pLDDT is a per-residue confidence estimate (0-100). Scores above 90 indicate very high
          confidence; 70-90 suggests a generally reliable backbone prediction.
        </p>
      </div>
    </div>
  );
}
