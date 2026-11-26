import "./PortalLoading.css";

function Sk({ width = "100%", height = 12, dark = false, className = "", style = {} }) {
  return (
    <div
      aria-hidden="true"
      className={`${dark ? "sk-shimmer-dark" : "sk-shimmer"} ${className}`.trim()}
      style={{ width, height, ...style }}
    />
  );
}

function StudentSkeleton() {
  return (
    <div className="sk-student">
      <div className="sk-card sk-student-hero">
        <div className="sk-col" style={{ flex: 1 }}>
          <Sk width="160px" height={10} />
          <Sk width="52%" height={24} />
          <Sk width="38%" height={11} />
        </div>
        <div className="sk-col" style={{ width: 180, alignItems: "flex-end" }}>
          <Sk width="92px" height={24} style={{ borderRadius: 999 }} />
          <Sk width="100%" height={10} />
        </div>
      </div>

      <div className="sk-student-cards">
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="sk-card sk-col">
            <Sk width="55%" height={10} />
            <Sk width="40%" height={26} />
            <Sk width="70%" height={10} />
          </div>
        ))}
      </div>

      <div className="sk-student-split">
        <div className="sk-card sk-col">
          <div className="sk-row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <Sk width="180px" height={16} />
            <Sk width="64px" height={20} style={{ borderRadius: 999 }} />
          </div>
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="sk-checklist-item">
              <Sk width={34} height={34} className="sk-circle" />
              <div className="sk-col" style={{ flex: 1, gap: 6 }}>
                <Sk width="52%" height={13} />
                <Sk width="32%" height={10} />
              </div>
              <Sk width={76} height={22} style={{ borderRadius: 999 }} />
            </div>
          ))}
        </div>

        <div className="sk-card sk-col">
          <Sk width="140px" height={16} />
          <div className="sk-col" style={{ padding: 14, borderRadius: 12, background: "#f7f8f3" }}>
            <Sk width="60%" height={13} />
            <Sk width="92%" height={10} />
            <Sk width="75%" height={10} />
            <Sk width="100%" height={36} style={{ marginTop: 6, borderRadius: 10 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SignatorySkeleton() {
  return (
    <div className="sk-signatory">
      <div className="sk-col" style={{ gap: 16 }}>
        <div className="sk-signatory-stats">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="sk-card sk-col">
              <Sk width="48%" height={10} />
              <Sk width="32%" height={28} />
              <Sk width="64%" height={10} />
            </div>
          ))}
        </div>
        <div className="sk-card sk-col">
          <div className="sk-row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <Sk width="160px" height={16} />
            <Sk width="110px" height={12} />
          </div>
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="sk-table-row">
              <Sk width="76%" height={12} />
              <Sk width="64%" height={12} />
              <Sk width="72px" height={20} style={{ borderRadius: 999 }} />
              <Sk width="58%" height={12} />
              <Sk width="74px" height={26} style={{ borderRadius: 999, justifySelf: "end" }} />
            </div>
          ))}
        </div>
      </div>

      <div className="sk-card-dark sk-col" style={{ minHeight: 340 }}>
        <Sk dark width="45%" height={10} />
        <Sk dark width="80%" height={22} />
        <Sk dark width="65%" height={12} />
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="sk-row">
              <Sk dark width={10} height={10} className="sk-circle" />
              <div className="sk-col" style={{ flex: 1, gap: 5 }}>
                <Sk dark width="72%" height={11} />
                <Sk dark width="46%" height={9} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="sk-admin-exec">
      <div className="sk-card-dark sk-col" style={{ minHeight: 420 }}>
        <Sk dark width="60%" height={10} />
        <Sk dark width="85%" height={20} />
        <Sk dark width="70%" height={11} />
        <div className="sk-col" style={{ marginTop: 14 }}>
          {[0, 1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="sk-row">
              <Sk dark width={22} height={22} className="sk-circle" />
              <Sk dark width="70%" height={11} />
            </div>
          ))}
        </div>
      </div>

      <div className="sk-col" style={{ gap: 16 }}>
        <div className="sk-admin-top">
          <div className="sk-card sk-col">
            <Sk width="190px" height={16} />
            <Sk width="220px" height={10} />
            <div className="sk-row" style={{ marginTop: 12, gap: 20 }}>
              <Sk width={120} height={120} className="sk-circle" />
              <div className="sk-col" style={{ flex: 1 }}>
                {[0, 1, 2, 3].map((row) => (
                  <Sk key={row} width="100%" height={12} />
                ))}
              </div>
            </div>
          </div>
          <div className="sk-signatory-stats">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="sk-card sk-col">
                <Sk width="55%" height={10} />
                <Sk width="38%" height={26} />
                <Sk width="72%" height={10} />
              </div>
            ))}
          </div>
        </div>

        <div className="sk-card sk-col">
          <Sk width="210px" height={16} />
          <Sk width="170px" height={10} />
          <div className="sk-admin-bars">
            {[86, 68, 52, 44, 32].map((w, idx) => (
              <div key={idx} className="sk-row">
                <Sk width="120px" height={11} />
                <Sk width={`${w}%`} height={16} style={{ flex: 1 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplatesSkeleton() {
  return (
    <div className="sk-templates">
      <div className="sk-card sk-col" style={{ gap: 16 }}>
        <div className="sk-row" style={{ justifyContent: "space-between" }}>
          <Sk width="200px" height={18} />
          <div className="sk-row">
            <Sk width="105px" height={34} />
            <Sk width="115px" height={34} />
          </div>
        </div>
        <div className="sk-row" style={{ flexWrap: "wrap" }}>
          <Sk width="240px" height={38} />
          <Sk width="140px" height={38} />
          <Sk width="140px" height={38} />
          <Sk width="220px" height={38} />
        </div>
      </div>

      <div className="sk-templates-split">
        <div className="sk-card sk-col">
          <Sk width="220px" height={16} />
          {[0, 1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="sk-row" style={{ padding: "10px 0", borderBottom: "1px solid #eef1e8" }}>
              <Sk width={28} height={28} className="sk-circle" />
              <div className="sk-col" style={{ flex: 1, gap: 6 }}>
                <Sk width="45%" height={13} />
                <Sk width="25%" height={10} />
              </div>
              <Sk width="90px" height={24} style={{ borderRadius: 999 }} />
            </div>
          ))}
        </div>
        <div className="sk-card-dark sk-col" style={{ minHeight: 360 }}>
          <Sk dark width="45%" height={10} />
          <Sk dark width="80%" height={20} />
          <Sk dark width="65%" height={12} />
          <Sk dark width="50%" height={34} style={{ marginTop: 12 }} />
          <Sk dark width="100%" height={40} style={{ marginTop: "auto", borderRadius: 10 }} />
        </div>
      </div>
    </div>
  );
}

function RolesSkeleton() {
  return (
    <div className="sk-roles">
      <div className="sk-card sk-col">
        <Sk width="140px" height={16} />
        <Sk width="210px" height={10} />
        {[0, 1, 2, 3, 4, 5].map((role) => (
          <div key={role} className="sk-row" style={{ padding: 10, borderRadius: 10, background: "#f7f8f3" }}>
            <Sk width={26} height={26} className="sk-circle" />
            <div className="sk-col" style={{ flex: 1, gap: 5 }}>
              <Sk width="60%" height={12} />
              <Sk width="42%" height={9} />
            </div>
          </div>
        ))}
      </div>

      <div className="sk-card sk-col" style={{ gap: 16 }}>
        <div className="sk-row" style={{ justifyContent: "space-between" }}>
          <div className="sk-col" style={{ gap: 6, flex: 1 }}>
            <Sk width="160px" height={10} />
            <Sk width="220px" height={24} />
          </div>
          <Sk width="115px" height={36} />
        </div>
        <div className="sk-student-cards">
          {[0, 1, 2, 3].map((box) => (
            <div key={box} className="sk-col" style={{ padding: 12, borderRadius: 10, background: "#f7f8f3" }}>
              <Sk width="55%" height={22} />
              <Sk width="80%" height={10} />
            </div>
          ))}
        </div>
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="sk-table-row">
            <Sk width="75%" height={12} />
            <Sk width="65%" height={12} />
            <Sk width="55%" height={12} />
            <Sk width="64px" height={20} style={{ borderRadius: 999 }} />
            <Sk width="40px" height={12} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentsSkeleton() {
  return (
    <div className="sk-page-pad">
      <div className="sk-row" style={{ justifyContent: "space-between" }}>
        <div className="sk-col" style={{ gap: 6 }}>
          <Sk width="180px" height={24} />
          <Sk width="250px" height={11} />
        </div>
        <div className="sk-row">
          <Sk width="110px" height={36} />
          <Sk width="130px" height={36} />
        </div>
      </div>

      <div className="sk-stat-strip-5">
        <div className="sk-card-dark sk-col">
          <Sk dark width="50%" height={24} />
          <Sk dark width="70%" height={10} />
        </div>
        {[0, 1, 2, 3].map((card) => (
          <div key={card} className="sk-card sk-col">
            <Sk width="45%" height={22} />
            <Sk width="75%" height={10} />
          </div>
        ))}
      </div>

      <div className="sk-card sk-col">
        <div className="sk-row" style={{ flexWrap: "wrap", marginBottom: 8 }}>
          <Sk width="220px" height={36} />
          <Sk width="130px" height={36} />
          <Sk width="120px" height={36} />
          <Sk width="120px" height={36} />
        </div>
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="sk-table-row">
            <Sk width="65%" height={12} />
            <Sk width="80%" height={12} />
            <Sk width="55%" height={12} />
            <Sk width="65px" height={20} style={{ borderRadius: 999 }} />
            <Sk width="75px" height={12} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="sk-page-pad">
      <div className="sk-row" style={{ justifyContent: "space-between" }}>
        <div className="sk-col" style={{ gap: 6 }}>
          <Sk width="160px" height={24} />
          <Sk width="280px" height={11} />
        </div>
        <div className="sk-row">
          <Sk width="135px" height={36} />
          <Sk width="135px" height={36} />
        </div>
      </div>

      <div className="sk-card sk-col">
        <div className="sk-row" style={{ flexWrap: "wrap", marginBottom: 8 }}>
          <Sk width="240px" height={36} />
          <Sk width="140px" height={36} />
          <Sk width="140px" height={36} />
        </div>
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="sk-table-row">
            <Sk width="75%" height={12} />
            <Sk width="70%" height={12} />
            <Sk width="65px" height={20} style={{ borderRadius: 999 }} />
            <Sk width="85%" height={12} />
            <Sk width="60%" height={12} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="sk-page-pad">
      <div className="sk-col" style={{ gap: 6 }}>
        <Sk width="130px" height={24} />
        <Sk width="320px" height={11} />
      </div>
      <div className="sk-settings-grid">
        {[0, 1, 2, 3].map((card) => (
          <div key={card} className="sk-card sk-col" style={{ gap: 14 }}>
            <Sk width="160px" height={16} />
            {[0, 1, 2].map((row) => (
              <div key={row} className="sk-row" style={{ justifyContent: "space-between" }}>
                <div className="sk-col" style={{ flex: 1, gap: 5 }}>
                  <Sk width="55%" height={12} />
                  <Sk width="75%" height={9} />
                </div>
                <Sk width={46} height={24} style={{ borderRadius: 999 }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="sk-page-pad">
      <div className="sk-col" style={{ gap: 6 }}>
        <Sk width="140px" height={24} />
        <Sk width="270px" height={11} />
      </div>
      <div className="sk-profile-grid">
        <div className="sk-card sk-col" style={{ alignItems: "center", padding: 28 }}>
          <Sk width={96} height={96} className="sk-circle" />
          <Sk width="65%" height={16} />
          <Sk width="80%" height={11} />
          <Sk width="95px" height={24} style={{ borderRadius: 999 }} />
        </div>
        <div className="sk-col" style={{ gap: 16 }}>
          <div className="sk-card sk-col" style={{ gap: 14 }}>
            <Sk width="180px" height={16} />
            <div className="sk-settings-grid">
              <Sk height={38} />
              <Sk height={38} />
              <Sk height={38} />
              <Sk height={38} />
            </div>
          </div>
          <div className="sk-card sk-col" style={{ gap: 14 }}>
            <Sk width="160px" height={16} />
            <Sk height={38} />
            <div className="sk-settings-grid">
              <Sk height={38} />
              <Sk height={38} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="sk-card sk-col">
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="sk-checklist-item">
          <Sk width={30} height={30} className="sk-circle" />
          <div className="sk-col" style={{ flex: 1, gap: 6 }}>
            <Sk width="48%" height={13} />
            <Sk width="30%" height={10} />
          </div>
          <Sk width={76} height={22} style={{ borderRadius: 999 }} />
        </div>
      ))}
    </div>
  );
}

function AccountSkeleton({ title, detail }) {
  return (
    <div className="sk-account-wrap">
      <div className="sk-card sk-account-card">
        <Sk width={52} height={52} className="sk-circle" />
        <Sk width="70%" height={16} />
        <Sk width="90%" height={10} />
        {title ? <strong style={{ color: "#29352a", marginTop: 4 }}>{title}</strong> : null}
        {detail ? <p className="sk-account-caption">{detail}</p> : null}
      </div>
    </div>
  );
}

const SKELETON_BY_VARIANT = {
  student: StudentSkeleton,
  signatory: SignatorySkeleton,
  admin: AdminDashboardSkeleton,
  templates: TemplatesSkeleton,
  roles: RolesSkeleton,
  students: StudentsSkeleton,
  table: TableSkeleton,
  settings: SettingsSkeleton,
  profile: ProfileSkeleton,
  list: ListSkeleton,
};

export default function PortalLoading({ variant = "account", title, detail }) {
  const SkeletonView = SKELETON_BY_VARIANT[variant];

  return (
    <div className="portal-skeleton" role="status" aria-live="polite" aria-label={title || "Loading"}>
      {SkeletonView ? (
        <>
          <span className="portal-skeleton-sr">
            {title || "Loading"}
            {detail ? ` — ${detail}` : ""}
          </span>
          <SkeletonView />
        </>
      ) : (
        <AccountSkeleton title={title} detail={detail} />
      )}
    </div>
  );
}
