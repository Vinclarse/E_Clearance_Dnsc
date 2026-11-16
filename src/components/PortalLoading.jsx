import "./PortalLoading.css";

export default function PortalLoading({ title, detail }) {
  return (
    <div className="portal-loading" role="status">
      <span className="portal-loading-spinner" aria-hidden="true" />
      <strong>{title}</strong>
      {detail ? <span>{detail}</span> : null}
    </div>
  );
}
