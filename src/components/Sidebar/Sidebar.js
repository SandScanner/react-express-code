import React, { useEffect, useState } from "react";
import "../../App.css";
import { SidebarData } from "./SidebarData";
import { Link } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useNavigate } from "react-router-dom";
import { LogoutDialog } from "../Modal/Dialog";

const Sidebar = () => {
  let auth = JSON.parse(localStorage.getItem("user"));
  const [show, setShow] = useState(false);
  let navigate = useNavigate();

  useEffect(() => {
    if (!auth) {
      navigate("/login");
    }
  });

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <>
      <LogoutDialog
        show={show}
        handleClose={() => setShow(false)}
        logout={logout}
      />
      <div className="sidebar">
        <ul className="sidebar-list">
          <Link className="row" key="account">
            <div className="icon">
              <AccountCircleIcon />
            </div>
            <div className="link-style">{auth.username}</div>
          </Link>
          {SidebarData.map((x, i) => (
            <Link
              to={x.link}
              className="row"
              key={i}
              id={window.location.pathname === x.link ? "active" : ""}
            >
              <div className="icon">{x.icon}</div>
              <div className="link-style">{x.title}</div>
              {/* <Link className="link-style" to={x.link}> */}

              {/* </Link> */}
            </Link>
          ))}
          <Link className="row" key="logout" onClick={() => setShow(true)}>
            <div className="icon">
              <LogoutIcon />
            </div>
            <div className="link-style">Logout</div>
          </Link>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
