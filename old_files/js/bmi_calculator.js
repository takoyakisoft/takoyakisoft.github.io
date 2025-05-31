// --- リファクタリングされた関数 ---
function calculateBmiValue(weight, heightCm) {
    if (isNaN(weight) || isNaN(heightCm) || weight <= 0 || heightCm <= 0) {
        return null; // Invalid input
    }
    const heightM = heightCm / 100;
    const bmi = weight / (heightM * heightM);
    return Math.round(bmi * 100) / 100; // 小数点以下2桁に丸める
}

function getBmiCategory(bmi) {
    if (bmi === null) return ''; // Should not happen if calculateBmiValue handles it
    if (bmi < 18.5) return '低体重';
    if (bmi < 25) return '普通体重';
    if (bmi < 30) return '過体重';
    return '肥満';
}
// --- ここまでリファクタリングされた関数 ---

document.addEventListener('DOMContentLoaded', function () {
    const bmiForm = document.getElementById('bmiForm');
    const resultArea = document.getElementById('resultArea');
    const errorArea = document.getElementById('errorArea');

    bmiForm.addEventListener('submit', function (event) {
        event.preventDefault();

        resultArea.innerHTML = '';
        errorArea.innerHTML = '';

        const weight = parseFloat(document.getElementById('weight').value);
        const heightCm = parseFloat(document.getElementById('height').value);

        if (isNaN(weight) || isNaN(heightCm)) {
            errorArea.textContent = '体重と身長には数値を入力してください。';
            return;
        }
        if (weight <= 0 || heightCm <= 0) {
            errorArea.textContent = '体重と身長には正の値を入力してください。';
            return;
        }

        const bmiRounded = calculateBmiValue(weight, heightCm);
        // calculateBmiValue now directly returns null for bad inputs handled by the form validation.
        // The form validation itself already checks for NaN, <=0, so direct call to calculateBmiValue here should always get valid numbers.

        const category = getBmiCategory(bmiRounded);

        resultArea.innerHTML = `
            <h2>あなたのBMI: ${bmiRounded}</h2>
            <p>カテゴリー: ${category}</p>
        `;
    });
});

// --- Basic Tests (for developer console) ---
/*
function runBmiTests() {
    console.log("Running BMI Calculator Tests...");
    let testsPassed = 0;
    let testsFailed = 0;

    function assertEquals(expected, actual, message) {
        if (expected === actual) {
            testsPassed++;
            console.log(`PASS: ${message}`);
        } else {
            testsFailed++;
            console.error(`FAIL: ${message} (Expected: ${expected}, Actual: ${actual})`);
        }
    }

    // Test calculateBmiValue
    assertEquals(24.22, calculateBmiValue(70, 170), "Test Normal BMI Calculation");
    assertEquals(17.3, calculateBmiValue(50, 170), "Test Underweight BMI Calculation"); // Corrected expected value
    assertEquals(null, calculateBmiValue(70, 0), "Test BMI with Zero Height");
    assertEquals(null, calculateBmiValue(0, 170), "Test BMI with Zero Weight");
    assertEquals(null, calculateBmiValue(-70, 170), "Test BMI with Negative Weight");


    // Test getBmiCategory
    assertEquals("普通体重", getBmiCategory(22), "Test Category Normal");
    assertEquals("低体重", getBmiCategory(18.0), "Test Category Underweight");
    assertEquals("過体重", getBmiCategory(27.5), "Test Category Overweight");
    assertEquals("肥満", getBmiCategory(30.0), "Test Category Obesity");
    assertEquals("肥満", getBmiCategory(35), "Test Category Obesity High");


    console.log("----------------------------------");
    console.log(`Tests Finished. Passed: ${testsPassed}, Failed: ${testsFailed}`);
}

// To run tests:
// 1. Open browser developer console on bmi_calculator.html
// 2. Make sure calculateBmiValue and getBmiCategory are accessible in the console.
//    These functions are defined globally in this script, so they should be.
// 3. Copy and paste the runBmiTests() function definition into the console, then call runBmiTests().
//    Or, uncomment the line below to run tests automatically when the script loads (for development).

// runBmiTests();
*/
