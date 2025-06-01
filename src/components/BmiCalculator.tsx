import type React from "react";
import { useState } from "react";
import commonStyles from "./common.module.css";

// BMI計算ロジックをTypeScriptに移植
const calculateBmiValue = (weight: number, heightCm: number): number | null => {
	if (isNaN(weight) || isNaN(heightCm) || weight <= 0 || heightCm <= 0) {
		return null; // Invalid input
	}
	const heightM = heightCm / 100;
	const bmi = weight / (heightM * heightM);
	return Math.round(bmi * 100) / 100; // 小数点以下2桁に丸める
};

const getBmiCategory = (bmi: number | null): string => {
	if (bmi === null) return "";
	if (bmi < 18.5) return "低体重";
	if (bmi < 25) return "普通体重";
	if (bmi < 30) return "過体重";
	return "肥満";
};

const BmiCalculator: React.FC = () => {
	const [weight, setWeight] = useState<string>("");
	const [height, setHeight] = useState<string>("");
	const [bmiResult, setBmiResult] = useState<number | null>(null);
	const [bmiCategory, setBmiCategory] = useState<string>("");
	const [error, setError] = useState<string>("");

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");
		setBmiResult(null);
		setBmiCategory("");

		const weightNum = Number.parseFloat(weight);
		const heightNum = Number.parseFloat(height);

		if (isNaN(weightNum) || isNaN(heightNum)) {
			setError("体重と身長には数値を入力してください。");
			return;
		}
		if (weightNum <= 0 || heightNum <= 0) {
			setError("体重と身長には正の値を入力してください。");
			return;
		}

		const bmi = calculateBmiValue(weightNum, heightNum);
		if (bmi !== null) {
			setBmiResult(bmi);
			setBmiCategory(getBmiCategory(bmi));
		} else {
			// このケースは上記バリデーションでカバーされるはずだが念のため
			setError("BMIの計算に失敗しました。入力値を確認してください。");
		}
	};

	return (
		<div className={commonStyles.toolContainer}>
			<h2>BMI計算機</h2>
			<form onSubmit={handleSubmit}>
				<div className={commonStyles.formGroup}>
					<label htmlFor="weight">体重 (kg):</label>
					<input
						type="text"
						id="weight"
						value={weight}
						onChange={(e) => setWeight(e.target.value)}
						placeholder="例: 65"
						className={commonStyles.formInput}
					/>
				</div>
				<div className={commonStyles.formGroup}>
					<label htmlFor="height">身長 (cm):</label>
					<input
						type="text"
						id="height"
						value={height}
						onChange={(e) => setHeight(e.target.value)}
						placeholder="例: 170"
						className={commonStyles.formInput}
					/>
				</div>
				<button type="submit" className={commonStyles.submitButton}>
					計算する
				</button>
			</form>

			{error && <div className={commonStyles.errorArea}>{error}</div>}

			{bmiResult !== null && (
				<div className={commonStyles.resultArea}>
					<h3>あなたのBMI: {bmiResult}</h3>
					<p>カテゴリー: {bmiCategory}</p>
				</div>
			)}
		</div>
	);
};

export default BmiCalculator;
