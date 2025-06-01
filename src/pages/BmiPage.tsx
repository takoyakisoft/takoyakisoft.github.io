import type React from "react";
import { Link } from "react-router-dom";
import BmiCalculator from "../components/BmiCalculator";
import styles from "./ToolPage.module.css";

const BmiPage: React.FC = () => {
	return (
		<div className={styles.toolPageContainer}>
			<BmiCalculator />
			<div className={styles.backLinkContainer}>
				<Link to="/" className={styles.backLink}>
					ホームページに戻る
				</Link>
			</div>
		</div>
	);
};

export default BmiPage;
