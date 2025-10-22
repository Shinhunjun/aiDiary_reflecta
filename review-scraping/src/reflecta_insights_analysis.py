"""
Reflecta App Development Insights
==================================
Mental health app review 분석을 통한 실질적인 개발 인사이트 추출

이 스크립트는 다음을 분석합니다:
1. 피해야 할 Pain Points (Low ratings)
2. 반드시 포함해야 할 Features (High ratings)
3. 수익화 전략 분석
4. 경쟁 앱 비교
5. 실행 가능한 권장사항
"""

import pandas as pd
import numpy as np
import re
from collections import Counter, defaultdict
import json
from datetime import datetime

# ============================================================================
# 1. 데이터 로드
# ============================================================================

def load_data(csv_path='../data/MHARD_dataset.csv'):
    """데이터 로드 및 기본 전처리"""
    print("📂 Loading data...")
    df = pd.read_csv(csv_path)

    # Rating groups 생성
    df['rating_group'] = pd.cut(df['rating'],
                                 bins=[0, 2, 3, 5],
                                 labels=['Low (1-2⭐)', 'Mid (3⭐)', 'High (4-5⭐)'])

    print(f"✅ Loaded {len(df):,} reviews")
    return df


# ============================================================================
# 2. Pain Points 분석 (피해야 할 것)
# ============================================================================

def analyze_pain_points(df):
    """Low rating 리뷰에서 주요 불만사항 추출"""
    print("\n" + "="*80)
    print("😞 PAIN POINTS ANALYSIS - 피해야 할 것들")
    print("="*80)

    low_reviews = df[df['rating_group'] == 'Low (1-2⭐)']['review'].fillna('')

    # 주요 불만 카테고리
    pain_categories = {
        '💰 Monetization Issues (수익화 문제)': [
            'subscription', 'pay', 'paid', 'money', 'free', 'trial',
            'charge', 'expensive', 'cost', 'price', 'cancel', 'refund'
        ],
        '🐛 Technical Issues (기술적 문제)': [
            'crash', 'bug', 'broken', 'error', 'glitch', 'freeze',
            'lag', 'slow', 'load', 'work', 'fix'
        ],
        '🔐 Account/Access Issues (계정/접근 문제)': [
            'login', 'account', 'password', 'sign', 'access', 'unlock',
            'lock', 'restore', 'sync'
        ],
        '📱 Device/Platform Issues (기기/플랫폼 문제)': [
            'phone', 'android', 'ios', 'iphone', 'device', 'update',
            'version', 'compatibility'
        ],
        '😤 UX/Usability Issues (사용성 문제)': [
            'confusing', 'complicated', 'difficult', 'hard', 'understand',
            'navigate', 'find', 'interface', 'design'
        ],
        '📢 Ads Issues (광고 문제)': [
            'ads', 'advertisement', 'pop', 'banner', 'commercial'
        ]
    }

    results = {}
    for category, keywords in pain_categories.items():
        count = 0
        examples = []

        for review in low_reviews:
            review_lower = str(review).lower()
            if any(keyword in review_lower for keyword in keywords):
                count += 1
                if len(examples) < 3:
                    examples.append(review[:150])

        percentage = (count / len(low_reviews)) * 100
        results[category] = {
            'count': count,
            'percentage': percentage,
            'examples': examples
        }

    # 결과 출력
    for category, data in sorted(results.items(),
                                 key=lambda x: x[1]['percentage'],
                                 reverse=True):
        print(f"\n{category}")
        print(f"  📊 Found in {data['count']:,} reviews ({data['percentage']:.1f}% of low ratings)")
        if data['examples']:
            print(f"  📝 Examples:")
            for ex in data['examples'][:2]:
                print(f"     - {ex}...")

    return results


# ============================================================================
# 3. Success Factors 분석 (반드시 포함해야 할 것)
# ============================================================================

