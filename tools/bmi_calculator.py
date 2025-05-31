from flask import Blueprint, render_template, request

# Removed template_folder='templates' to use the app's global templates directory
bmi_calculator_bp = Blueprint('bmi_calculator', __name__, url_prefix='/bmi-calculator')

def calculate_bmi(weight_kg, height_cm):
    if height_cm <= 0:
        return None, "Height must be positive."
    if weight_kg <=0: # Added check for weight
        return None, "Weight must be positive."
    height_m = height_cm / 100
    bmi = weight_kg / (height_m ** 2)
    return round(bmi, 2), get_bmi_category(bmi)

def get_bmi_category(bmi):
    if bmi < 18.5:
        return "Underweight"
    elif 18.5 <= bmi < 24.9:
        return "Normal weight"
    elif 25 <= bmi < 29.9:
        return "Overweight"
    else:
        return "Obesity"

@bmi_calculator_bp.route('/', methods=['GET', 'POST'])
def bmi_page():
    bmi_result = None
    bmi_category = None
    error_message = None
    # Retain form values for better UX
    weight_value = request.form.get('weight', '')
    height_value = request.form.get('height', '')

    if request.method == 'POST':
        try:
            weight = float(request.form.get('weight'))
            height = float(request.form.get('height'))

            # bmi_result and bmi_category_or_error will be assigned the tuple from calculate_bmi
            bmi_result, bmi_category_or_error = calculate_bmi(weight, height)

            if bmi_result is None: # This means an error occurred in calculate_bmi
                error_message = bmi_category_or_error # The second value is the error message
            else:
                bmi_category = bmi_category_or_error # The second value is the category

        except ValueError:
            error_message = "Invalid input. Please enter numbers for weight and height."
        except Exception as e:
            # It's good practice to log the exception e here
            error_message = f"An unexpected error occurred." # Avoid exposing raw error messages

    return render_template('bmi_calculator.html',
                           bmi_result=bmi_result,
                           bmi_category=bmi_category,
                           error_message=error_message,
                           weight_value=weight_value,
                           height_value=height_value)
