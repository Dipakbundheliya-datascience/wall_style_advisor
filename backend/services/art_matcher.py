import json
import os

class ArtMatcher:
    def __init__(self):
        """Initialize with local artworks JSON file"""
        # Load artworks from wall_artwork.json file
        json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'wall_artwork.json')

        with open(json_path, 'r') as f:
            self.artworks = json.load(f)

        print(f"✅ Loaded {len(self.artworks)} artworks from wall_artwork.json")

    def find_matches(self, categories, budget, colors, max_results=2):
        """
        Find artworks matching user preferences from local JSON database

        Args:
            categories (list): List of art categories (Impressionism, Realism, Landscape, etc.)
            budget (float): User's budget
            colors (list): List of preferred colors
            max_results (int): Maximum number of results to return (default 2)

        Returns:
            list: List of matching artwork dictionaries
        """
        try:
            print(f"\n🔍 Searching artworks:")
            print(f"  - Categories: {categories}")
            print(f"  - Budget: ${budget}")
            print(f"  - Colors: {colors}")

            # Filter artworks based on criteria
            matched_artworks = []

            for artwork in self.artworks:
                score = 0

                # Get artwork categories and colors
                artwork_categories = artwork.get('category', [])
                artwork_colors = artwork.get('color', [])

                # Handle if category or color is a string instead of list
                if isinstance(artwork_categories, str):
                    artwork_categories = [artwork_categories]
                if isinstance(artwork_colors, str):
                    artwork_colors = [artwork_colors]

                # Category match (most important) - check if any selected category matches
                category_matches = sum(1 for cat in categories if cat in artwork_categories)
                if category_matches > 0:
                    score += 100 * category_matches  # More matches = higher score

                # Color match - check if any selected color matches
                color_matches = sum(1 for col in colors if col in artwork_colors)
                if color_matches > 0:
                    score += 50 * color_matches  # More matches = higher score

                # Budget match (within range)
                if artwork['price'] <= budget * 1.2:  # Allow 20% over budget
                    score += 30
                    # Bonus for perfect budget match
                    if artwork['price'] <= budget:
                        score += 20

                # Only include artworks with at least one category or color match
                if score > 0 and (category_matches > 0 or color_matches > 0):
                    artwork_copy = artwork.copy()
                    artwork_copy['match_score'] = score
                    artwork_copy['category_matches'] = category_matches
                    artwork_copy['color_matches'] = color_matches
                    matched_artworks.append(artwork_copy)

            # Sort by match score (highest first)
            matched_artworks.sort(key=lambda x: x['match_score'], reverse=True)

            # Return top matches
            results = matched_artworks[:max_results]

            print(f"\n✅ Found {len(results)} matching artworks:")
            for i, art in enumerate(results, 1):
                print(f"  {i}. {art['title']} by {art['artist']}")
                print(f"     Price: ${art['price']} | Score: {art['match_score']}")
                print(f"     Category matches: {art['category_matches']} | Color matches: {art['color_matches']}")

            return results

        except Exception as e:
            print(f"❌ Error finding matches: {e}")
            import traceback
            traceback.print_exc()
            return []
