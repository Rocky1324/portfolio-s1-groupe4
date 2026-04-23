# Portfolio Scientifique - S1 Groupe 4 🚀

Bienvenue sur le dépôt du recueil des projets scientifiques du Groupe 4 de la classe S1. Ce projet est une application web interactive développée avec **Flask** (Python) pour le backend et **Three.js** / **Chart.js** pour les visualisations interactives en 3D et le rendu de graphiques en temps réel.

## ✨ Fonctionnalités

Le site présente 4 concepts scientifiques majeurs avec un fort accent sur l'interactivité :

1. 🧪 **Physique (Machine de Traction Universelle)** :
   - Simulation 3D interactive (Three.js) de l'étirement d'un échantillon matériel.
   - Graphique en direct (Chart.js) montrant la courbe Contrainte/Déformation.
   - Design Sonore : Bruit de moteur pas-à-pas et craquement à la rupture.
   - Historique des tests sauvegardé via API.

2. 🧬 **Chimie (Béton auto-réparant)** :
   - Modèle 3D d'un bloc de béton qui subit une fissure.
   - Animation de cicatrisation grâce aux bactéries intégrées.

3. 🌿 **SVT (Bio-techno Serre)** :
   - Modélisation 3D d'une serre intelligente.
   - Contrôle du ventilateur et de la pluie artificielle avec effets sonores filtrés (Web Audio API).
   - Enregistrement périodique (SQLite) des relevés de température et d'humidité.

4. 🌍 **Sismologie (Guide de prévention)** :
   - Animation interactive simulant un tremblement de terre.
   - Un guide virtuel illustrant la procédure : "Se baisser, s'abriter, s'agripper".
   - Grondement sismique généré synthétiquement.

## 🛠️ Technologies Utilisées

- **Backend** : Python 3, Flask, Flask-SQLAlchemy, SQLite.
- **Frontend** : HTML5, CSS3 (Custom Properties, Flexbox/Grid, Animations), JavaScript (ES6).
- **Librairies 3D / Graphiques** : Three.js, Chart.js.
- **Design Sonore** : Web Audio API (100% généré par le code, sans fichiers MP3).

## 🚀 Installation & Lancement

Suivez ces étapes pour lancer l'application sur votre machine locale :

### 1. Prérequis
- Python 3.8 ou supérieur installé sur votre système.
- `pip` (le gestionnaire de paquets Python).

### 2. Cloner le dépôt
```bash
git clone https://github.com/votre-nom-utilisateur/portfolio-s1-groupe4.git
cd portfolio-s1-groupe4
```

### 3. Créer un environnement virtuel (Recommandé)
```bash
python -m venv venv
# Sur Windows :
venv\Scripts\activate
# Sur Mac/Linux :
source venv/bin/activate
```

### 4. Installer les dépendances
```bash
pip install -r requirements.txt
```

### 5. Lancer l'application
```bash
python app.py
```

L'application démarrera et générera automatiquement la base de données SQLite (`database.db`).  
Ouvrez votre navigateur web et accédez à l'adresse suivante : **http://127.0.0.1:5000**

## 👥 Auteurs
- **Groupe 4 de la classe S1**
## 📄 Licence

Ce projet est sous licence MIT. N'hésitez pas à l'utiliser et à le modifier !
