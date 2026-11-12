function Header() {
  return (
    <div className="container mt-5">
      <div className="row align-items-center">

        <div className="col-lg-8">
          <h1 className="dashboard-title">
            Welcome Student
          </h1>

          <p className="dashboard-subtitle">
            Manage your clearance status and requirements.
          </p>
        </div>

        <div className="col-lg-4 text-lg-end">
          <div className="academic-info">
            <p>Academic Year: 2026-2027</p>
            <p>1st Semester</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Header;