import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "antd/dist/reset.css";
import { App as AntApp } from "antd";
import App from "./App";
import { ThemeProvider } from './context/ThemeContext.jsx';


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AntApp>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AntApp>
  </StrictMode>
);
