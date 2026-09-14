// src/features/loyalty/components/LevelProgressArc.tsx
type LevelProgressArcProps = { progressPercent: number; size?: number }

export function LevelProgressArc({ progressPercent, size = 160 }: LevelProgressArcProps) {
	const strokeWidth = 14
	const radius = size / 2 - strokeWidth
	const circumference = Math.PI * radius
	const clamped = Math.min(100, Math.max(0, progressPercent))
	const dashOffset = circumference - (clamped / 100) * circumference
	const arcPath = `M ${strokeWidth} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size / 2}`

	return (
		<svg width={size} height={size / 2 + strokeWidth}>
			<path d={arcPath} fill="none" stroke="currentColor" className="text-border" strokeWidth={strokeWidth} strokeLinecap="round" />
			<path
				d={arcPath}
				fill="none"
				stroke="currentColor"
				className="text-primary"
				strokeWidth={strokeWidth}
				strokeLinecap="round"
				strokeDasharray={circumference}
				strokeDashoffset={dashOffset}
				style={{ transition: "stroke-dashoffset 0.6s ease" }}
			/>
		</svg>
	)
}