function HeroBanner({ requirements, overallStatus, clearance }) {
  const totalCount = requirements.length;
  const clearedCount = requirements.filter(item => item.status && item.status.toLowerCase() === "cleared").length;
  const completionPercentage = totalCount
    ? Math.round((clearedCount / totalCount) * 100)
    : 0;
  const academicTerm = [
    clearance?.semester,
    clearance?.academic_year ? `AY ${clearance.academic_year}` : null,
    clearance?.clearance_type_name,
  ].filter(Boolean).join(" · ") || "Student clearance overview";

  return (
    <div className="hero-banner">
      <div className="hero-content">
        <div className="hero-text">
          <span className="hero-term-subtitle">{academicTerm}</span>
          <h1 className="hero-main-title">Your clearance, at a glance</h1>
          <div className="hero-status-wrapper">
            <span className={`hero-status-chip-badge static-state-${overallStatus.toLowerCase().replace(" ", "-")}`}>
              {overallStatus}
            </span>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="visual-card">
            <h4>Clearance progress</h4>
            <h2>{clearedCount} of {totalCount} requirements</h2>
            <div className="progress-bar-container-mini">
              <div
                className="progress-bar-fill-mini"
                style={{ width: `${completionPercentage}%` }}
                role="progressbar"
                aria-label="Clearance completion"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completionPercentage}
              />
            </div>
            <span className="visual-percentage-text">{completionPercentage}% complete</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroBanner;
