from flask import Flask
from flask_cors import CORS
from src.routes.routes import app_bp
from src.Save2.route import save_bp
from src.Save2.database import init_db2
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
CORS(app, resources={r"/save2/*": {"origins": "*"}}, supports_credentials=True)
from src.DataBase.databse import init_db

init_db()
init_db2()
app.register_blueprint(app_bp, url_prefix='/api')
app.register_blueprint(save_bp, url_prefix='/save2')

# ------------------------------------------------------------------
# 7. Run
# ------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True)
