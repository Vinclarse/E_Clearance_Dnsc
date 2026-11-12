function OverviewCards({ requirements }) {
  const getStatusCount = (status) => requirements.filter(
    (item) => (item.status || "").toLowerCase().replace(/[\s-]+/g, "_") === status,
  ).length;
  const totalCount = requirements.length;
  const clearedCount = getStatusCount("cleared");
  const pendingCount = getStatusCount("pending");
  const underReviewCount = getStatusCount("under_review");
  const deficiencyCount = getStatusCount("deficiency");
  const metrics = [
    {
      label: "Total requirements",
      value: totalCount,
      detail: "For this clearance",
      className: "metric-total",
      icon: <><path d="M7 3.75h7l4.25 4.5v12A.75.75 0 0 1 17.5 21h-10a.75.75 0 0 1-.75-.75V4.5A.75.75 0 0 1 7 3.75Z" /><path d="M14 4v5h4M9 13h6M9 16.5h6" /></>,
    },
    {
      label: "Cleared",
      value: clearedCount,
      detail: "Approved requirements",
      className: "metric-cleared",
      icon: <><path d="m5 12.5 4.2 4.2L19 7" /></>,
    },
    {
      label: "Awaiting review",
      value: pendingCount + underReviewCount,
      detail: "Pending or under review",
      className: "metric-pending",
      icon: <><circle cx="12" cy="12" r="8.25" /><path d="M12 7v5l3.25 2" /></>,
    },
    {
      label: "Needs attention",
      value: deficiencyCount,
      detail: "Open deficiencies",
      className: "metric-deficiency",
      icon: <><path d="M12 3.5 21 20H3l9-16.5Z" /><path d="M12 9v4.5m0 3h.01" /></>,
    },
  ];

  return (
    <div className="overview-cards">
      {metrics.map((metric) => (
        <article className={`overview-card ${metric.className}`} key={metric.label}>
          <div className="metric-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              {metric.icon}
            </svg>
          </div>
          <div className="metric-copy">
            <span className="card-label">{metric.label}</span>
            <strong className="metric-value">{metric.value}</strong>
            <span className="metric-detail">{metric.detail}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

export default OverviewCards;
