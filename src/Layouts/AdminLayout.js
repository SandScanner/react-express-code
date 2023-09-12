import React from "react";
import Sidebar from "../components/Sidebar/Sidebar";

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-layout">
      <Sidebar />
      {children}
    </div>
  );
};

export default AdminLayout;
