import { useState, useEffect } from "react";
import apiClient from "../services/api";
import PortalLoading from "./PortalLoading.jsx";

function RequirementsSection() {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("student-clearances/my-clearances/")
    .then((res) => {
      const payload = res.data && typeof res.data === "object" && "data" in res.data ? res.data.data : res.data;
      const records = Array.isArray(payload) ? payload : payload?.data || (payload ? [payload] : []);
      const first = records[0];
      setRequirements(Array.isArray(first?.items) ? first.items : []);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Failed to fetch clearance requirements:", err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <PortalLoading title="Loading your requirements" detail="Getting the steps on your clearance." />;
  }

  if (requirements.length === 0) {
    return <div className="alert-card">No clearance requirements are on this account yet.</div>;
  }

  const activeList = requirements;

  return (
    <div className="requirements-list-container">
      {activeList.map((item) => (
        <div className="requirement-row-item" key={item.id}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ 
              color: item.status === "cleared" ? "var(--primary-green)" : item.status === "deficiency" ? "#d84c4c" : "#a1a396",
              fontWeight: "700"
            }}>
              {item.status === "cleared" ? "✓" : "•"}
            </span>
            <span>{item.requirement_name}</span>
          </div>
          <span className="row-arrow" style={{ 
            fontSize: "0.75rem", 
            color: item.status === "cleared" ? "var(--primary-green)" : item.status === "deficiency" ? "#d84c4c" : "#7a7a7a",
            backgroundColor: item.status === "cleared" ? "#f0f2eb" : item.status === "deficiency" ? "#fce8e6" : "#f7f8f3",
            padding: "4px 12px",
            borderRadius: "999px"
          }}>
            {item.status.toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  );
}

export default RequirementsSection;
