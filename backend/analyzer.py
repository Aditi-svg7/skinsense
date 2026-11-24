
import re
from ingredient_data import INGREDIENTS


ALIASES = {
    
    "water": None,
    "glycerol": "glycerol",
    "benzophenone 3": "benzophenone-3",
    "oxybenzone": "benzophenone-3"
}


def normalize_text(text):
    text = text.lower()
    text = text.replace("\n", ",")
    return text


def analyze_ingredients(text, skin_type, concerns):

    normalized = normalize_text(text)

    matched = []
    cautions = []
    seen = set()

    # Search for known ingredient names
    for key, ingredient in INGREDIENTS.items():

        pattern = r"(?<![a-z])" + re.escape(key) + r"(?![a-z])"

        if re.search(pattern, normalized) and key not in seen:

            seen.add(key)

            result = {
                "name": ingredient["name"],
                "category": ingredient["category"],
                "functions": ingredient["functions"],
                "benefits": ingredient["benefits"],
                "skin_assessment": ingredient["skin_notes"].get(
                    skin_type,
                    "No specific assessment available."
                ),
                "cautions": ingredient["cautions"]
            }

            matched.append(result)

            if ingredient["cautions"]:
                cautions.append({
                    "ingredient": ingredient["name"],
                    "reason": ingredient["cautions"]
                })

    # Find unrecognized ingredient information
    known_count = len(matched)

    return {
        "skin_type": skin_type,
        "concerns": concerns,
        "matched_ingredients": matched,
        "potential_cautions": cautions,
        "matched_count": known_count,
        "message": (
            "Analysis complete. Review the potential cautions "
            "and verify the ingredient label."
        )
    }
