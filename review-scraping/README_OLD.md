# Mental Health Counseling Center Review Scraper

Google Maps 리뷰 스크래퍼 및 텍스트 분석 도구입니다. 대학 mental health counseling center의 리뷰를 수집하고 분석하여 데이터셋을 준비합니다.

## 기능

- **리뷰 스크래핑**: Google Maps에서 리뷰를 자동으로 수집
- **데이터 저장**: JSON 및 CSV 형식으로 저장
- **텍스트 분석**:
  - 평점 분포
  - 감정 분석 (키워드 기반)
  - 자주 사용되는 단어/주제 추출
  - 텍스트 길이 통계
- **MHARD 데이터셋 분석**: 200K+ mental health 앱 리뷰 분석
  - 별점별 Pain Point 분석
  - 기능별 만족도 분석
  - Reflecta 설계를 위한 인사이트 도출

## 설치

```bash
npm install
```

Playwright 브라우저 설치:
```bash
npx playwright install chromium
```

## 환경 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Google Maps URL (선택사항 - 명령줄에서도 지정 가능)
GOOGLE_MAPS_URLS=https://www.google.com/maps/place/...

# 최대 수집 리뷰 개수 (기본값: 100)
MAX_REVIEWS=100

# 출력 디렉토리 (기본값: ./data)
OUTPUT_DIR=./data
```

## 사용법

### 1. Google Maps URL 찾기

1. Google Maps에서 원하는 counseling center를 검색합니다
2. 해당 장소 페이지의 URL을 복사합니다
   - 예: `https://www.google.com/maps/place/...`

### 2. 리뷰 스크래핑

```bash
# 방법 1: URL을 직접 제공
npm run scrape "https://www.google.com/maps/place/..."

# 방법 2: .env 파일의 URL 사용
npm run scrape
```

### 3. 데이터 분석

```bash
# JSON 파일 분석
npm run analyze ./data/reviews_2024-01-01T12-00-00.json

# CSV 파일 분석
npm run analyze ./data/reviews_2024-01-01T12-00-00.csv
```

### 4. 전체 파이프라인 (스크래핑 + 분석)

```bash
npm start full "https://www.google.com/maps/place/..."
```

### 5. MHARD 데이터셋 분석 (Reflecta 인사이트)

```bash
# Python 필요 (pandas 설치 필요)
pip install pandas

# MHARD 데이터셋 분석 실행
npm run analyze:mhard

# 또는 직접 실행
python3 src/mhard_analyzer.py
```

이 분석은 다음을 제공합니다:
- 🚨 Critical Pain Points (1-2점 리뷰에서)
- ✨ Feature Satisfaction Analysis (기능별 만족도)
- 💚 Mental Health Context (mental health 관련 언급)
- 🎯 Reflecta를 위한 구체적 권장사항

## 출력 파일

스크래핑 후 `data/` 디렉토리에 다음 파일들이 생성됩니다:

1. **reviews_[timestamp].json** - 원본 리뷰 데이터 (JSON)
2. **reviews_[timestamp].csv** - 원본 리뷰 데이터 (CSV)
3. **reviews_[timestamp]_analysis.json** - 분석 결과

### JSON 데이터 구조

```json
{
  "location": {
    "name": "Location Name",
    "rating": "4.5",
    "totalReviews": "100 reviews"
  },
  "url": "https://...",
  "scrapedAt": "2024-01-01T12:00:00.000Z",
  "totalReviews": 100,
  "reviews": [
    {
      "reviewId": "...",
      "name": "Reviewer Name",
      "rating": 5,
      "date": "2 months ago",
      "text": "Review text...",
      "textLength": 150
    }
  ]
}
```

## 분석 리포트 예시

```
=============================================================
REVIEW ANALYSIS REPORT
=============================================================

Location: University Counseling Center
Overall Rating: 4.2

Total Reviews Analyzed: 100
Average Rating: 4.15

--- Rating Distribution ---
5 star: ████████████████ 45 (45.0%)
4 star: ██████████ 25 (25.0%)
3 star: █████ 15 (15.0%)
2 star: ███ 10 (10.0%)
1 star: ██ 5 (5.0%)

--- Text Length Statistics ---
Average: 245 characters
Median: 180 characters
Range: 15 - 850 characters

--- Sentiment Indicators ---
Positive keywords found: 78
Negative keywords found: 32
Sentiment ratio: 2.44
Mental health mentions: 56

--- Most Common Words ---
1. helpful: 23
2. staff: 19
3. counselor: 18
...
```

## 주의사항

1. **법적 준수**: Google의 서비스 약관을 준수하세요
2. **Rate Limiting**: 과도한 요청을 피하기 위해 적절한 딜레이가 포함되어 있습니다
3. **데이터 프라이버시**: 수집된 데이터는 연구 목적으로만 사용하세요

## 트러블슈팅

### 리뷰가 로드되지 않는 경우
- 인터넷 연결을 확인하세요
- URL이 올바른지 확인하세요
- `MAX_REVIEWS` 값을 줄여보세요

### Playwright 에러
```bash
# 브라우저 재설치
npx playwright install --force chromium
```

## 데이터 활용

수집된 데이터는 다음과 같은 텍스트 분석에 활용할 수 있습니다:

- 감정 분석 (Sentiment Analysis)
- 주제 모델링 (Topic Modeling)
- 키워드 추출
- 사용자 경험 패턴 분석
- NLP 모델 학습 데이터

## 라이선스

MIT License
