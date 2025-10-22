# MHARD 데이터셋 분석 계획: Reflecta 인사이트 도출

## 목표
Mental health 앱 사용자들의 실제 경험을 분석하여 Reflecta 설계에 반영할 인사이트 도출

## 분석 전략

### Phase 1: 별점별 텍스트 분석

#### 1.1 Pain Point 분석 (1-2점 리뷰)
**목적**: 사용자가 앱을 떠나게 만드는 치명적 문제 파악

**분석 항목**:
- **데이터 손실 관련**
  - 키워드: "deleted", "lost", "disappeared", "gone", "missing"
  - 인사이트: 데이터 백업/동기화의 중요성

- **기술적 문제**
  - 키워드: "crash", "bug", "glitch", "freeze", "broken", "not working"
  - 인사이트: 안정성이 최우선

- **UX 장벽**
  - 키워드: "complicated", "confusing", "too many steps", "forced", "required"
  - 인사이트: 간단하고 선택적인 UX

- **프라이버시 우려**
  - 키워드: "privacy", "data", "account", "delete account", "password"
  - 인사이트: 명확한 데이터 정책, 쉬운 계정 관리

#### 1.2 개선 요구사항 분석 (3점 리뷰)
**목적**: "좋지만 아쉬운" 부분 파악

**분석 항목**:
- **비싼 Premium**
  - 키워드: "premium", "paid", "expensive", "free"
  - 인사이트: 적절한 무료/유료 기능 밸런스

- **부족한 기능**
  - 키워드: "wish", "would be nice", "missing", "add", "feature request"
  - 인사이트: 우선순위 높은 기능

- **UI/UX 불편**
  - 키워드: "difficult to", "hard to find", "cannot", "no option"
  - 인사이트: 사용성 개선 포인트

#### 1.3 성공 요인 분석 (4-5점 리뷰)
**목적**: 사용자를 만족시키는 핵심 가치 파악

**분석 항목**:
- **감정적 연결**
  - 키워드: "love", "amazing", "life-changing", "helped me", "grateful"
  - 인사이트: 정서적 지원의 중요성

- **핵심 기능**
  - 키워드: "mood tracking", "journaling", "meditation", "quotes", "reminders"
  - 인사이트: 필수 기능 확인

- **디자인/경험**
  - 키워드: "cute", "beautiful", "simple", "easy", "intuitive", "calming"
  - 인사이트: 심미성과 사용성

- **실제 도움**
  - 키워드: "anxiety", "depression", "stress", "mental health", "better"
  - 인사이트: 실질적 효과 증명

### Phase 2: 주제별 심층 분석

#### 2.1 Mental Health 특화 분석
```python
mental_health_keywords = {
    "conditions": ["anxiety", "depression", "stress", "panic", "trauma", "bipolar"],
    "therapy": ["therapist", "counselor", "therapy", "counseling", "treatment"],
    "symptoms": ["mood", "emotion", "feeling", "crisis", "breakdown"],
    "improvement": ["better", "helped", "improved", "relief", "calm", "peace"]
}
```

**질문**:
- 어떤 mental health 문제를 가진 사람들이 앱을 사용하는가?
- 어떤 기능이 실제로 도움이 되었다고 언급되는가?
- 부정적 경험은 mental health에 어떤 영향을 주었는가?

#### 2.2 기능별 만족도 분석
```python
features = {
    "journaling": ["journal", "diary", "write", "entry", "story"],
    "mood_tracking": ["mood", "emotion", "feeling", "track"],
    "meditation": ["meditate", "meditation", "mindfulness", "breathing"],
    "community": ["community", "share", "social", "connect"],
    "reminders": ["reminder", "notification", "alert"],
    "analytics": ["statistics", "stats", "graph", "chart", "insights"],
    "customization": ["customize", "theme", "color", "personalize"]
}
```

**분석**:
- 각 기능별로 긍정/부정 언급 비율
- 기능 조합의 효과 (어떤 기능들이 함께 언급되는가?)

