import GoogleMapsReviewScraper from './scraper.js';
import ReviewAnalyzer from './analyzer.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    console.log(`
Mental Health Counseling Center Review Scraper
===============================================

Commands:
  scrape <url>     - Scrape reviews from a Google Maps URL
  analyze <file>   - Analyze scraped review data
  full <url>       - Scrape and analyze in one command

Examples:
  npm start scrape "https://www.google.com/maps/place/..."
  npm start analyze ./data/reviews_2024-01-01.json
  npm start full "https://www.google.com/maps/place/..."

Environment variables (.env):
  GOOGLE_MAPS_URLS - Default Google Maps URL to scrape
  MAX_REVIEWS      - Maximum number of reviews to scrape (default: 100)
  OUTPUT_DIR       - Output directory for data files (default: ./data)
    `);
    return;
  }

  try {
    switch (command) {
      case 'scrape': {
        const url = args[1] || process.env.GOOGLE_MAPS_URLS;
        if (!url) {
          console.error('Error: Please provide a Google Maps URL');
          process.exit(1);
        }

        console.log('Starting scraping process...\n');
        const scraper = new GoogleMapsReviewScraper(url);
        const result = await scraper.scrape();
        console.log('\nScraping completed successfully!');
        console.log(`JSON: ${result.files.json}`);
        console.log(`CSV: ${result.files.csv}`);
        break;
      }

      case 'analyze': {
        const dataPath = args[1];
        if (!dataPath) {
          console.error('Error: Please provide a data file path');
          process.exit(1);
        }

        console.log('Starting analysis...\n');
        const analyzer = new ReviewAnalyzer(dataPath);
        await analyzer.loadData();
        analyzer.generateReport();

        const outputPath = dataPath.replace(/\.(json|csv)$/, '_analysis.json');
        await analyzer.exportAnalysis(outputPath);
        break;
      }

      case 'full': {
        const url = args[1] || process.env.GOOGLE_MAPS_URLS;
        if (!url) {
          console.error('Error: Please provide a Google Maps URL');
          process.exit(1);
        }

        console.log('Starting full pipeline (scrape + analyze)...\n');

        // Step 1: Scrape
        console.log('STEP 1: SCRAPING');
        console.log('='.repeat(60));
        const scraper = new GoogleMapsReviewScraper(url);
        const result = await scraper.scrape();

        // Step 2: Analyze
        console.log('\n\nSTEP 2: ANALYSIS');
        console.log('='.repeat(60));
        const analyzer = new ReviewAnalyzer(result.files.json);
        await analyzer.loadData();
        analyzer.generateReport();

        const outputPath = result.files.json.replace('.json', '_analysis.json');
        await analyzer.exportAnalysis(outputPath);

        console.log('\n\nFull pipeline completed successfully!');
        console.log(`\nGenerated files:`);
        console.log(`- Raw data (JSON): ${result.files.json}`);
        console.log(`- Raw data (CSV): ${result.files.csv}`);
        console.log(`- Analysis: ${outputPath}`);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.error('Run "npm start help" for usage information');
        process.exit(1);
    }

  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
