function CircularGauge({ value, color, label }) {
    const radius = 26;
    const circumference = 2 * Math.PI * radius;
    const percent = Math.min(100, Math.max(0, value));
    const offset = circumference - (percent / 100) * circumference;

    return (
        <div className="confidence-bar__item">
            <div className="confidence-bar__circle">
                <svg width="64" height="64" viewBox="0 0 64 64">
                    {/* Background track */}
                    <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth="5"
                    />
                    {/* Value arc */}
                    <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                </svg>
                <span className="confidence-bar__circle-value">
                    {percent.toFixed(0)}%
                </span>
            </div>
            <span className="confidence-bar__label">{label}</span>
        </div>
    );
}

export default function ConfidenceBar({ plddtData }) {
    const veryHigh = plddtData?.very_high ?? 0;
    const confident = plddtData?.confident ?? 0;
    const low = plddtData?.low ?? 0;

    return (
        <div className="confidence-bar">
            <CircularGauge value={veryHigh} color="var(--plddt-very-high)" label="Very High" />
            <CircularGauge value={confident} color="var(--plddt-confident)" label="Confident" />
            <CircularGauge value={low} color="var(--plddt-low)" label="Low" />
        </div>
    );
}
