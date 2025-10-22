"""
Keyword Discovery Tool
데이터로부터 실제 키워드를 발견하는 도구
"""

import pandas as pd
from collections import Counter
import re
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np


class KeywordDiscovery:
    def __init__(self, csv_path):
        print("Loading dataset...")
        self.df = pd.read_csv(csv_path)

        # Rating groups
        self.low_rating = self.df[self.df['rating'] <= 2]
        self.mid_rating = self.df[self.df['rating'] == 3]
        self.high_rating = self.df[self.df['rating'] >= 4]

        print(f"Loaded {len(self.df)} reviews")
        print(f"Low rating: {len(self.low_rating)}, Mid: {len(self.mid_rating)}, High: {len(self.high_rating)}")

    def extract_frequent_words(self, rating_group, n=100):
        """
        방법 1: 빈도 기반 키워드 추출
        가장 자주 나오는 단어들 찾기
        """
        if rating_group == 'low':
            reviews = self.low_rating['review_cleaned'].fillna('')
        elif rating_group == 'mid':
            reviews = self.mid_rating['review_cleaned'].fillna('')
        else:
            reviews = self.high_rating['review_cleaned'].fillna('')

        # 모든 리뷰 합치기
        all_text = ' '.join(reviews.astype(str))

        # 단어 추출 (3글자 이상)
        words = re.findall(r'\b[a-z]{3,}\b', all_text.lower())

        # 불용어 제거
        stop_words = {
            'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'has',
            'was', 'were', 'are', 'app', 'one', 'can', 'but', 'not', 'get',
            'use', 'like', 'would', 'even', 'just', 'really', 'also', 'much',
            'make', 'very', 'still', 'more', 'its', 'been', 'had', 'will',
            'all', 'you', 'your', 'only', 'need', 'want', 'than', 'way',
            'could', 'when', 'there', 'what', 'which', 'their', 'they',
            'some', 'out', 'into', 'about', 'then', 'than', 'over', 'back'
        }

        word_freq = Counter([w for w in words if w not in stop_words])

        return dict(word_freq.most_common(n))

    def extract_distinctive_words_tfidf(self, rating_group, n=50):
        """
        방법 2: TF-IDF 기반 키워드 추출
        해당 그룹에서 "특징적으로" 나타나는 단어 찾기
        """
        # 각 그룹별 텍스트 준비
        low_text = ' '.join(self.low_rating['review_cleaned'].fillna('').astype(str))
        mid_text = ' '.join(self.mid_rating['review_cleaned'].fillna('').astype(str))
        high_text = ' '.join(self.high_rating['review_cleaned'].fillna('').astype(str))

        documents = [low_text, mid_text, high_text]
        doc_names = ['low_rating', 'mid_rating', 'high_rating']

        # TF-IDF 계산
        vectorizer = TfidfVectorizer(
            max_features=200,
            stop_words='english',
            ngram_range=(1, 2),  # 1-gram과 2-gram 모두
            min_df=2
        )

        tfidf_matrix = vectorizer.fit_transform(documents)
        feature_names = vectorizer.get_feature_names_out()

        # 해당 그룹의 인덱스
        group_idx = {'low': 0, 'mid': 1, 'high': 2}[rating_group]

        # TF-IDF 점수 추출
        scores = tfidf_matrix[group_idx].toarray()[0]

        # 점수 순으로 정렬
        top_indices = scores.argsort()[-n:][::-1]
        top_words = [(feature_names[i], scores[i]) for i in top_indices]

        return top_words

    def extract_ngrams(self, rating_group, n=2, top_k=50):
        """
        방법 3: N-gram 분석
        자주 함께 나오는 단어 조합 찾기 (예: "data loss", "premium features")
        """
        if rating_group == 'low':
            reviews = self.low_rating['review_cleaned'].fillna('')
        elif rating_group == 'mid':
            reviews = self.mid_rating['review_cleaned'].fillna('')
        else:
            reviews = self.high_rating['review_cleaned'].fillna('')

        all_text = ' '.join(reviews.astype(str))

        # N-gram 추출
        words = all_text.lower().split()
        ngrams = [' '.join(words[i:i+n]) for i in range(len(words)-n+1)]

        # 빈도 계산
        ngram_freq = Counter(ngrams)

        return dict(ngram_freq.most_common(top_k))

    def compare_groups(self, top_n=30):
        """
        방법 4: 그룹 간 비교 분석
        저평점에는 많고 고평점에는 적은 단어 찾기
        """
        low_words = self.extract_frequent_words('low', n=500)
        high_words = self.extract_frequent_words('high', n=500)

        # 저평점에서만 두드러지는 단어
        distinctive_low = {}
        for word, low_count in low_words.items():
            high_count = high_words.get(word, 0)

            # 저평점에서 훨씬 많이 나오는 단어
            if low_count > 100 and (low_count / (high_count + 1)) > 2:
                distinctive_low[word] = {
                    'low_count': low_count,
                    'high_count': high_count,
                    'ratio': low_count / (high_count + 1)
                }

        # 비율 순으로 정렬
        sorted_words = dict(sorted(distinctive_low.items(),
                                  key=lambda x: x[1]['ratio'],
                                  reverse=True)[:top_n])

        return sorted_words

    def discover_pain_point_keywords(self):
        """
        Pain Point 키워드 자동 발견
        """
        print("\n" + "="*80)
        print("PAIN POINT KEYWORD DISCOVERY (from 1-2 star reviews)")
        print("="*80)

        # 방법 1: 빈도 분석
        print("\n1️⃣  Most Frequent Words in Low Ratings:")
        freq_words = self.extract_frequent_words('low', n=30)
        for i, (word, count) in enumerate(list(freq_words.items())[:20], 1):
            print(f"   {i:2d}. {word:20s} ({count:,})")

        # 방법 2: TF-IDF (저평점에 특징적인 단어)
        print("\n2️⃣  Distinctive Words in Low Ratings (TF-IDF):")
        tfidf_words = self.extract_distinctive_words_tfidf('low', n=20)
        for i, (word, score) in enumerate(tfidf_words, 1):
            print(f"   {i:2d}. {word:30s} (score: {score:.4f})")

        # 방법 3: 2-gram (구문 분석)
        print("\n3️⃣  Common Phrases in Low Ratings (2-grams):")
        bigrams = self.extract_ngrams('low', n=2, top_k=20)
        for i, (phrase, count) in enumerate(list(bigrams.items())[:20], 1):
            print(f"   {i:2d}. '{phrase}' ({count:,})")

        # 방법 4: 그룹 간 비교
        print("\n4️⃣  Words More Common in Low vs High Ratings:")
        distinctive = self.compare_groups(top_n=20)
        for i, (word, data) in enumerate(list(distinctive.items())[:20], 1):
            print(f"   {i:2d}. {word:20s} - Low: {data['low_count']:,}, High: {data['high_count']:,} (ratio: {data['ratio']:.1f}x)")

    def discover_success_factor_keywords(self):
        """
        Success Factor 키워드 자동 발견
        """
        print("\n" + "="*80)
        print("SUCCESS FACTOR KEYWORD DISCOVERY (from 4-5 star reviews)")
        print("="*80)

        # 빈도 분석
        print("\n1️⃣  Most Frequent Words in High Ratings:")
        freq_words = self.extract_frequent_words('high', n=30)
        for i, (word, count) in enumerate(list(freq_words.items())[:20], 1):
            print(f"   {i:2d}. {word:20s} ({count:,})")

        # TF-IDF
        print("\n2️⃣  Distinctive Words in High Ratings (TF-IDF):")
        tfidf_words = self.extract_distinctive_words_tfidf('high', n=20)
        for i, (word, score) in enumerate(tfidf_words, 1):
            print(f"   {i:2d}. {word:30s} (score: {score:.4f})")

        # 2-gram
        print("\n3️⃣  Common Phrases in High Ratings (2-grams):")
        bigrams = self.extract_ngrams('high', n=2, top_k=20)
        for i, (phrase, count) in enumerate(list(bigrams.items())[:20], 1):
            print(f"   {i:2d}. '{phrase}' ({count:,})")

    def suggest_keyword_groups(self):
        """
        발견된 키워드를 카테고리별로 그룹화 제안
        """
        print("\n" + "="*80)
        print("SUGGESTED KEYWORD GROUPINGS")
        print("="*80)

        low_words = self.extract_frequent_words('low', n=100)

        # 패턴 매칭으로 카테고리 제안
        categories = {
            "premium_related": [],
            "data_related": [],
            "technical_issues": [],
            "ux_issues": [],
            "account_related": [],
            "feature_requests": []
        }

        # Premium/Payment 관련
        premium_patterns = ['premium', 'paid', 'pay', 'subscription', 'price', 'cost', 'expensive', 'money', 'free']
        categories['premium_related'] = [w for w in low_words if any(p in w for p in premium_patterns)]

        # Data/Loss 관련
        data_patterns = ['data', 'lost', 'delete', 'save', 'backup', 'sync', 'disappear', 'gone', 'missing']
        categories['data_related'] = [w for w in low_words if any(p in w for p in data_patterns)]

        # Technical 관련
        tech_patterns = ['crash', 'bug', 'glitch', 'error', 'broken', 'freeze', 'lag', 'slow']
        categories['technical_issues'] = [w for w in low_words if any(p in w for p in tech_patterns)]

        # UX 관련
        ux_patterns = ['confusing', 'complicated', 'difficult', 'hard', 'cant', 'wont', 'doesnt']
        categories['ux_issues'] = [w for w in low_words if any(p in w for p in ux_patterns)]

        # Account 관련
        account_patterns = ['account', 'login', 'password', 'sign']
        categories['account_related'] = [w for w in low_words if any(p in w for p in account_patterns)]

        for category, words in categories.items():
            if words:
                print(f"\n📦 {category.replace('_', ' ').title()}:")
                print(f"   {', '.join(words[:10])}")

    def generate_keyword_config(self, output_path=None):
        """
        발견된 키워드를 설정 파일로 저장
        """
        config = {
            "pain_keywords": {},
            "feature_keywords": {},
            "sentiment_keywords": {}
        }

        # Pain points (저평점에서 특징적인 단어들)
        distinctive = self.compare_groups(top_n=100)

        # 수동으로 카테고리 분류 (실제로는 클러스터링이나 LLM 사용 가능)
        pain_categories = {
            "premium": [],
            "data_loss": [],
            "bugs": [],
            "ux_issues": [],
            "account": []
        }

        for word in distinctive.keys():
            if any(p in word for p in ['premium', 'paid', 'pay', 'subscription', 'price', 'cost']):
                pain_categories['premium'].append(word)
            elif any(p in word for p in ['lost', 'delete', 'disappear', 'gone', 'missing', 'data']):
                pain_categories['data_loss'].append(word)
            elif any(p in word for p in ['crash', 'bug', 'glitch', 'error', 'broken', 'freeze']):
                pain_categories['bugs'].append(word)
            elif any(p in word for p in ['account', 'login', 'password', 'sign']):
                pain_categories['account'].append(word)
            elif any(p in word for p in ['confusing', 'complicated', 'difficult', 'hard']):
                pain_categories['ux_issues'].append(word)

        config['pain_keywords'] = pain_categories

        # 긍정/부정 키워드
        high_words = self.extract_frequent_words('high', n=50)
        low_words = self.extract_frequent_words('low', n=50)

        positive_indicators = ['love', 'great', 'amazing', 'perfect', 'best', 'helpful', 'easy', 'simple']
        negative_indicators = ['hate', 'terrible', 'awful', 'worst', 'bad', 'useless']

        config['sentiment_keywords'] = {
            'positive': [w for w in high_words if any(p in w for p in positive_indicators)],
            'negative': [w for w in low_words if any(p in w for p in negative_indicators)]
        }

        if output_path:
            import json
            with open(output_path, 'w') as f:
                json.dump(config, f, indent=2)
            print(f"\n💾 Keyword configuration saved to: {output_path}")

        return config


def main():
    csv_path = '/Users/hunjunsin/Desktop/Jun/hcai/FinalProject/reflecta/review-scraping/data/MHARD_dataset.csv'

    discoverer = KeywordDiscovery(csv_path)

    # Pain point 키워드 발견
    discoverer.discover_pain_point_keywords()

    # Success factor 키워드 발견
    discoverer.discover_success_factor_keywords()

    # 키워드 그룹화 제안
    discoverer.suggest_keyword_groups()

    # 설정 파일 생성
    config_path = '/Users/hunjunsin/Desktop/Jun/hcai/FinalProject/reflecta/review-scraping/data/discovered_keywords.json'
    discoverer.generate_keyword_config(config_path)


if __name__ == "__main__":
    main()
