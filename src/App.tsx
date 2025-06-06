import { Link, NavLink, Route, Routes } from "react-router-dom";
import styles from "./App.module.css";
import BmiPage from "./pages/BmiPage";
import GanttPage from "./pages/GanttPage";
import HomePage from "./pages/HomePage";
import TemperaturePage from "./pages/TemperaturePage";
import TicTacToePage from "./pages/TicTacToePage";

function App() {
	return (
		<>
			{" "}
			{/* Using Fragment to avoid unnecessary div if #root handles layout */}
			<header className={styles.appHeader}>
				<nav className={styles.appNav}>
					<div className={styles.navLogo}>
						<Link to="/">ウェブツール集</Link>
					</div>
					<div className={styles.navLinks}>
						<NavLink
							to="/bmi-calculator"
							className={({ isActive }) => (isActive ? styles.active : "")}
						>
							BMI計算機
						</NavLink>
						<NavLink
							to="/temperature-converter"
							className={({ isActive }) => (isActive ? styles.active : "")}
						>
							温度変換ツール
						</NavLink>
						<NavLink
							to="/gantt"
							className={({ isActive }) => (isActive ? styles.active : "")}
						>
							ガントチャート
						</NavLink>
						<NavLink
							to="/tic-tac-toe"
							className={({ isActive }) => (isActive ? styles.active : "")}
						>
							〇×ゲーム
						</NavLink>
					</div>
				</nav>
			</header>
			<main className={styles.appMain}>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/bmi-calculator" element={<BmiPage />} />
					<Route path="/temperature-converter" element={<TemperaturePage />} />
					<Route path="/gantt" element={<GanttPage />} />
					<Route path="/tic-tac-toe" element={<TicTacToePage />} />
				</Routes>
			</main>
			<footer className={styles.appFooter}>
				<p>&copy; {new Date().getFullYear()} ウェブツール集</p>
			</footer>
		</>
	);
}

export default App;
