import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';

class ReviewAnalyzer {
  constructor(dataPath) {
    this.dataPath = dataPath;
    this.reviews = [];
    this.locationInfo = null;
  }

  async loadData() {
    console.log(`Loading data from ${this.dataPath}...`);

    const ext = path.extname(this.dataPath);

    if (ext === '.json') {
      const content = await fs.readFile(this.dataPath, 'utf-8');
      const data = JSON.parse(content);
      this.reviews = data.reviews;
      this.locationInfo = data.location;
    } else if (ext === '.csv') {
      const content = await fs.readFile(this.dataPath, 'utf-8');
      this.reviews = parse(content, {
        columns: true,
        skip_empty_lines: true
      });
    } else {
      throw new Error('Unsupported file format. Use .json or .csv');
    }

    console.log(`Loaded ${this.reviews.length} reviews\n`);
  }

  getRatingDistribution() {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    this.reviews.forEach(review => {
      const rating = Math.round(parseFloat(review.rating));
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
      }
    });

    return distribution;
  }

  getAverageRating() {
    const validRatings = this.reviews
      .map(r => parseFloat(r.rating))
      .filter(r => !isNaN(r));

    if (validRatings.length === 0) return 0;

    const sum = validRatings.reduce((acc, r) => acc + r, 0);
    return sum / validRatings.length;
  }

  getTextLengthStats() {
    const lengths = this.reviews.map(r => parseInt(r.textLength) || r.text?.length || 0);

    lengths.sort((a, b) => a - b);

    const sum = lengths.reduce((acc, len) => acc + len, 0);
    const avg = sum / lengths.length;
    const median = lengths[Math.floor(lengths.length / 2)];
    const min = lengths[0];
    const max = lengths[lengths.length - 1];

    return { avg, median, min, max };
  }

  getSentimentIndicators() {
    // Simple keyword-based sentiment analysis
    const positiveKeywords = [
      'excellent', 'great', 'wonderful', 'amazing', 'helpful', 'caring',
      'supportive', 'professional', 'understanding', 'compassionate',
      'friendly', 'kind', 'patient', 'effective', 'recommend'
    ];

    const negativeKeywords = [
      'terrible', 'awful', 'horrible', 'poor', 'bad', 'worst',
      'unprofessional', 'rude', 'dismissive', 'unhelpful', 'waiting',
      'disappointed', 'frustrated', 'waste', 'never'
    ];

    const mentalHealthKeywords = [
      'anxiety', 'depression', 'stress', 'therapy', 'therapist',
      'counselor', 'counseling', 'mental health', 'crisis', 'medication',
      'diagnosis', 'treatment', 'session', 'appointment'
    ];

    let positiveCount = 0;
    let negativeCount = 0;
    let mentalHealthMentions = 0;

    this.reviews.forEach(review => {
      const text = (review.text || '').toLowerCase();

      positiveKeywords.forEach(keyword => {
        if (text.includes(keyword)) positiveCount++;
      });

      negativeKeywords.forEach(keyword => {
        if (text.includes(keyword)) negativeCount++;
      });

      mentalHealthKeywords.forEach(keyword => {
        if (text.includes(keyword)) mentalHealthMentions++;
      });
    });

    return {
      positiveKeywordCount: positiveCount,
      negativeKeywordCount: negativeCount,
      mentalHealthMentions,
      sentimentRatio: positiveCount / (negativeCount || 1)
    };
  }

  getCommonThemes() {
    // Extract common words/phrases (simple frequency analysis)
    const wordFrequency = {};
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
      'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you',
      'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its',
      'our', 'their', 'me', 'him', 'them', 'us'
    ]);

    this.reviews.forEach(review => {
      const text = (review.text || '').toLowerCase();
      const words = text.match(/\b\w+\b/g) || [];

      words.forEach(word => {
        if (word.length > 3 && !stopWords.has(word)) {
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
      });
    });

    // Sort by frequency and get top 20
    const sorted = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    return sorted.map(([word, count]) => ({ word, count }));
  }

  getReviewsByRating(rating) {
    return this.reviews.filter(r => Math.round(parseFloat(r.rating)) === rating);
  }

  generateReport() {
    console.log('='.repeat(60));
    console.log('REVIEW ANALYSIS REPORT');
    console.log('='.repeat(60));

    if (this.locationInfo) {
      console.log(`\nLocation: ${this.locationInfo.name}`);
      console.log(`Overall Rating: ${this.locationInfo.rating}`);
    }

    console.log(`\nTotal Reviews Analyzed: ${this.reviews.length}`);
    console.log(`Average Rating: ${this.getAverageRating().toFixed(2)}`);

    console.log('\n--- Rating Distribution ---');
    const distribution = this.getRatingDistribution();
    for (let i = 5; i >= 1; i--) {
      const count = distribution[i];
      const percentage = ((count / this.reviews.length) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(count / 2));
      console.log(`${i} star: ${bar} ${count} (${percentage}%)`);
    }

    console.log('\n--- Text Length Statistics ---');
    const textStats = this.getTextLengthStats();
    console.log(`Average: ${textStats.avg.toFixed(0)} characters`);
    console.log(`Median: ${textStats.median} characters`);
    console.log(`Range: ${textStats.min} - ${textStats.max} characters`);

    console.log('\n--- Sentiment Indicators ---');
    const sentiment = this.getSentimentIndicators();
    console.log(`Positive keywords found: ${sentiment.positiveKeywordCount}`);
    console.log(`Negative keywords found: ${sentiment.negativeKeywordCount}`);
    console.log(`Sentiment ratio: ${sentiment.sentimentRatio.toFixed(2)}`);
    console.log(`Mental health mentions: ${sentiment.mentalHealthMentions}`);

    console.log('\n--- Most Common Words ---');
    const themes = this.getCommonThemes();
    themes.slice(0, 15).forEach(({ word, count }, index) => {
      console.log(`${index + 1}. ${word}: ${count}`);
    });

    console.log('\n--- Sample Reviews ---');
    console.log('\nHighest Rated (5 stars):');
    const fiveStarReviews = this.getReviewsByRating(5).slice(0, 2);
    fiveStarReviews.forEach((review, i) => {
      console.log(`\n[${i + 1}] ${review.name} - ${review.date}`);
      console.log(`"${review.text.slice(0, 200)}${review.text.length > 200 ? '...' : ''}"`);
    });

    console.log('\n\nLowest Rated (1-2 stars):');
    const lowRatedReviews = [...this.getReviewsByRating(1), ...this.getReviewsByRating(2)].slice(0, 2);
    lowRatedReviews.forEach((review, i) => {
      console.log(`\n[${i + 1}] ${review.name} - ${review.date} (${review.rating} stars)`);
      console.log(`"${review.text.slice(0, 200)}${review.text.length > 200 ? '...' : ''}"`);
    });

    console.log('\n' + '='.repeat(60));
  }

  async exportAnalysis(outputPath) {
    const analysis = {
      summary: {
        totalReviews: this.reviews.length,
        averageRating: this.getAverageRating(),
        ratingDistribution: this.getRatingDistribution(),
        textLengthStats: this.getTextLengthStats()
      },
      sentiment: this.getSentimentIndicators(),
      commonWords: this.getCommonThemes(),
      location: this.locationInfo
    };

    await fs.writeFile(outputPath, JSON.stringify(analysis, null, 2));
    console.log(`\nAnalysis exported to ${outputPath}`);
  }
}

// Main execution
async function main() {
  const dataPath = process.argv[2];

  if (!dataPath) {
    console.error('Error: Please provide a data file path');
    console.error('Usage: npm run analyze <path-to-json-or-csv>');
    process.exit(1);
  }

  try {
    const analyzer = new ReviewAnalyzer(dataPath);
    await analyzer.loadData();
    analyzer.generateReport();

    // Export analysis
    const outputPath = dataPath.replace(/\.(json|csv)$/, '_analysis.json');
    await analyzer.exportAnalysis(outputPath);

  } catch (error) {
    console.error('Error during analysis:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default ReviewAnalyzer;
