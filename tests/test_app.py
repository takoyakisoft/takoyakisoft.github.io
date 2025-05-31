import unittest
import sys
import os

# Add the parent directory to the Python path to allow module imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

class AppTestCase(unittest.TestCase):

    def setUp(self):
        # Create a test client using the Flask application configured for testing
        self.app = app.test_client()
        # Propagate the exceptions to the test client
        self.app.testing = True

    def test_home_page_loads(self):
        # Request the home page
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        # Check if critical content is present
        self.assertIn(b"Welcome to Web Tools", response.data)
        self.assertIn(b"BMI Calculator", response.data) # Checks if the tool name is listed

    def test_bmi_calculator_link_on_home_page(self):
        response = self.app.get('/')
        # Ensure the link to the BMI calculator is correctly rendered
        # url_for('bmi_calculator.bmi_page') generates '/bmi-calculator/'
        self.assertIn(b'<a href="/bmi-calculator/">BMI Calculator</a>', response.data)


if __name__ == '__main__':
    unittest.main()
