from flask import Flask, request, jsonify, send_from_directory
import os
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import AgglomerativeClustering
import fitz  # PyMuPDF
from flask_cors import CORS
from concurrent.futures import ThreadPoolExecutor

app = Flask(__name__, static_folder='static')
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

nlp = spacy.load("en_core_web_sm")

def extract_text_from_pdf(file_path):
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def detect_mentions(text):
    doc = nlp(text)
    mentions = [ent.text for ent in doc.ents]
    return mentions

def link_mentions(mentions):
    vectorizer = TfidfVectorizer().fit_transform(mentions)
    vectors = vectorizer.toarray()
    clustering = AgglomerativeClustering(n_clusters=None, distance_threshold=1.5).fit(vectors)
    clusters = {}
    for idx, label in enumerate(clustering.labels_):
        if label not in clusters:
            clusters[label] = []
        clusters[label].append(mentions[idx])
    clusters = {str(key): value for key, value in clusters.items()}
    return clusters

def process_file(file):
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)
    text = extract_text_from_pdf(file_path)
    mentions = detect_mentions(text)
    return mentions

@app.route('/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return jsonify({'error': 'No files part in the request'}), 400

    files = request.files.getlist('files')
    file_paths = []
    all_mentions = []

    with ThreadPoolExecutor() as executor:
        results = executor.map(process_file, files)
        for mentions in results:
            all_mentions.extend(mentions)

    clusters = link_mentions(all_mentions)

    print(f'File paths: {file_paths}')
    print(f'Clusters: {clusters}')

    return jsonify({'file_paths': [file.filename for file in files], 'clusters': clusters})

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))