import { useState, useEffect } from "react";
import apiClient from "../services/api";

function RequirementsSection() {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("student-clearances/my-clearances/")
    .then((res) => {
      const dataArray = res.data;
      if (Array.isArray(dataArray) && dataArray.length > 0) {
        setRequirements(dataArray[0].items || []);
      } else if (dataArray && dataArray.items) {
        setRequirements(dataArray.items);
      }
      setLoading(false);
    })
    .catch((err) => {
      console.error("Failed to fetch clearance requirements:", err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="alert-card">Loading requirements checklist...</div>;
  }

  const fallbackRequirements = [
    { id: 1, requirement_name: "Library Clearance", status: "cleared" },
    { id: 2, requirement_name: "Cashier Clearance", status: "deficiency" },
    { id: 3, requirement_name: "Adviser Approval", status: "pending" },
    { id: 4, requirement_name: "Program Chair Approval", status: "pending" },
    { id: 5, requirement_name: "Institute Governor Clearance", status: "pending" },
    { id: 6, requirement_name: "Institute Dean Clearance", status: "pending" }
  ];

  const activeList = requirements.length > 0 ? requirements : fallbackRequirements;

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