def analyze_success_factors(df):
    """High rating 리뷰에서 핵심 성공 요인 추출"""
    print("\n" + "="*80)
    print("😊 SUCCESS FACTORS - 반드시 포함해야 할 것들")
    print("="*80)

    high_reviews = df[df['rating_group'] == 'High (4-5⭐)']['review'].fillna('')

    # 성공 요인 카테고리
    success_categories = {
        '🎯 Core Features (핵심 기능)': {
            'keywords': ['track', 'mood', 'journal', 'diary', 'log', 'record', 'habit'],
            'importance': 'CRITICAL'
        },
        '🧘 Mental Health Features (정신 건강 기능)': {
            'keywords': ['anxiety', 'stress', 'meditation', 'mindfulness', 'calm',
                        'relax', 'therapy', 'mental', 'emotion', 'feeling'],
            'importance': 'CRITICAL'
        },
        '📊 Analytics & Insights (분석 및 인사이트)': {
            'keywords': ['insight', 'pattern', 'trend', 'report', 'chart', 'graph',
                        'statistics', 'analysis', 'summary'],
            'importance': 'HIGH'
        },
        '💡 Ease of Use (사용 편의성)': {
            'keywords': ['easy', 'simple', 'intuitive', 'straightforward', 'user friendly',
                        'convenient', 'quick'],
            'importance': 'CRITICAL'
        },
        '🎨 Design & UI (디자인 및 UI)': {
            'keywords': ['beautiful', 'clean', 'design', 'aesthetic', 'interface',
                        'layout', 'pretty'],
            'importance': 'MEDIUM'
        },
        '🆓 Free Features (무료 기능)': {
            'keywords': ['free', 'no cost', 'without paying', 'complimentary'],
            'importance': 'HIGH'
        },
        '🔔 Reminders & Notifications (알림)': {
            'keywords': ['reminder', 'notification', 'alert', 'prompt', 'notify'],
            'importance': 'MEDIUM'
        },
        '🔒 Privacy & Security (프라이버시 및 보안)': {
            'keywords': ['privacy', 'private', 'secure', 'safe', 'confidential',
                        'anonymous', 'password'],
            'importance': 'HIGH'
        }
    }

    results = {}
    for category, info in success_categories.items():
        count = 0
        examples = []

        for review in high_reviews:
            review_lower = str(review).lower()
            if any(keyword in review_lower for keyword in info['keywords']):
                count += 1
                if len(examples) < 3:
                    examples.append(review[:150])

        percentage = (count / len(high_reviews)) * 100
        results[category] = {
            'count': count,
            'percentage': percentage,
            'importance': info['importance'],
            'examples': examples
        }

    # 결과 출력
    print("\n🔥 CRITICAL Features (필수):")
    for category, data in sorted(results.items(),
                                 key=lambda x: x[1]['percentage'],
                                 reverse=True):
        if data['importance'] == 'CRITICAL':
            print(f"\n  {category}")
            print(f"    📊 Mentioned in {data['count']:,} reviews ({data['percentage']:.1f}%)")
            if data['examples']:
                print(f"    📝 Example: {data['examples'][0][:120]}...")

    print("\n\n⭐ HIGH Priority Features (높은 우선순위):")
    for category, data in sorted(results.items(),
                                 key=lambda x: x[1]['percentage'],
                                 reverse=True):
        if data['importance'] == 'HIGH':
            print(f"\n  {category}")
            print(f"    📊 Mentioned in {data['count']:,} reviews ({data['percentage']:.1f}%)")

    return results


# ============================================================================
# 4. 수익화 전략 분석
# ============================================================================

def analyze_monetization_strategy(df):
    """수익화 전략 분석"""
    print("\n" + "="*80)
    print("💰 MONETIZATION STRATEGY - 수익화 전략 분석")
    print("="*80)

    # Subscription 언급 분석
    sub_low = df[df['rating_group'] == 'Low (1-2⭐)']['review'].fillna('')
    sub_high = df[df['rating_group'] == 'High (4-5⭐)']['review'].fillna('')

    sub_keywords = ['subscription', 'premium', 'pro', 'paid', 'upgrade']

    low_sub_mentions = sum(any(kw in str(review).lower() for kw in sub_keywords)
                           for review in sub_low)
    high_sub_mentions = sum(any(kw in str(review).lower() for kw in sub_keywords)
                            for review in sub_high)

    low_pct = (low_sub_mentions / len(sub_low)) * 100
    high_pct = (high_sub_mentions / len(sub_high)) * 100

    print(f"\n📊 Subscription Mentions:")
    print(f"  ❌ In Low Ratings: {low_sub_mentions:,} mentions ({low_pct:.1f}%)")
    print(f"  ✅ In High Ratings: {high_sub_mentions:,} mentions ({high_pct:.1f}%)")
    print(f"  ⚠️  Risk Factor: {low_pct / high_pct:.2f}x more complaints in low ratings")

    # 추천 전략
    print(f"\n💡 Recommended Strategy for Reflecta:")
    print(f"  1. ✅ Freemium 모델: 핵심 기능은 무료로 제공")
    print(f"  2. ✅ 명확한 가치 제안: Premium 기능의 가치를 분명히")
    print(f"  3. ✅ 무료 체험 기간: 충분한 trial 기간 제공 (7-14일)")
    print(f"  4. ❌ 피해야 할 것: 갑작스러운 유료화, 숨겨진 비용")
    print(f"  5. ✅ 투명성: 가격과 기능을 명확하게 표시")

    # 무료로 제공해야 할 기능
    print(f"\n🆓 Must-Have FREE Features:")
    print(f"  - Basic mood tracking")
    print(f"  - Daily journal entry")
    print(f"  - Basic reminders")
    print(f"  - Simple analytics (last 7 days)")

    print(f"\n💎 Premium Features (Optional):")
    print(f"  - Advanced analytics & trends")
    print(f"  - Unlimited journal entries")
    print(f"  - Export data")
    print(f"  - Custom themes")
    print(f"  - Cloud sync across devices")


# ============================================================================
# 5. 앱별 비교 분석
# ============================================================================

