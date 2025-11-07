import json
import os

class ArtMatcher:
    def __init__(self):
        """Initialize with local artworks JSON file"""
        # Load artworks from JSON file
        json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'artworks.json')

        with open(json_path, 'r') as f:
            self.artworks = json.load(f)

        print(f"✅ Loaded {len(self.artworks)} artworks from local database")

    def find_matches(self, category, budget, color, max_results=2):
        """
        Find artworks matching user preferences from local JSON database

        Args:
            category (str): Art category (classical, aesthetic, impressive)
            budget (float): User's budget
            color (str): Preferred color
            max_results (int): Maximum number of results to return

        Returns:
            list: List of matching artwork dictionaries
        """
        try:
            print(f"\n🔍 Searching artworks:")
            print(f"  - Category: {category}")
            print(f"  - Budget: ${budget}")
            print(f"  - Color: {color}")

            # Filter artworks based on criteria
            matched_artworks = []

            for artwork in self.artworks:
                score = 0

                # Category match (most important)
                if artwork['category'].lower() == category.lower():
                    score += 100

                # Color match
                if color and artwork['color'].lower() == color.lower():
                    score += 50

                # Budget match (within range)
                if artwork['price'] <= budget * 1.2:  # Allow 20% over budget
                    score += 30
                    # Bonus for perfect budget match
                    if artwork['price'] <= budget:
                        score += 20

                # If has some score, add to candidates
                if score > 0:
                    artwork_copy = artwork.copy()
                    artwork_copy['match_score'] = score
                    matched_artworks.append(artwork_copy)

            # Sort by match score (highest first)
            matched_artworks.sort(key=lambda x: x['match_score'], reverse=True)

            # Return top matches
            results = matched_artworks[:max_results]

            print(f"\n✅ Found {len(results)} matching artworks:")
            for i, art in enumerate(results, 1):
                print(f"  {i}. {art['title']} by {art['artist']}")
                print(f"     Price: ${art['price']} | Score: {art['match_score']}")

            return results

        except Exception as e:
            print(f"❌ Error finding matches: {e}")
            import traceback
            traceback.print_exc()
            return []
