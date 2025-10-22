import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import dotenv from 'dotenv';

dotenv.config();

class GoogleMapsReviewScraper {
  constructor(url, options = {}) {
    this.url = url;
    this.maxReviews = options.maxReviews || parseInt(process.env.MAX_REVIEWS) || 100;
    this.outputDir = options.outputDir || process.env.OUTPUT_DIR || './data';
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    console.log('Initializing browser...');
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();

    // Set viewport and user agent
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    });
  }

  async navigateToReviews() {
    console.log(`Navigating to ${this.url}...`);
    await this.page.goto(this.url, { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for page to load
    await this.page.waitForTimeout(3000);

    // Click on reviews tab if needed
    try {
      const reviewsButton = await this.page.locator('button[aria-label*="Reviews"]').first();
      if (await reviewsButton.isVisible({ timeout: 5000 })) {
        await reviewsButton.click();
        await this.page.waitForTimeout(2000);
      }
    } catch (error) {
      console.log('Reviews tab not found or already on reviews');
    }
  }

  async scrollReviews() {
    console.log('Scrolling to load reviews...');

    // Find the scrollable reviews container
    const reviewsContainer = await this.page.locator('[role="feed"]').first();

    let previousHeight = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 50;

    while (scrollAttempts < maxScrollAttempts) {
      // Scroll to bottom of reviews container
      await reviewsContainer.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      await this.page.waitForTimeout(1500);

      // Check if we've loaded enough reviews
      const reviewCount = await this.page.locator('[data-review-id]').count();
      console.log(`Loaded ${reviewCount} reviews...`);

      if (reviewCount >= this.maxReviews) {
        console.log(`Reached target of ${this.maxReviews} reviews`);
        break;
      }

      // Check if scroll position changed
      const currentHeight = await reviewsContainer.evaluate(el => el.scrollHeight);
      if (currentHeight === previousHeight) {
        console.log('No more reviews to load');
        break;
      }

      previousHeight = currentHeight;
      scrollAttempts++;
    }
  }

  async expandReviews() {
    console.log('Expanding "More" buttons in reviews...');

    const moreButtons = await this.page.locator('button[aria-label*="More"]').all();
    console.log(`Found ${moreButtons.length} "More" buttons`);

    for (let i = 0; i < Math.min(moreButtons.length, this.maxReviews); i++) {
      try {
        await moreButtons[i].click();
        await this.page.waitForTimeout(200);
      } catch (error) {
        // Button might not be clickable anymore
      }
    }
  }

  async extractReviews() {
    console.log('Extracting review data...');

    const reviews = await this.page.evaluate(() => {
      const reviewElements = document.querySelectorAll('[data-review-id]');
      const extractedReviews = [];

      reviewElements.forEach((element) => {
        try {
          // Extract reviewer name
          const nameElement = element.querySelector('[class*="d4r55"]');
          const name = nameElement ? nameElement.textContent.trim() : 'Anonymous';

          // Extract rating
          const ratingElement = element.querySelector('[role="img"][aria-label*="star"]');
          const ratingText = ratingElement ? ratingElement.getAttribute('aria-label') : '';
          const rating = ratingText.match(/(\d+(\.\d+)?)\s*star/)?.[1] || 'N/A';

          // Extract review text
          const textElement = element.querySelector('[class*="wiI7pd"]');
          const text = textElement ? textElement.textContent.trim() : '';

          // Extract date
          const dateElement = element.querySelector('[class*="rsqaWe"]');
          const date = dateElement ? dateElement.textContent.trim() : '';

          // Extract review ID
          const reviewId = element.getAttribute('data-review-id');

          extractedReviews.push({
            reviewId,
            name,
            rating: parseFloat(rating) || null,
            date,
            text,
            textLength: text.length
          });
        } catch (error) {
          console.error('Error extracting review:', error);
        }
      });

      return extractedReviews;
    });

    console.log(`Extracted ${reviews.length} reviews`);
    return reviews.slice(0, this.maxReviews);
  }

  async getLocationInfo() {
    console.log('Extracting location information...');

    return await this.page.evaluate(() => {
      // Extract location name
      const nameElement = document.querySelector('h1[class*="DUwDvf"]');
      const name = nameElement ? nameElement.textContent.trim() : 'Unknown Location';

      // Extract rating
      const ratingElement = document.querySelector('[class*="F7nice"] span[aria-hidden="true"]');
      const rating = ratingElement ? ratingElement.textContent.trim() : 'N/A';

      // Extract total reviews count
      const reviewCountElement = document.querySelector('[class*="F7nice"] span[aria-label*="reviews"]');
      const reviewCount = reviewCountElement ? reviewCountElement.getAttribute('aria-label') : 'N/A';

      return {
        name,
        rating,
        totalReviews: reviewCount
      };
    });
  }

  async saveToJSON(reviews, locationInfo) {
    await fs.mkdir(this.outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `reviews_${timestamp}.json`;
    const filepath = path.join(this.outputDir, filename);

    const data = {
      location: locationInfo,
      url: this.url,
      scrapedAt: new Date().toISOString(),
      totalReviews: reviews.length,
      reviews
    };

    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    console.log(`Saved to ${filepath}`);

    return filepath;
  }

  async saveToCSV(reviews, locationInfo) {
    await fs.mkdir(this.outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `reviews_${timestamp}.csv`;
    const filepath = path.join(this.outputDir, filename);

    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'reviewId', title: 'Review ID' },
        { id: 'name', title: 'Reviewer Name' },
        { id: 'rating', title: 'Rating' },
        { id: 'date', title: 'Date' },
        { id: 'text', title: 'Review Text' },
        { id: 'textLength', title: 'Text Length' }
      ]
    });

    await csvWriter.writeRecords(reviews);
    console.log(`Saved to ${filepath}`);

    return filepath;
  }

  async scrape() {
    try {
      await this.initialize();
      await this.navigateToReviews();
      await this.scrollReviews();
      await this.expandReviews();

      const locationInfo = await this.getLocationInfo();
      const reviews = await this.extractReviews();

      console.log('\n=== Scraping Summary ===');
      console.log(`Location: ${locationInfo.name}`);
      console.log(`Overall Rating: ${locationInfo.rating}`);
      console.log(`Total Reviews Scraped: ${reviews.length}`);
      console.log('========================\n');

      // Save in both formats
      const jsonPath = await this.saveToJSON(reviews, locationInfo);
      const csvPath = await this.saveToCSV(reviews, locationInfo);

      return {
        locationInfo,
        reviews,
        files: { json: jsonPath, csv: csvPath }
      };

    } catch (error) {
      console.error('Error during scraping:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Main execution
async function main() {
  const url = process.argv[2] || process.env.GOOGLE_MAPS_URLS;

  if (!url) {
    console.error('Error: Please provide a Google Maps URL');
    console.error('Usage: npm run scrape <google-maps-url>');
    console.error('Or set GOOGLE_MAPS_URLS in .env file');
    process.exit(1);
  }

  const scraper = new GoogleMapsReviewScraper(url);
  await scraper.scrape();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default GoogleMapsReviewScraper;