def analyze_by_app(df):
    """앱별 강점/약점 분석"""
    print("\n" + "="*80)
    print("📱 APP COMPARISON - 경쟁 앱 분석")
    print("="*80)

    # 앱별 평균 평점
    app_ratings = df.groupby('app_name').agg({
        'rating': ['mean', 'count', 'std']
    }).round(2)

    app_ratings.columns = ['avg_rating', 'review_count', 'std_dev']
    app_ratings = app_ratings.sort_values('avg_rating', ascending=False)

    print("\n📊 Top Rated Mental Health Apps:")
    for idx, (app_name, data) in enumerate(app_ratings.head(10).iterrows(), 1):
        print(f"  {idx:2d}. {app_name:20s}: {data['avg_rating']:.2f}⭐ "
              f"({data['review_count']:>6,} reviews)")

    print("\n\n💡 Insights for Reflecta:")
    top_app = app_ratings.index[0]
    top_rating = app_ratings.iloc[0]['avg_rating']

    print(f"  🎯 Target: Match or exceed {top_app}'s rating of {top_rating:.2f}⭐")
    print(f"  📈 Strategy: Focus on the success factors identified above")
    print(f"  🚫 Avoid: The pain points that hurt other apps")


# ============================================================================
# 6. 실행 가능한 권장사항 생성
# ============================================================================

def generate_actionable_recommendations(pain_points, success_factors):
    """실행 가능한 권장사항 생성"""
    print("\n" + "="*80)
    print("🎯 ACTIONABLE RECOMMENDATIONS FOR REFLECTA")
    print("="*80)

    recommendations = {
        "Phase 1: MVP (Must Have)": [
            "✅ Simple mood tracking (1-5 scale or emoji)",
            "✅ Daily journal with easy text entry",
            "✅ Basic reminders for daily check-ins",
            "✅ Simple, clean, intuitive UI",
            "✅ Completely FREE core features",
            "✅ Fast & reliable (no crashes/bugs)",
            "✅ Privacy-first approach (local storage option)"
        ],
        "Phase 2: Enhancement (Should Have)": [
            "📊 7-day mood trends & patterns",
            "🧘 Basic meditation/breathing exercises",
            "📈 Simple insights & statistics",
            "🎨 Beautiful, calming design",
            "🔔 Smart notification timing",
            "💾 Data backup option"
        ],
        "Phase 3: Premium (Nice to Have)": [
            "📊 Advanced analytics (30+ days)",
            "🌈 Custom themes & personalization",
            "☁️  Cloud sync across devices",
            "📤 Export data (PDF/CSV)",
            "🎯 Goal setting & tracking",
            "🧠 AI-powered insights"
        ],
        "⚠️  AVOID at All Costs": [
            "❌ Forcing subscription too early",
            "❌ Hidden costs or surprise charges",
            "❌ Buggy or slow performance",
            "❌ Complicated onboarding",
            "❌ Intrusive ads",
            "❌ Requiring account for basic use",
            "❌ Poor Android/iOS compatibility"
        ]
    }

    for phase, items in recommendations.items():
        print(f"\n{phase}:")
        for item in items:
            print(f"  {item}")

    return recommendations


# ============================================================================
# 7. 결과 저장
# ============================================================================

def save_results(pain_points, success_factors, recommendations, output_path='../data/reflecta_insights.json'):
    """결과를 JSON으로 저장"""
    results = {
        'timestamp': datetime.now().isoformat(),
        'analysis_type': 'Reflecta Development Insights',
        'pain_points': pain_points,
        'success_factors': success_factors,
        'recommendations': recommendations
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\n\n💾 Results saved to: {output_path}")


# ============================================================================
# MAIN
# ============================================================================

def main():
    """메인 실행 함수"""
    print("="*80)
    print("🚀 REFLECTA APP DEVELOPMENT INSIGHTS")
    print("="*80)
    print("\nAnalyzing 200K+ mental health app reviews to guide Reflecta development...\n")

    # 1. 데이터 로드
    df = load_data()

    # 2. Pain Points 분석
    pain_points = analyze_pain_points(df)

    # 3. Success Factors 분석
    success_factors = analyze_success_factors(df)

    # 4. 수익화 전략
    analyze_monetization_strategy(df)

    # 5. 앱별 비교
    analyze_by_app(df)

    # 6. 실행 가능한 권장사항
    recommendations = generate_actionable_recommendations(pain_points, success_factors)

    # 7. 결과 저장
    save_results(pain_points, success_factors, recommendations)

    print("\n" + "="*80)
    print("✅ ANALYSIS COMPLETE!")
    print("="*80)
    print("\n📋 Next Steps:")
    print("  1. Review the insights above")
    print("  2. Prioritize features for Reflecta MVP")
    print("  3. Design mockups based on success factors")
    print("  4. Plan monetization strategy carefully")
    print("  5. Avoid all identified pain points")
    print("\n💡 Key Takeaway: Focus on simplicity, privacy, and core value BEFORE monetization\n")


if __name__ == "__main__":
    main()
