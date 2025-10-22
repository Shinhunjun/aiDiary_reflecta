# Mental Health Counseling Center Review Scraper

A Google Maps review scraper and text analysis tool. Collects and analyzes reviews from university mental health counseling centers to prepare datasets.

## Features

- **Review Scraping**: Automatically collect reviews from Google Maps
- **Data Storage**: Save in JSON and CSV formats
- **Text Analysis**:
  - Rating distribution
  - Sentiment analysis (keyword-based)
  - Extract frequently used words/topics
  - Text length statistics
- **MHARD Dataset Analysis**: Analyze 200K+ mental health app reviews
  - Pain point analysis by rating
  - Feature satisfaction analysis
  - Insights extraction for Reflecta design

## Installation

```bash
npm install
```

Install Playwright browsers:
```bash
npx playwright install chromium
```

## Environment Setup

Create a `.env` file and add the following:

```bash
# Google Maps URL (optional - can be specified via command line)
GOOGLE_MAPS_URLS=https://www.google.com/maps/place/...

# Maximum number of reviews to collect (default: 100)
MAX_REVIEWS=100

# Output directory (default: ./data)
OUTPUT_DIR=./data
```

## Usage

### 1. Find Google Maps URL

1. Search for the desired counseling center on Google Maps
2. Copy the URL of the location page
   - Example: `https://www.google.com/maps/place/...`

### 2. Scrape Reviews

```bash
# Method 1: Provide URL directly
npm run scrape "https://www.google.com/maps/place/..."

# Method 2: Use URL from .env file
npm run scrape
```

### 3. Analyze Data

```bash
# Analyze JSON file
npm run analyze ./data/reviews_2024-01-01T12-00-00.json

# Analyze CSV file
npm run analyze ./data/reviews_2024-01-01T12-00-00.csv
```

### 4. Full Pipeline (Scraping + Analysis)

```bash
npm start full "https://www.google.com/maps/place/..."
```

### 5. MHARD Dataset Analysis (Reflecta Insights)

```bash
# Python required (pandas installation needed)
pip install pandas

# Run MHARD dataset analysis
npm run analyze:mhard

# Or run directly
python3 src/mhard_analyzer.py
```

This analysis provides:
- 🚨 Critical Pain Points (from 1-2 star reviews)
- ✨ Feature Satisfaction Analysis (satisfaction by feature)
- 💚 Mental Health Context (mental health-related mentions)
- 🎯 Specific recommendations for Reflecta

## Output Files

After scraping, the following files are created in the `data/` directory:

1. **reviews_[timestamp].json** - Raw review data (JSON)
2. **reviews_[timestamp].csv** - Raw review data (CSV)
3. **reviews_[timestamp]_analysis.json** - Analysis results

### JSON Data Structure

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

## Analysis Report Example

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

## Precautions

1. **Legal Compliance**: Follow Google's Terms of Service
2. **Rate Limiting**: Appropriate delays are included to avoid excessive requests
3. **Data Privacy**: Use collected data for research purposes only

## Troubleshooting

### Reviews Not Loading
- Check internet connection
- Verify URL is correct
- Try reducing `MAX_REVIEWS` value

### Playwright Errors
```bash
# Reinstall browsers
npx playwright install --force chromium
```

## Data Utilization

Collected data can be used for various text analyses:

- Sentiment Analysis
- Topic Modeling
- Keyword Extraction
- User Experience Pattern Analysis
- NLP Model Training Data

## License

MIT License
