function normalizeStatus(status) {
  return (status || "pending").toLowerCase().replace(/[\s-]+/g, "_");
}

function getStatusLabel(status) {
  return {
    pending: "Pending",
    under_review: "Under review",
    deficiency: "Deficiency",
    cleared: "Cleared",
  }[status] || status.replace(/_/g, " ");
}

function getClearedAtLabel(clearedAt) {
  if (!clearedAt) return null;

  const date = new Date(clearedAt);
  return Number.isNaN(date.getTime())
    ? null
    : `Cleared ${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

function MainContent({ requirements, onUploadProof }) {
  const orderedRequirements = requirements
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (
      (a.item.order_sequence ?? a.index + 1) -
      (b.item.order_sequence ?? b.index + 1)
    ));
  const deficiencies = orderedRequirements.filter(
    ({ item }) => normalizeStatus(item.status) === "deficiency",
  );
  let earlierStepsCleared = true;

  return (
    <div className="main-content-layout">
      <section className="requirements-panel" aria-labelledby="requirements-title">
        <div className="panel-heading">
          <div>
            <p className="panel-eyebrow">Your checklist</p>
            <h2 id="requirements-title">Clearance requirements</h2>
          </div>
          <span className="panel-count">{requirements.length} steps</span>
        </div>
        <div className="requirements-list-container">
          {orderedRequirements.length === 0 ? (
            <div className="empty-checklist">
              <span className="empty-checklist-mark" aria-hidden="true">✓</span>
              <strong>No requirements to show yet</strong>
              <span>Your active clearance checklist will appear here.</span>
            </div>
          ) : orderedRequirements.map(({ item, index }) => {
            const status = normalizeStatus(item.status);
            const isCleared = status === "cleared";
            const isLocked = !earlierStepsCleared;
            const stepNumber = item.order_sequence ?? index + 1;
            const clearedAt = getClearedAtLabel(item.cleared_at);
            earlierStepsCleared = earlierStepsCleared && isCleared;

            return (
              <article
                className={`requirement-row-item requirement-${status}${isLocked ? " is-locked" : ""}`}
                key={item.id ?? item.requirement_name ?? stepNumber}
              >
                <span className={`step-marker step-${isLocked ? "locked" : status}`} aria-hidden="true">
                  {isCleared ? (
                    <svg viewBox="0 0 20 20" fill="none">
                      <path d="m4 10.5 4 4L16 6.5" />
                    </svg>
                  ) : isLocked ? (
                    <svg viewBox="0 0 20 20" fill="none">
                      <rect x="4.5" y="8.5" width="11" height="8" rx="1.5" />
                      <path d="M7 8.5V6a3 3 0 1 1 6 0v2.5" />
                    </svg>
                  ) : (
                    String(stepNumber).padStart(2, "0")
                  )}
                </span>
                <div className="requirement-copy">
                  <div className="requirement-title-line">
                    <h3>{item.requirement_name || "Clearance requirement"}</h3>
                    <span className={`tracker-blueprint-status-tag ${status}`}>
                      {getStatusLabel(status)}
                    </span>
                  </div>
                  <div className="requirement-meta">
                    <span>{item.authorizing_role_name || `Step ${stepNumber}`}</span>
                    {clearedAt && <span>{clearedAt}</span>}
                    {isLocked && (
                      <span className="locked-message" title="Complete the earlier step first">
                        Complete step {stepNumber - 1} to unlock
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="side-panel" aria-labelledby="alerts-title">
        <div className="panel-heading">
          <div>
            <p className="panel-eyebrow">Next steps</p>
            <h2 id="alerts-title">Needs your attention</h2>
          </div>
          {deficiencies.length > 0 && (
            <span className="alert-count">{deficiencies.length}</span>
          )}
        </div>
        <div className="requirements-list-container">
          {deficiencies.length === 0 ? (
            <div className="all-clear-state">
              <span className="all-clear-icon" aria-hidden="true">✓</span>
              <strong>You’re all caught up</strong>
              <span>No active deficiencies need your attention.</span>
            </div>
          ) : deficiencies.map(({ item, index }) => {
            const stepNumber = item.order_sequence ?? index + 1;
            const isLocked = orderedRequirements
              .slice(0, orderedRequirements.findIndex(({ item: candidate }) => candidate === item))
              .some(({ item: previousItem }) => normalizeStatus(previousItem.status) !== "cleared");

            return (
              <article className="deficiency-card" key={item.id ?? item.requirement_name}>
                <div className="deficiency-card-heading">
                  <span className="deficiency-symbol" aria-hidden="true">!</span>
                  <div>
                    <h3>{item.requirement_name || "Clearance requirement"}</h3>
                    <span>Action required</span>
                  </div>
                </div>
                <p className="deficiency-reason">
                  {item.remarks || "Please contact the listed office for details."}
                </p>
                {Number(item.amount_due) > 0 && (
                  <p className="deficiency-amount">
                    Amount due <strong>PHP {Number(item.amount_due).toFixed(2)}</strong>
                  </p>
                )}
                <button
                  type="button"
                  className="upload-proof-button"
                  onClick={() => onUploadProof?.(item.id)}
                  disabled={isLocked}
                  title={isLocked ? `Complete step ${stepNumber - 1} first` : undefined}
                >
                  {isLocked ? "Complete earlier steps first" : "Upload proof of settlement"}
                  {!isLocked && <span aria-hidden="true">→</span>}
                </button>
              </article>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

export default MainContent;
