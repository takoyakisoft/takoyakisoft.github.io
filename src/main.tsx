import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App"; // App.tsx は後で作成
import "./index.css"; // あとでグローバルCSSをここに置くか検討

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Failed to find the root element");
}

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</React.StrictMode>,
);
