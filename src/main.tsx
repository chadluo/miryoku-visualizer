import { createRoot } from "react-dom/client";
import App from "./App";
import "./w3c/styles/core.css";
import "./w3c/styles/advanced.css";
import "./styles.css";

// The design system expects these classes on <html>: `js` enables its advanced styles, and
// `fonts-loaded` switches from the fallback font to Noto Sans once it has loaded.
const root = document.documentElement;
root.classList.add("js");
document.fonts?.load("1em 'Noto Sans'").then(() => root.classList.add("fonts-loaded"));

createRoot(document.getElementById("root")!).render(<App />);
