from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import traceback
import base64
import io
from PIL import Image
from dotenv import load_dotenv
from services.art_matcher import ArtMatcher
from services.gemini_service import GeminiService

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Proper CORS setup - allow specific origin
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://127.0.0.1:5500"],  # Live Server
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Accept"],
        "supports_credentials": False
    }
})

# No need for UPLOAD_FOLDER since we're not saving to disk
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

art_matcher = ArtMatcher()
gemini_service = GeminiService()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = ['classical', 'aesthetic', 'impressive']
    return jsonify(categories)

@app.route('/api/colors', methods=['GET'])
def get_colors():
    colors = [
        {'name': 'Red', 'hex': '#FF0000'},
        {'name': 'Blue', 'hex': '#0000FF'},
        {'name': 'Green', 'hex': '#00FF00'},
        {'name': 'Yellow', 'hex': '#FFFF00'},
        {'name': 'Orange', 'hex': '#FFA500'},
        {'name': 'Purple', 'hex': '#800080'},
        {'name': 'Pink', 'hex': '#FFC0CB'},
        {'name': 'Brown', 'hex': '#8B4513'},
        {'name': 'Black', 'hex': '#000000'},
        {'name': 'White', 'hex': '#FFFFFF'}
    ]
    return jsonify(colors)

@app.route('/api/match', methods=['POST', 'OPTIONS'])
def match_artworks():
    
    # Handle preflight request
    if request.method == 'OPTIONS':
        return '', 204
    try:
        import time
        start_time = time.time()

        print("\n=== API REQUEST RECEIVED ===")
        print(f"Method: {request.method}")
        print(f"Content-Type: {request.content_type}")

        # Handle JSON request with base64 image
        if request.is_json:
            data = request.get_json()
            print(f"JSON Data keys: {list(data.keys())}")

            if 'wall_image' not in data:
                print("ERROR: No wall_image in JSON data")
                return jsonify({'success': False, 'error': 'No wall image provided'}), 400

            # Decode base64 image
            base64_image = data['wall_image']

            # Remove data URI prefix if present
            if base64_image.startswith('data:image'):
                base64_image = base64_image.split(',')[1]

            # Decode base64 to bytes (kept in memory)
            image_data = base64.b64decode(base64_image)
            print(f"Image decoded, size: {len(image_data)} bytes")

            # Get user preferences from JSON
            category = data.get('category')
            budget = float(data.get('budget', 0))
            color = data.get('color')

            elapsed = time.time() - start_time
            print(f"⏱️ Total time so far: {elapsed:.3f} seconds")

        # Handle multipart/form-data (old method, updated to use memory)
        else:
            print(f"Files: {list(request.files.keys())}")
            print(f"Form: {dict(request.form)}")

            if 'wall_image' not in request.files:
                print("ERROR: No wall_image in request.files")
                return jsonify({'success': False, 'error': 'No wall image provided'}), 400

            wall_file = request.files['wall_image']
            if wall_file.filename == '':
                print("ERROR: Empty filename")
                return jsonify({'success': False, 'error': 'No selected file'}), 400

            if not allowed_file(wall_file.filename):
                print(f"ERROR: Invalid file type: {wall_file.filename}")
                return jsonify({'success': False, 'error': 'Invalid file type'}), 400

            # Read image into memory (no save)
            image_data = wall_file.read()
            print(f"Image read from file, size: {len(image_data)} bytes")

            # Get user preferences from form
            category = request.form.get('category')
            budget = float(request.form.get('budget', 0))
            color = request.form.get('color')
        
        print(f"Preferences - Category: {category}, Budget: {budget}, Color: {color}")

        # Find matching artworks
        print("Finding matching artworks...")
        artworks = art_matcher.find_matches(category, budget, color, max_results=2)
        
        if not artworks:
            print("ERROR: No matching artworks found")
            return jsonify({
                'success': False, 
                'error': 'No matching artworks found'
            }), 404

        print(f"Found {len(artworks)} artworks:")
        for idx, artwork in enumerate(artworks, 1):
            print(f"  {idx}. {artwork.get('title', 'Unknown')} - ${artwork.get('price', 0)}")
        
        # Generate composite image with Gemini (pass bytes instead of path)
        print("Generating composite image with Gemini...")
        result_image = gemini_service.generate_wall_art(image_data, artworks)
        
        if result_image:
            print(f"✅ Composite image generated (length: {len(result_image)})")
            # Ensure proper data URI format
            if not result_image.startswith('data:image'):
                result_image = f"data:image/png;base64,{result_image}"
        else:
            print("⚠️ No composite image generated")

        response_data = {
            'success': True,
            'artworks': artworks,
            'composite_image': result_image
        }

        total_time = time.time() - start_time
        print(f"=== SENDING RESPONSE ===")
        print(f"Success: {response_data['success']}")
        print(f"Artworks count: {len(response_data['artworks'])}")
        print(f"Has composite_image: {bool(response_data['composite_image'])}")
        print(f"⏱️ TOTAL REQUEST TIME: {total_time:.3f} seconds")

        return jsonify(response_data), 200

    except Exception as e:
        print(f"\n❌ ERROR in match_artworks:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Traceback:")
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Accept')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.add('Access-Control-Max-Age', '3600')
    return response

if __name__ == '__main__':
    print(f"\n{'='*50}")
    print(f"WallMatch API Server Starting...")
    print(f"{'='*50}\n")
    app.run(debug=True, port=5000, host='0.0.0.0')