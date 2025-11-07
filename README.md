# WallMatch - AI Art Placement POC

A proof-of-concept application that uses AI to match artworks with user walls and preferences. Uses the Metropolitan Museum of Art API for artwork data and Google Gemini for AI-powered visualization.

## Features

- Upload wall photos
- Select art categories (Classical, Aesthetic, Impressive)
- Set budget preferences with slider
- Choose desired colors with visual color picker
- AI-powered artwork matching from Met Museum collection
- Gemini AI integration for wall visualization

## Project Structure

```
wallmatch-interface/
├── backend/
│   ├── app.py                    # Flask API server
│   ├── services/
│   │   ├── art_matcher.py        # Met Museum API integration
│   │   └── gemini_service.py     # Gemini AI service
│   └── requirements.txt          # Python dependencies
├── public/
│   └── uploads/                  # Uploaded wall images
├── index.html                    # Main UI
├── styles.css                    # Styling
├── script.js                     # Frontend logic
├── .env.example                  # Environment variables template
└── README.md
```

## Quick Start

```bash
# 1. Install dependencies
./install.sh

# 2. Add your Gemini API key to .env
nano .env

# 3. Start everything
./start_all.sh
```

Then open: **http://localhost:8000**

## Setup Instructions

### Quick Setup (Recommended)

```bash
# Run the install script
./install.sh

# Add your Gemini API key to .env
nano .env  # or use any text editor

# Start both servers
./start_all.sh
```

### Manual Setup

### 1. Create Virtual Environment

```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install Dependencies

```bash
cd backend
pip uninstall google-generativeai -y  # Remove old package
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_actual_api_key_here
```

Get your Gemini API key from: https://aistudio.google.com/apikey

### 4. Run Backend Server

```bash
cd backend
python app.py
```

Backend will run on `http://localhost:5000`

### 5. Run Frontend

Open `index.html` in your browser, or use a simple HTTP server:

```bash
# Python 3
python -m http.server 8000

# Node.js (if you have it)
npx http-server -p 8000
```

Then open `http://localhost:8000`

## How It Works

### Frontend Flow
1. User uploads wall image
2. Selects art category (Classical/Aesthetic/Impressive)
3. Sets budget using slider ($100 - $10,000)
4. Chooses desired color from visual palette
5. Clicks "Find Perfect Art" button

### Backend Flow
1. Receives wall image and preferences
2. Queries Met Museum API for matching artworks based on:
   - Category/department
   - Color preferences
   - Budget range
3. Filters and ranks top 2 most relevant artworks
4. Uses Gemini AI to generate composite visualization
5. Returns matched artworks with details and visualization

## API Endpoints

### GET `/api/categories`
Returns available art categories

### GET `/api/colors`
Returns available color options with hex codes

### POST `/api/match`
Matches artworks based on user preferences

**Parameters:**
- `wall_image` (file): User's wall photo
- `category` (string): Art category
- `budget` (number): Budget in USD
- `color` (string): Desired color

**Response:**
```json
{
  "success": true,
  "artworks": [...],
  "composite_image": "base64_encoded_image"
}
```

## Data Source

**Metropolitan Museum of Art API**
- 470,000+ artworks with metadata
- Public domain images
- No authentication required
- API Docs: https://metmuseum.github.io/

## Technologies Used

- **Backend:** Flask, Python 3.x
- **AI:** Google Gemini 2.0 Flash (Nano Banana) - Image Generation
- **Art Data:** Met Museum API (470,000+ artworks)
- **Frontend:** Vanilla HTML/CSS/JavaScript
- **Image Processing:** Pillow (PIL)

## AI Model

Uses **Gemini 2.0 Flash Experimental** (`gemini-2.0-flash-exp`), also known as "Nano Banana":
- Fast text-to-image generation
- Creates photorealistic gallery visualizations
- Automatically falls back to simple composite if unavailable
- Returns images as base64-encoded inline data

## Notes

- This is a POC with minimal code
- Gemini integration is basic and can be enhanced
- Met Museum API is free and requires no authentication
- Color matching is simplified for POC
- Price generation is randomized within budget range

## Future Enhancements

- Better image composition with Gemini
- More sophisticated color matching
- User authentication and saved preferences
- Real pricing from art marketplaces
- Multiple wall visualization angles
- Social sharing features

## License

MIT License - Free to use for educational and commercial purposes
