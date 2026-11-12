function ClearanceTracker({ requirements = [], overallStatus, clearance }) {
  const deficiencyCount = requirements.filter(item => item.status && item.status.toLowerCase() === "deficiency").length;
  const pendingCount = requirements.filter(item => item.status && item.status.toLowerCase() === "pending").length;
  const underReviewCount = requirements.filter(item => item.status && item.status.toLowerCase() === "under_review").length;
  const clearedCount = requirements.filter(item => item.status && item.status.toLowerCase() === "cleared").length;
  const totalCount = requirements.length;
  const completionPercentage = totalCount
    ? Math.round((clearedCount / totalCount) * 100)
    : 0;

  return (
    <div className="tracker-blueprint-layout">
      <div className="tracker-blueprint-hero-capsule-filled">
        <div className="tracker-stat-hero-block">
          <span className="tracker-stat-hero-label">Total Cleared</span>
          <h2 className="tracker-stat-hero-val">{clearedCount} / {totalCount}</h2>
        </div>
        <div className="tracker-stat-hero-block">
          <span className="tracker-stat-hero-label">Pending Sign-off</span>
          <h2 className="tracker-stat-hero-val">{pendingCount + underReviewCount} Steps</h2>
        </div>
        <div className="tracker-stat-hero-block">
          <span className="tracker-stat-hero-label">Active Deficiencies</span>
          <h2 className="tracker-stat-hero-val" style={{ color: deficiencyCount > 0 ? "#d84c4c" : "inherit" }}>
            {deficiencyCount} Items
          </h2>
        </div>
      </div>

      <div className="tracker-blueprint-split-row">
        <div className="tracker-blueprint-main-box">
          <div className="tracker-blueprint-inner-row-zone">
            <div className="tracker-blueprint-left-meta-group">
              <h3 className="tracker-blueprint-card-main-title">Evaluation Breakdown Tracks</h3>
            </div>
            <div className={`tracker-blueprint-status-badge static-state-${overallStatus.toLowerCase().replace(" ", "-")}`}>
              {overallStatus}
            </div>
          </div>
          <hr className="tracker-blueprint-divider-line" />
          
          <div className="tracker-blueprint-list-container">
            {requirements.map((step, index) => (
              <div className="tracker-blueprint-list-row-item" key={step.id || index}>
                <span className="tracker-blueprint-item-name">
                  Step {index + 1}: {step.requirement_name}
                </span>
                <span className={`tracker-blueprint-status-tag ${step.status.toLowerCase()}`}>
                  {step.status.toUpperCase().replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="tracker-blueprint-side-column">
          <div className="tracker-blueprint-side-mini-capsule-filled">
            <span className="side-capsule-label">Completion Status</span>
            <h3 className="side-capsule-val">{completionPercentage}%</h3>
            <div className="side-capsule-progress-bar-bg">
              <div className="side-capsule-progress-bar-fill" style={{ width: `${completionPercentage}%` }}></div>
            </div>
          </div>
          <div className="tracker-blueprint-side-mini-capsule-filled">
            <span className="side-capsule-label">Active Tracking Term</span>
            <h3 className="side-capsule-val-text">{clearance?.semester || "—"}</h3>
            <span className="side-capsule-subtext-text">
              {clearance?.academic_year ? `AY ${clearance.academic_year}` : "Academic year unavailable"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClearanceTracker;
