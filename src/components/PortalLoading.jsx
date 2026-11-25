import "./PortalLoading.css";

export default function PortalLoading({ title, detail }) {
  return (
    <div className="portal-loading" role="status" aria-live="polite">
      <span className="portal-loading-spinner" aria-hidden="true" />
      {title ? <strong>{title}</strong> : null}
      {detail ? <span>{detail}</span> : null}
    </div>
  );
}
