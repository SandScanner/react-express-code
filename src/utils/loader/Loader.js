import React from "react";
import "./loader.css";

const Loader = () => {
  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ width: "100%", height: "100%" }}
    >
      <div class="lds-hourglass"></div>
    </div>
  );
};

export default Loader;
