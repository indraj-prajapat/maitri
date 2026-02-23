from flask import Flask
from flask_cors import CORS
from src.routes.routes import app_bp
from src.Save2.route import save_bp
from src.Save2.database import init_db2
from dotenv import load_dotenv
import os
load_dotenv()
app = Flask(__name__)
cors_origins = os.getenv("CORS_ORIGINS", "*")
CORS(app, resources={r"/api/*": {"origins": cors_origins}}, supports_credentials=True)
CORS(app, resources={r"/save2/*": {"origins": cors_origins}}, supports_credentials=True)
from src.DataBase.databse import init_db

init_db()
init_db2()
app.register_blueprint(app_bp, url_prefix='/api')
app.register_blueprint(save_bp, url_prefix='/save2')

# ------------------------------------------------------------------
# 7. Run
# ------------------------------------------------------------------
if __name__ == "__main__":
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    app.run(host=host, port=port, debug=debug)
