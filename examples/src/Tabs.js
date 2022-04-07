import React, { useState } from "react";

const Tabs = ({ tabs, defaultTab }) => {
  const [page, setPage] = useState(defaultTab);

  return (
    <div className="my-md-4 bd-layout">
      <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top">
        <div className="container-fluid">
          <span className="navbar-brand">react-forms playground</span>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {tabs.map(({ id, label }) => (
                <li className="nav-item">
                  <span className="nav-link" onClick={() => setPage(id)}>
                    {label}
                  </span>
                </li>
              ))}
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="https://github.com/MAIF/react-forms#readme"
                >
                  Documentation
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="https://github.com/MAIF/react-forms"
                >
                  Project
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <div className="container" style={{ marginTop: "70px" }}>
        {tabs.find(({ id }) => id === page)?.content}
      </div>
    </div>
  );
};
export default Tabs;
