const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { Client } = require('pg');



const STATE_FILE = path.resolve(__dirname, 'scrape-progress.json');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'Odoo',
  user: 'postgres',
  password: 'Pratham@1sql',
  connectionTimeoutMillis: 10000,
  query_timeout: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 0
};

const CLI_ARGS = process.argv.slice(2);
const RESET_PROGRESS = CLI_ARGS.includes('--reset') || CLI_ARGS.includes('--no-resume');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Operation failed (attempt ${i + 1}/${maxRetries}): ${error.message}`);
      if (i < maxRetries - 1) {
        await sleep(delay * (i + 1));
      } else {
        throw error;
      }
    }
  }
}

function loadProgress() {
  try {
    if (!fs.existsSync(STATE_FILE)) return null;
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (error) {
    console.warn(`Unable to read progress file: ${error.message}`);
    return null;
  }
}

function saveProgress(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    console.warn(`Unable to save progress file: ${error.message}`);
  }
}

function clearProgress() {
  try {
    if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
  } catch (error) {
    console.warn(`Unable to clear progress file: ${error.message}`);
  }
}

function countryFromUrl(url) {
  try {
    const parsed = new URL(url);
    const segment = parsed.pathname.replace(/\/+$/, '').split('/').pop();
    const slug = segment.replace(/-\d+$/, '');
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch (error) {
    return '';
  }
}

async function scrapePage(page, country, sourceUrl) {
  await page.waitForSelector('div.col-md-4.col-xl-3.col-12.mb-4', { timeout: 15000 });

  const rows = await page.$$eval('div.col-md-4.col-xl-3.col-12.mb-4', (cards) => {
    return cards.map((card) => {
      const nameEl = card.querySelector('h5.card-title');
      const infoEl = card.querySelector('small.o_wcrm_short_description.text-muted.overflow-hidden');
      const imageEl = card.querySelector('img');
      const rawName = nameEl ? nameEl.textContent.trim() : '';
      let location = '';
      let website = '';
      let countryFromCard = '';
      const otherParts = [];

      if (infoEl) {
        const rawHtml = infoEl.innerHTML || '';
        const lines = rawHtml
          .split(/<br\s*\/?>/i)
          .map((line) => line.replace(/&nbsp;/g, ' ').trim())
          .filter(Boolean);

        for (const line of lines) {
          const normalized = line.replace(/\r?\n/g, ' ').trim();
          if (normalized.startsWith('Location:')) {
            location = normalized.slice('Location:'.length).trim();
          } else if (normalized.startsWith('Website:')) {
            website = normalized.slice('Website:'.length).trim();
          } else if (normalized.startsWith('Country:')) {
            countryFromCard = normalized.slice('Country:'.length).trim();
          } else if (/^Description:/i.test(normalized)) {
            continue;
          } else if (normalized) {
            otherParts.push(normalized);
          }
        }
      }

      const industryEl = card.querySelector('a.badge.mt-3.text-bg-secondary') || card.querySelector('a.badge');
      const industry = industryEl ? industryEl.textContent.trim() : '';
      const other_data_raw = otherParts.join(' | ');
      const other_data = other_data_raw ? { details: other_data_raw } : null;
      const logo_url = imageEl ? imageEl.src.trim() : '';

      return {
        name: rawName,
        location,
        website,
        industry,
        countryFromCard,
        other_data,
        logo_url,
      };
    });
  });

  return rows.map((row) => ({
    ...row,
    country: row.countryFromCard || country,
    source_url: sourceUrl,
  }));
}

async function getNextPageUrl(page, currentPageNum) {
  return page.evaluate((pageNum) => {
    const makeAbsolute = (href) => {
      try {
        return new URL(href, document.baseURI).href;
      } catch {
        return null;
      }
    };

    // Strategy 1: Look for explicit "next" button
    const nextAnchor = document.querySelector('a[rel="next"], a[aria-label="Next"], a.next, a[title="Next"], a.page-link[rel="next"]');
    if (nextAnchor?.getAttribute('href')) {
      return makeAbsolute(nextAnchor.getAttribute('href'));
    }

    // Strategy 2: Find current active page and look for numerically next page button
    const pagination = document.querySelector('.pagination, nav[aria-label*="Pagination"], div[role="navigation"]');
    if (pagination) {
      const allPageLinks = Array.from(pagination.querySelectorAll('a')).filter(a => {
        const href = a.getAttribute('href') || '';
        const text = a.textContent.trim();
        return /\/page\/(\d+)/.test(href) || /^\d+$/.test(text);
      });

      // Find the link for the next page number
      const nextPageLink = allPageLinks.find(a => {
        const href = a.getAttribute('href') || '';
        const text = a.textContent.trim();
        const nextPageNum = String(pageNum + 1);
        return href.includes(`/page/${nextPageNum}`) || text === nextPageNum;
      });

      if (nextPageLink) {
        return makeAbsolute(nextPageLink.getAttribute('href'));
      }

      // If no next page button found, check if current page is disabled/inactive
      const currentPageLink = allPageLinks.find(a => {
        const text = a.textContent.trim();
        return text === String(pageNum);
      });

      if (currentPageLink) {
        const parent = currentPageLink.closest('li');
        if (parent && (parent.classList.contains('active') || parent.classList.contains('disabled'))) {
          // Current page is the active/last one, no next page
          return null;
        }
      }
    }

    // Strategy 3: If still no next page found, we've reached the end
    return null;
  }, currentPageNum);
}

function normalizeUrl(url) {
  return url.replace(/\/+$/, '');
}

function buildPageUrl(baseUrl, pageNumber) {
  const normalized = normalizeUrl(baseUrl);
  return pageNumber > 1 ? `${normalized}/page/${pageNumber}` : normalized;
}

async function runScraper() {
  if (!Array.isArray(COUNTRY_URLS) || COUNTRY_URLS.length === 0) {
    throw new Error('COUNTRY_URLS is empty. Please populate the URL list in scraper.js.');
  }

  const client = new Client(DB_CONFIG);
  await retryOperation(() => client.connect());
  console.log('Connected to PostgreSQL database.');

  const urls = COUNTRY_URLS;
  const resumeState = RESET_PROGRESS ? null : loadProgress();
  let resumeIndex = 0;
  let resumePage = 1;

  if (resumeState) {
    resumeIndex = Number.isInteger(resumeState.countryIndex) && resumeState.countryIndex >= 0 && resumeState.countryIndex < urls.length ? resumeState.countryIndex : 0;
    resumePage = Number.isInteger(resumeState.page) && resumeState.page > 0 ? resumeState.page : 1;
    if (resumeIndex !== resumeState.countryIndex || resumePage !== resumeState.page) {
      console.log('Invalid saved progress detected; starting from the first country and page.');
      resumeIndex = 0;
      resumePage = 1;
    } else {
      console.log(`Resuming from saved progress: countryIndex=${resumeIndex} page=${resumePage}`);
    }
  }

  if (RESET_PROGRESS) {
    console.log('Reset flag detected. Clearing saved progress and starting from the first country/page.');
    resumeIndex = 0;
    resumePage = 1;
    clearProgress();
  }

  