#### 2.3 사용자 여정 분석
```python
journey_stages = {
    "onboarding": ["first", "started", "downloaded", "setup", "account"],
    "daily_use": ["everyday", "daily", "routine", "habit"],
    "long_term": ["months", "years", "since", "always"],
    "churn": ["quit", "deleted", "uninstall", "stop using"]
}
```

**질문**:
- 초기 사용자가 겪는 문제는?
- 장기 사용자가 가치있게 여기는 것은?
- 이탈하게 만드는 결정적 요인은?

### Phase 3: Comparative Analysis

#### 3.1 앱별 비교
상위 앱들의 차별화 포인트:
- **Headspace**: 명상/마음챙김 중심
- **Daylio**: 간단한 기분 추적
- **7 Cups**: 사회적 지원
- **Woebot**: AI 대화형 치료

**분석**: Reflecta의 포지셔닝 전략

#### 3.2 시간대별 트렌드
```python
# 리뷰 날짜 분석
- 2018-2020: 초기 mental health 앱 시장
- 2020-2022: 팬데믹 시기 (수요 급증)
- 2022-2024: 성숙기 (높아진 기대치)
```

### Phase 4: Reflecta 적용 인사이트

#### 4.1 Must-Have Features (from 5-star reviews)
- [ ] 안정적인 데이터 저장/백업
- [ ] 간단하고 직관적인 UI
- [ ] 선택적/유연한 입력 방식
- [ ] 시각적으로 calming한 디자인
- [ ] 개인정보 보호

#### 4.2 Must-Avoid Problems (from 1-2 star reviews)
- [ ] 데이터 손실
- [ ] 복잡한 온보딩
- [ ] 강제 질문/단계
- [ ] 과도한 Premium 페이월
- [ ] 계정 관리 어려움

#### 4.3 Differentiation Opportunities (from 3-star reviews)
- [ ] 오프라인 모드
- [ ] 강력한 검색 기능
- [ ] 캘린더/리스트 뷰
- [ ] 이미지 다중 선택
- [ ] 커스텀 이모션/태그

## 구체적 분석 코드 구조

### 1. 데이터 전처리
```python
# 별점별 그룹화
low_rating = df[df['rating'] <= 2]  # 불만족
mid_rating = df[df['rating'] == 3]   # 중립
high_rating = df[df['rating'] >= 4]  # 만족
```

### 2. 키워드 추출 및 빈도 분석
```python
# TF-IDF for distinctive keywords per rating group
# N-gram analysis for common phrases
# Co-occurrence analysis for feature relationships
```

### 3. 감정 분석
```python
# Sentiment intensity per rating
# Emotion classification (joy, sadness, anger, fear, surprise)
# Aspect-based sentiment (feature-level sentiment)
```

### 4. 주제 모델링
```python
# LDA/BERTopic for theme extraction
# Topic evolution over time
# Topic differences across ratings
```

### 5. 인과 관계 분석
```python
# What features → high satisfaction?
# What problems → churn?
# What combination → best retention?
```

## 예상 Deliverables

1. **Pain Point Report**
   - Top 10 reasons for 1-2 star ratings
   - Critical bugs to avoid
   - UX anti-patterns

2. **Feature Prioritization Matrix**
   - Must-have features (high mention + high satisfaction)
   - Nice-to-have features
   - Avoid features (high cost, low value)

3. **User Persona Insights**
   - Who uses mental health apps?
   - What are their goals?
   - What are their pain points?

4. **Competitive Positioning Map**
   - Where does each app succeed/fail?
   - White space opportunities for Reflecta

5. **Design Guidelines**
   - Tone & voice (from positive reviews)
   - Visual style preferences
   - Interaction patterns that work

## Next Steps

1. Implement automated analysis pipeline
2. Generate rating-stratified reports
3. Extract top insights per category
4. Create actionable recommendations for Reflecta
5. Build interactive dashboard for exploration
