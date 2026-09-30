import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// Follow the system colour scheme; shadcn themes dark mode with a `.dark` class on <html>.
const scheme = matchMedia("(prefers-color-scheme: dark)");
const syncScheme = () => document.documentElement.classList.toggle("dark", scheme.matches);
syncScheme();
scheme.addEventListener("change", syncScheme);

createRoot(document.getElementById("root")!).render(<App />);
