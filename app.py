import os
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)

# Configuration de la base de données SQLite
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Modèles de base de données ---

class MTUTest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    material_name = db.Column(db.String(50), nullable=False)
    max_force = db.Column(db.Float, nullable=False)
    max_deformation = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'material_name': self.material_name,
            'max_force': round(self.max_force, 2),
            'max_deformation': round(self.max_deformation, 2),
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        }

class SVTLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    temperature = db.Column(db.Float, nullable=False)
    humidity = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'temperature': round(self.temperature, 2),
            'humidity': round(self.humidity, 2),
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        }

# Création des tables si elles n'existent pas
with app.app_context():
    db.create_all()

# --- Routes Web ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/physique')
def physique():
    return render_template('physique.html')

@app.route('/chimie')
def chimie():
    return render_template('chimie.html')

@app.route('/svt')
def svt():
    return render_template('svt.html')

@app.route('/sismologie')
def sismologie():
    return render_template('sismologie.html')

# --- Routes API ---

@app.route('/api/mtu', methods=['GET', 'POST'])
def api_mtu():
    if request.method == 'POST':
        data = request.get_json()
        new_test = MTUTest(
            material_name=data.get('material_name', 'Échantillon Standard'),
            max_force=data.get('max_force', 0.0),
            max_deformation=data.get('max_deformation', 0.0)
        )
        db.session.add(new_test)
        db.session.commit()
        return jsonify({'status': 'success', 'data': new_test.to_dict()}), 201
    
    # GET method
    tests = MTUTest.query.order_by(MTUTest.timestamp.desc()).limit(10).all()
    return jsonify([test.to_dict() for test in tests])

@app.route('/api/svt', methods=['GET', 'POST'])
def api_svt():
    if request.method == 'POST':
        data = request.get_json()
        new_log = SVTLog(
            temperature=data.get('temperature', 0.0),
            humidity=data.get('humidity', 0.0)
        )
        db.session.add(new_log)
        db.session.commit()
        return jsonify({'status': 'success', 'data': new_log.to_dict()}), 201
    
    # GET method
    logs = SVTLog.query.order_by(SVTLog.timestamp.desc()).limit(20).all()
    return jsonify([log.to_dict() for log in logs])

if __name__ == '__main__':
    app.run(debug=True, port=5000)
