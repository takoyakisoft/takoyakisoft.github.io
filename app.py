from flask import Flask, render_template

# Import blueprints from the tools directory
from tools.bmi_calculator import bmi_calculator_bp

app = Flask(__name__)

# Register Blueprints for each tool
# To add a new tool:
# 1. Create your tool's blueprint in a .py file in the 'tools' directory (e.g., tools/my_tool.py)
# 2. Import the blueprint here (e.g., from tools.my_tool import my_tool_bp)
# 3. Register the blueprint with the app (e.g., app.register_blueprint(my_tool_bp))
# 4. Add the tool to the 'available_tools' list below.
app.register_blueprint(bmi_calculator_bp)


@app.route('/')
def index():
    # List of available tools to be displayed on the homepage.
    # 'name': The display name of the tool.
    # 'url': The endpoint for Flask's url_for() function (e.g., 'blueprint_name.route_function_name').
    available_tools = [
        {'name': 'BMI Calculator', 'url': 'bmi_calculator.bmi_page'}
        # Add new tools here, e.g.:
        # {'name': 'My New Tool', 'url': 'my_tool.my_tool_page'}
    ]
    return render_template('index.html', tools=available_tools)

if __name__ == '__main__':
    app.run(debug=True)
