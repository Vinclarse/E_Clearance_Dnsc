export const termInfo = {
  title: "Semestral Clearance",
  academicYear: "AY 2026-2027",
  semester: "1st Semester",
  status: "open",
  targetYearLevels: "1st to 4th Year",
  issuedOn: "Oct 12, 2026",
  studentsIssued: 1240,
  signatoryOffices: 6,
};

export const statusDistribution = [
  { label: "Completed", count: 540, color: "#5a7a3a", percent: 43.5 },
  { label: "Pending", count: 410, color: "#c4913a", percent: 33.1 },
  { label: "Under Review", count: 120, color: "#c47a3a", percent: 9.7 },
  { label: "Deficiency", count: 170, color: "#c43a3a", percent: 13.7 },
];

export const statCards = [
  {
    id: "total",
    label: "TOTAL ISSUED",
    value: "1,240",
    sub: "Across all 6 offices",
    border: "dark-green",
  },
  {
    id: "completion",
    label: "COMPLETION RATE",
    value: "44%",
    sub: "540 fully cleared",
    border: "light-green",
  },
  {
    id: "deficiency",
    label: "OPEN DEFICIENCIES",
    value: "170",
    sub: "Unpaid or unreturned items",
    border: "red",
  },
  {
    id: "review",
    label: "AWAITING REVIEW",
    value: "120",
    sub: "Proofs to verify",
    border: "blue",
  },
];

export const bottleneckData = [
  { office: "Library", pending: 38, deficiency: 26, total: 64 },
  { office: "Cashier", pending: 90, deficiency: 72, total: 162 },
  { office: "Adviser", pending: 70, deficiency: 48, total: 118 },
  { office: "Program Chair", pending: 60, deficiency: 42, total: 102 },
  { office: "Governor", pending: 50, deficiency: 30, total: 80 },
  { office: "Dean", pending: 100, deficiency: 74, total: 174, highest: true },
];

export const approvalChain = [
  { step: 1, label: "Library" },
  { step: 2, label: "Cashier" },
  { step: 3, label: "Adviser" },
  { step: 4, label: "Chair" },
  { step: 5, label: "Governor" },
  { step: 6, label: "Dean" },
];

export const templateSteps = [
  {
    id: 1,
    title: "Library Clearance",
    description: "Unreturned books and library fees",
    role: "Librarians",
    note: "Starts first",
    locked: false,
  },
  {
    id: 2,
    title: "Cashier Clearance",
    description: "Tuition balances and other fees",
    role: "Cashiers",
    note: "After Step 1",
    locked: true,
  },
  {
    id: 3,
    title: "Adviser Approval",
    description: "Academic standing and advising",
    role: "Advisers",
    note: "After Step 2",
    locked: true,
  },
  {
    id: 4,
    title: "Program Chair Approval",
    description: "Department-level sign-off",
    role: "Program Chairs",
    note: "After Step 3",
    locked: true,
  },
  {
    id: 5,
    title: "Institute Governor Clearance",
    description: "Student council obligations",
    role: "Governors",
    note: "After Step 4",
    locked: true,
  },
  {
    id: 6,
    title: "Institute Dean Clearance",
    description: "Final institute-level sign-off",
    role: "Deans",
    note: "After Step 5",
    locked: true,
  },
];

export const yearBreakdown = [
  { label: "1st Year", count: 240, color: "#8aab5a" },
  { label: "2nd Year", count: 210, color: "#6b8c3a" },
  { label: "3rd Year", count: 320, color: "#4a7c3f" },
  { label: "4th Year", count: 270, color: "#3a6a2e" },
];
