from flask import Flask
from flask_cors import CORS
from src.routes.routes import app_bp
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

from src.DataBase.databse import init_db

init_db()

app.register_blueprint(app_bp, url_prefix='/api')


# ------------------------------------------------------------------
# 7. Run
# ------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True)