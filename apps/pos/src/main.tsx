import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./visual-pass.css";
import "./visual-pass-02.css";
import "./visual-pass-03.css";
import "./visual-pass-04.css";
import "./visual-pass-05.css";
import "./visual-pass-06.css";
import "./visual-pass-07.css";
import "./visual-pass-08.css";
import "./visual-pass-09.css";
import "./visual-pass-10.css";
import "./visual-pass-11.css";
import "./visual-pass-12.css";
import "./customer-credit.css";
import "./customer-credit-partial.css";
import "./customer-system.css";
import "./customer-loyalty.css";
import "./visual-pass-13.css";
import "./visual-pass-14.css";

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => void navigator.serviceWorker.register("/sw.js"));
}
