import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./main.css";

import App from "./main";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);