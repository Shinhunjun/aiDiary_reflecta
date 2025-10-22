"""
MHARD Dataset Analyzer for Reflecta Insights
Analyzes mental health app reviews to extract actionable insights
"""

import pandas as pd
import numpy as np
from collections import Counter, defaultdict
import re
import json
from datetime import datetime


class MHARDAnalyzer:
    def __init__(self, csv_path):
        """Initialize analyzer with MHARD dataset"""
        print("Loading MHARD dataset...")
        self.df = pd.read_csv(csv_path)
        print(f"Loaded {len(self.df)} reviews from {self.df['app_name'].nunique()} apps")

        # Define rating groups
        self.low_rating = self.df[self.df['rating'] <= 2]
        self.mid_rating = self.df[self.df['rating'] == 3]
        self.high_rating = self.df[self.df['rating'] >= 4]

        # Mental health specific keywords
        self.mental_health_keywords = {
            "conditions": ["anxiety", "depression", "stress", "panic", "trauma", "ptsd",
                          "bipolar", "ocd", "adhd", "mental health", "mental illness"],
            "therapy": ["therapist", "counselor", "therapy", "counseling", "treatment",
                       "professional", "psychologist"],
            "symptoms": ["mood", "emotion", "feeling", "crisis", "breakdown", "episode",
                        "trigger", "overwhelmed"],
            "improvement": ["better", "helped", "improved", "relief", "calm", "peace",
                          "recovery", "healing", "cope", "coping"]
        }

        # Feature keywords
        self.feature_keywords = {
            "journaling": ["journal", "diary", "write", "writing", "entry", "story", "note"],
            "mood_tracking": ["mood", "emotion", "feeling", "track", "log"],
            "meditation": ["meditate", "meditation", "mindfulness", "breathing", "relaxation"],
            "community": ["community", "share", "social", "connect", "support group"],
            "reminders": ["reminder", "notification", "alert", "notify"],
            "analytics": ["statistics", "stats", "graph", "chart", "insights", "data", "score"],
            "customization": ["customize", "theme", "color", "personalize", "custom"],
            "privacy": ["privacy", "private", "secure", "security", "password", "lock"],
            "offline": ["offline", "internet", "wifi", "network", "connection"],
            "backup": ["backup", "sync", "cloud", "save", "restore"]
        }

        # Pain point keywords
        self.pain_keywords = {
            "data_loss": ["deleted", "lost", "disappeared", "gone", "missing", "erased"],
            "bugs": ["crash", "bug", "glitch", "freeze", "broken", "not working", "error"],
            "complexity": ["complicated", "confusing", "difficult", "hard", "complex"],
            "forced_ux": ["forced", "required", "must", "have to", "need to", "make me"],
            "premium": ["premium", "paid", "pay", "expensive", "price", "subscription", "cost"],
            "account": ["account", "login", "password", "sign in", "delete account"]
        }

        # Positive sentiment keywords
        self.positive_keywords = [
            "love", "amazing", "great", "excellent", "wonderful", "fantastic",
            "perfect", "best", "awesome", "helpful", "easy", "simple",
            "beautiful", "cute", "calming", "peaceful", "recommend"
        ]

        # Negative sentiment keywords
        self.negative_keywords = [
            "hate", "awful", "terrible", "horrible", "worst", "bad",
            "disappointing", "frustrated", "annoying", "useless", "waste"
        ]

    def get_rating_distribution(self):
        """Get overall rating distribution"""
        return {
            "total_reviews": len(self.df),
            "rating_distribution": self.df['rating'].value_counts().sort_index().to_dict(),
            "average_rating": self.df['rating'].mean(),
            "low_rating_count": len(self.low_rating),
            "mid_rating_count": len(self.mid_rating),
            "high_rating_count": len(self.high_rating)
        }

    def extract_keywords_by_rating(self, rating_group_name):
        """Extract most common keywords from a rating group"""
        if rating_group_name == "low":
            df_subset = self.low_rating
        elif rating_group_name == "mid":
            df_subset = self.mid_rating
        else:
            df_subset = self.high_rating

        # Combine all reviews
        all_text = " ".join(df_subset['review_cleaned'].fillna("").astype(str))

        # Extract words (simple tokenization)
        words = re.findall(r'\b[a-z]{3,}\b', all_text.lower())

        # Count frequency
        word_freq = Counter(words)

        # Remove common stop words
        stop_words = {'the', 'and', 'for', 'with', 'this', 'that', 'from',
                     'have', 'has', 'was', 'were', 'are', 'app'}
        word_freq = {k: v for k, v in word_freq.items() if k not in stop_words}

        return dict(word_freq.most_common(50))

    def analyze_pain_points(self):
        """Analyze pain points from low-rated reviews"""
        results = {}

        for pain_type, keywords in self.pain_keywords.items():
            mentions = 0
            examples = []

            for _, row in self.low_rating.iterrows():
                review = str(row['review']).lower()

                for keyword in keywords:
                    if keyword in review:
                        mentions += 1
                        if len(examples) < 3:
                            examples.append({
                                "app": row['app_name'],
                                "rating": row['rating'],
                                "review": row['review'][:200] + "..." if len(str(row['review'])) > 200 else row['review']
                            })
                        break

            results[pain_type] = {
                "mentions": mentions,
                "percentage": (mentions / len(self.low_rating) * 100) if len(self.low_rating) > 0 else 0,
                "examples": examples
            }

        # Sort by mentions
        results = dict(sorted(results.items(), key=lambda x: x[1]['mentions'], reverse=True))
        return results

    def analyze_features(self):
        """Analyze feature mentions across different rating groups"""
        results = {}

        for feature, keywords in self.feature_keywords.items():
            low_mentions = 0
            mid_mentions = 0
            high_mentions = 0

            for _, row in self.df.iterrows():
                review = str(row['review']).lower()

                # Check if any keyword is mentioned
                if any(keyword in review for keyword in keywords):
                    rating = row['rating']
                    if rating <= 2:
                        low_mentions += 1
                    elif rating == 3:
                        mid_mentions += 1
                    else:
                        high_mentions += 1

            total_mentions = low_mentions + mid_mentions + high_mentions

            results[feature] = {
                "total_mentions": total_mentions,
                "low_rating_mentions": low_mentions,
                "mid_rating_mentions": mid_mentions,
                "high_rating_mentions": high_mentions,
                "satisfaction_ratio": (high_mentions / total_mentions * 100) if total_mentions > 0 else 0
            }

        # Sort by total mentions
        results = dict(sorted(results.items(), key=lambda x: x[1]['total_mentions'], reverse=True))
        return results

    def analyze_mental_health_impact(self):
        """Analyze mental health related mentions"""
        results = {}

        for category, keywords in self.mental_health_keywords.items():
            mentions_by_rating = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
            examples = []

            for _, row in self.df.iterrows():
                review = str(row['review']).lower()

                if any(keyword in review for keyword in keywords):
                    rating_str = str(int(row['rating']))
                    mentions_by_rating[rating_str] = mentions_by_rating.get(rating_str, 0) + 1

                    if len(examples) < 5:
                        examples.append({
                            "app": row['app_name'],
                            "rating": row['rating'],
                            "snippet": row['review'][:150] + "..." if len(str(row['review'])) > 150 else row['review']
                        })

            results[category] = {
                "total_mentions": sum(mentions_by_rating.values()),
                "by_rating": mentions_by_rating,
                "examples": examples
            }

        return results

    def extract_top_insights(self, n=10):
        """Extract top insights for each rating category"""
        insights = {
            "critical_issues": [],  # From 1-2 star
            "improvement_areas": [],  # From 3 star
            "success_factors": []  # From 4-5 star
        }

        # Analyze low ratings for critical issues
        pain_points = self.analyze_pain_points()
        for pain_type, data in list(pain_points.items())[:n]:
            insights["critical_issues"].append({
                "issue": pain_type,
                "frequency": data["mentions"],
                "percentage": round(data["percentage"], 2),
                "example": data["examples"][0] if data["examples"] else None
            })

        # Analyze mid ratings for improvements
        mid_keywords = self.extract_keywords_by_rating("mid")
        for word, count in list(mid_keywords.items())[:n]:
            insights["improvement_areas"].append({
                "keyword": word,
                "mentions": count
            })

        # Analyze high ratings for success factors
        high_keywords = self.extract_keywords_by_rating("high")
        for word, count in list(high_keywords.items())[:n]:
            insights["success_factors"].append({
                "keyword": word,
                "mentions": count
            })

        return insights

    def generate_reflecta_recommendations(self):
        """Generate specific recommendations for Reflecta based on analysis"""
        pain_points = self.analyze_pain_points()
        features = self.analyze_features()

        recommendations = {
            "must_have_features": [],
            "must_avoid_problems": [],
            "differentiation_opportunities": []
        }

        # Must-have features (high satisfaction ratio and mentions)
        for feature, data in features.items():
            if data['satisfaction_ratio'] > 70 and data['total_mentions'] > 100:
                recommendations["must_have_features"].append({
                    "feature": feature,
                    "reason": f"{data['satisfaction_ratio']:.1f}% satisfaction ratio with {data['total_mentions']} mentions"
                })

        # Must-avoid problems (high pain point mentions)
        for pain_type, data in pain_points.items():
            if data['percentage'] > 10:
                recommendations["must_avoid_problems"].append({
                    "problem": pain_type,
                    "severity": f"{data['percentage']:.1f}% of negative reviews",
                    "action": self._get_mitigation_strategy(pain_type)
                })

        # Differentiation opportunities (mentioned but low satisfaction)
        for feature, data in features.items():
            if 30 < data['satisfaction_ratio'] < 60 and data['total_mentions'] > 50:
                recommendations["differentiation_opportunities"].append({
                    "feature": feature,
                    "current_gap": f"Only {data['satisfaction_ratio']:.1f}% satisfaction",
                    "opportunity": f"Improve this feature to stand out"
                })

        return recommendations

    def _get_mitigation_strategy(self, pain_type):
        """Get mitigation strategy for each pain point"""
        strategies = {
            "data_loss": "Implement automatic cloud backup and local data persistence",
            "bugs": "Extensive testing, error handling, and crash reporting",
            "complexity": "Simplify onboarding, make features optional and discoverable",
            "forced_ux": "Allow users to skip steps and customize their experience",
            "premium": "Balance free and premium features thoughtfully",
            "account": "Easy account management and data export options"
        }
        return strategies.get(pain_type, "Address this issue in design")

    def generate_report(self, output_path=None):
        """Generate comprehensive analysis report"""
        print("\n" + "="*80)
        print("MHARD DATASET ANALYSIS - REFLECTA INSIGHTS")
        print("="*80)

        # Overview
        dist = self.get_rating_distribution()
        print(f"\n📊 OVERVIEW")
        print(f"Total Reviews: {dist['total_reviews']:,}")
        print(f"Average Rating: {dist['average_rating']:.2f}")
        print(f"\nRating Distribution:")
        for rating, count in sorted(dist['rating_distribution'].items()):
            percentage = (count / dist['total_reviews'] * 100)
            bar = "█" * int(percentage / 2)
            print(f"  {rating}★: {bar} {count:,} ({percentage:.1f}%)")

        # Pain Points
        print(f"\n🚨 CRITICAL PAIN POINTS (from {len(self.low_rating):,} low-rated reviews)")
        pain_points = self.analyze_pain_points()
        for i, (pain_type, data) in enumerate(list(pain_points.items())[:5], 1):
            print(f"\n{i}. {pain_type.replace('_', ' ').title()}")
            print(f"   Mentions: {data['mentions']} ({data['percentage']:.1f}%)")
            if data['examples']:
                print(f"   Example: \"{data['examples'][0]['review'][:100]}...\"")

        # Features
        print(f"\n✨ FEATURE ANALYSIS")
        features = self.analyze_features()
        print("\nTop Features by Satisfaction:")
        sorted_features = sorted(features.items(),
                                key=lambda x: x[1]['satisfaction_ratio'],
                                reverse=True)
        for i, (feature, data) in enumerate(list(sorted_features)[:5], 1):
            print(f"{i}. {feature.replace('_', ' ').title()}")
            print(f"   Satisfaction: {data['satisfaction_ratio']:.1f}% ({data['total_mentions']} mentions)")

        # Mental Health Impact
        print(f"\n💚 MENTAL HEALTH CONTEXT")
        mh_analysis = self.analyze_mental_health_impact()
        for category, data in mh_analysis.items():
            print(f"\n{category.replace('_', ' ').title()}: {data['total_mentions']} mentions")
            if data['examples']:
                print(f"   Example: \"{data['examples'][0]['snippet']}\"")

        # Recommendations
        print(f"\n🎯 RECOMMENDATIONS FOR REFLECTA")
        recs = self.generate_reflecta_recommendations()

        print("\n✅ Must-Have Features:")
        for i, rec in enumerate(recs['must_have_features'][:5], 1):
            print(f"{i}. {rec['feature'].replace('_', ' ').title()}")
            print(f"   → {rec['reason']}")

        print("\n❌ Must-Avoid Problems:")
        for i, rec in enumerate(recs['must_avoid_problems'][:5], 1):
            print(f"{i}. {rec['problem'].replace('_', ' ').title()} ({rec['severity']})")
            print(f"   → {rec['action']}")

        print("\n🚀 Differentiation Opportunities:")
        for i, rec in enumerate(recs['differentiation_opportunities'][:3], 1):
            print(f"{i}. {rec['feature'].replace('_', ' ').title()}")
            print(f"   → {rec['opportunity']}")

        print("\n" + "="*80)

        # Save to JSON if output path provided
        if output_path:
            full_report = {
                "generated_at": datetime.now().isoformat(),
                "overview": dist,
                "pain_points": pain_points,
                "features": features,
                "mental_health_analysis": mh_analysis,
                "recommendations": recs
            }

            with open(output_path, 'w') as f:
                json.dump(full_report, f, indent=2)

            print(f"\n📄 Full report saved to: {output_path}")


def main():
    """Main execution"""
    import sys

    csv_path = '/Users/hunjunsin/Desktop/Jun/hcai/FinalProject/reflecta/review-scraping/data/MHARD_dataset.csv'

    if len(sys.argv) > 1:
        csv_path = sys.argv[1]

    analyzer = MHARDAnalyzer(csv_path)

    # Generate report
    output_json = csv_path.replace('.csv', '_insights.json')
    analyzer.generate_report(output_path=output_json)


if __name__ == "__main__":
    main()
