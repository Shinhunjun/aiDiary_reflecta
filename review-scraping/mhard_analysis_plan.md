# MHARD Dataset Analysis Plan: Reflecta Insights Extraction

## Objective
Analyze actual user experiences from mental health apps to derive insights for Reflecta design

## Analysis Strategy

### Phase 1: Text Analysis by Rating

#### 1.1 Pain Point Analysis (1-2 star reviews)
**Purpose**: Identify critical issues that cause users to abandon the app

**Analysis Items**:
- **Data Loss Related**
  - Keywords: "deleted", "lost", "disappeared", "gone", "missing"
  - Insight: Importance of data backup/synchronization

- **Technical Issues**
  - Keywords: "crash", "bug", "glitch", "freeze", "broken", "not working"
  - Insight: Stability is paramount

- **UX Barriers**
  - Keywords: "complicated", "confusing", "too many steps", "forced", "required"
  - Insight: Simple and optional UX

- **Privacy Concerns**
  - Keywords: "privacy", "data", "account", "delete account", "password"
  - Insight: Clear data policies, easy account management

#### 1.2 Improvement Requirements Analysis (3 star reviews)
**Purpose**: Identify "good but lacking" aspects

**Analysis Items**:
- **Expensive Premium**
  - Keywords: "premium", "paid", "expensive", "free"
  - Insight: Appropriate free/paid feature balance

- **Missing Features**
  - Keywords: "wish", "would be nice", "missing", "add", "feature request"
  - Insight: High-priority features

- **UI/UX Inconvenience**
  - Keywords: "difficult to", "hard to find", "cannot", "no option"
  - Insight: Usability improvement points

#### 1.3 Success Factor Analysis (4-5 star reviews)
**Purpose**: Identify core values that satisfy users

**Analysis Items**:
- **Emotional Connection**
  - Keywords: "love", "amazing", "life-changing", "helped me", "grateful"
  - Insight: Importance of emotional support

- **Core Features**
  - Keywords: "mood tracking", "journaling", "meditation", "quotes", "reminders"
  - Insight: Essential feature confirmation

- **Design/Experience**
  - Keywords: "cute", "beautiful", "simple", "easy", "intuitive", "calming"
  - Insight: Aesthetics and usability

- **Actual Help**
  - Keywords: "anxiety", "depression", "stress", "mental health", "better"
  - Insight: Proof of real effectiveness

### Phase 2: In-depth Analysis by Topic

#### 2.1 Mental Health Specialized Analysis
```python
mental_health_keywords = {
    "conditions": ["anxiety", "depression", "stress", "panic", "trauma", "bipolar"],
    "therapy": ["therapist", "counselor", "therapy", "counseling", "treatment"],
    "symptoms": ["mood", "emotion", "feeling", "crisis", "breakdown"],
    "improvement": ["better", "helped", "improved", "relief", "calm", "peace"]
}
```

**Questions**:
- What mental health issues do app users have?
- What features are mentioned as actually helpful?
- How do negative experiences affect mental health?

#### 2.2 Feature Satisfaction Analysis
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

**Analysis**:
- Positive/negative mention ratio for each feature
- Feature combination effects (which features are mentioned together?)

#### 2.3 User Journey Analysis
```python
journey_stages = {
    "onboarding": ["first", "started", "downloaded", "setup", "account"],
    "daily_use": ["everyday", "daily", "routine", "habit"],
    "long_term": ["months", "years", "since", "always"],
    "churn": ["quit", "deleted", "uninstall", "stop using"]
}
```

**Questions**:
- What problems do new users encounter?
- What do long-term users value?
- What are the decisive factors for churn?

### Phase 3: Comparative Analysis

#### 3.1 App Comparison
Differentiation points of top apps:
- **Headspace**: Meditation/mindfulness focused
- **Daylio**: Simple mood tracking
- **7 Cups**: Social support
- **Woebot**: AI conversational therapy

**Analysis**: Positioning strategy for Reflecta

#### 3.2 Temporal Trends
```python
# Review date analysis
- 2018-2020: Early mental health app market
- 2020-2022: Pandemic period (demand surge)
- 2022-2024: Maturity phase (heightened expectations)
```

### Phase 4: Reflecta Application Insights

#### 4.1 Must-Have Features (from 5-star reviews)
- [ ] Stable data storage/backup
- [ ] Simple and intuitive UI
- [ ] Optional/flexible input methods
- [ ] Visually calming design
- [ ] Privacy protection

#### 4.2 Must-Avoid Problems (from 1-2 star reviews)
- [ ] Data loss
- [ ] Complex onboarding
- [ ] Forced questions/steps
- [ ] Excessive premium paywalls
- [ ] Difficult account management

#### 4.3 Differentiation Opportunities (from 3-star reviews)
- [ ] Offline mode
- [ ] Powerful search functionality
- [ ] Calendar/list view
- [ ] Multiple image selection
- [ ] Custom emotions/tags

## Specific Analysis Code Structure

### 1. Data Preprocessing
```python
# Group by rating
low_rating = df[df['rating'] <= 2]  # Dissatisfied
mid_rating = df[df['rating'] == 3]   # Neutral
high_rating = df[df['rating'] >= 4]  # Satisfied
```

### 2. Keyword Extraction and Frequency Analysis
```python
# TF-IDF for distinctive keywords per rating group
# N-gram analysis for common phrases
# Co-occurrence analysis for feature relationships
```

### 3. Sentiment Analysis
```python
# Sentiment intensity per rating
# Emotion classification (joy, sadness, anger, fear, surprise)
# Aspect-based sentiment (feature-level sentiment)
```

### 4. Topic Modeling
```python
# LDA/BERTopic for theme extraction
# Topic evolution over time
# Topic differences across ratings
```

### 5. Causal Relationship Analysis
```python
# What features → high satisfaction?
# What problems → churn?
# What combination → best retention?
```

## Expected Deliverables

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
