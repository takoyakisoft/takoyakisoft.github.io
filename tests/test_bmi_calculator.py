import unittest
import sys
import os

# Add the parent directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app # Import the main app object to access the test client

class BMICalculatorTestCase(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_bmi_calculator_page_loads(self):
        response = self.app.get('/bmi-calculator/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"BMI Calculator", response.data)

    def test_bmi_calculation_valid_input(self):
        response = self.app.post('/bmi-calculator/', data=dict(
            weight='70',  # kg
            height='170' # cm
        ), follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Your BMI: 24.22", response.data) # 70 / (1.7^2) = 24.22145...
        self.assertIn(b"Category: Normal weight", response.data)

    def test_bmi_calculation_underweight(self):
        response = self.app.post('/bmi-calculator/', data=dict(weight='50', height='170'), follow_redirects=True)
        self.assertIn(b"Your BMI: 17.3", response.data) # 50 / (1.7^2) = 17.301...
        self.assertIn(b"Category: Underweight", response.data)

    def test_bmi_calculation_overweight(self):
        response = self.app.post('/bmi-calculator/', data=dict(weight='85', height='170'), follow_redirects=True)
        self.assertIn(b"Your BMI: 29.41", response.data) # 85 / (1.7^2) = 29.411...
        self.assertIn(b"Category: Overweight", response.data)

    def test_bmi_calculation_obesity(self):
        response = self.app.post('/bmi-calculator/', data=dict(weight='100', height='170'), follow_redirects=True)
        self.assertIn(b"Your BMI: 34.6", response.data) # 100 / (1.7^2) = 34.602...
        self.assertIn(b"Category: Obesity", response.data)

    def test_bmi_calculation_invalid_height_zero(self):
        response = self.app.post('/bmi-calculator/', data=dict(
            weight='70',
            height='0'
        ), follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Height must be positive.", response.data)
        self.assertNotIn(b"Your BMI:", response.data)

    def test_bmi_calculation_invalid_weight_zero(self):
        response = self.app.post('/bmi-calculator/', data=dict(
            weight='0',
            height='170'
        ), follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Weight must be positive.", response.data)
        self.assertNotIn(b"Your BMI:", response.data)

    def test_bmi_calculation_invalid_input_non_numeric_height(self):
        response = self.app.post('/bmi-calculator/', data=dict(
            weight='70',
            height='abc'
        ), follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Invalid input. Please enter numbers for weight and height.", response.data)
        self.assertNotIn(b"Your BMI:", response.data)

    def test_bmi_calculation_invalid_input_non_numeric_weight(self):
        response = self.app.post('/bmi-calculator/', data=dict(
            weight='abc',
            height='170'
        ), follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Invalid input. Please enter numbers for weight and height.", response.data)
        self.assertNotIn(b"Your BMI:", response.data)

if __name__ == '__main__':
    unittest.main()
