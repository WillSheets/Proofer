import React from "react";
import ReactDOM from "react-dom/client";
import { initProofer } from "../lib/utils/proofer";
import "../index.scss";
import { App } from "./App";

initProofer();

ReactDOM.createRoot(document.getElementById("app") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
