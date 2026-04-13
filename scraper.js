const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { Client } = require('pg');

const COUNTRY_URLS = [
  "https://www.odoo.com/customers/country/afghanistan-3",
  // "https://www.odoo.com/customers/country/united-states-224",
  // "https://www.odoo.com/customers/country/india-101",
  // "https://www.odoo.com/customers/country/united-arab-emirates-2",
  // "https://www.odoo.com/customers/country/united-kingdom-222",
  "https://www.odoo.com/customers/country/albania-6",
  "https://www.odoo.com/customers/country/algeria-61",
  "https://www.odoo.com/customers/country/american-samoa-12",
  "https://www.odoo.com/customers/country/andorra-1",
  "https://www.odoo.com/customers/country/angola-9",
  "https://www.odoo.com/customers/country/anguilla-5",
  "https://www.odoo.com/customers/country/antigua-and-barbuda-4",
  "https://www.odoo.com/customers/country/argentina-11",
  "https://www.odoo.com/customers/country/armenia-7",
  "https://www.odoo.com/customers/country/aruba-15",
  "https://www.odoo.com/customers/country/australia-14",
  "https://www.odoo.com/customers/country/austria-13",
  "https://www.odoo.com/customers/country/azerbaijan-16",
  "https://www.odoo.com/customers/country/bahamas-30",
  "https://www.odoo.com/customers/country/bahrain-23",
  "https://www.odoo.com/customers/country/bangladesh-19",
  "https://www.odoo.com/customers/country/barbados-18",
  "https://www.odoo.com/customers/country/belarus-34",
  "https://www.odoo.com/customers/country/belgium-20",
  "https://www.odoo.com/customers/country/belize-35",
  "https://www.odoo.com/customers/country/benin-25",
  "https://www.odoo.com/customers/country/bermuda-26",
  "https://www.odoo.com/customers/country/bhutan-31",
  "https://www.odoo.com/customers/country/bolivia-28",
  "https://www.odoo.com/customers/country/bonaire-sint-eustatius-and-saba-251",
  "https://www.odoo.com/customers/country/bosnia-and-herzegovina-17",
  "https://www.odoo.com/customers/country/botswana-33",
  "https://www.odoo.com/customers/country/brazil-29",
  "https://www.odoo.com/customers/country/brunei-darussalam-27",
  "https://www.odoo.com/customers/country/bulgaria-22",
  "https://www.odoo.com/customers/country/burkina-faso-21",
  "https://www.odoo.com/customers/country/burundi-24",
  "https://www.odoo.com/customers/country/cambodia-112",
  "https://www.odoo.com/customers/country/cameroon-45",
  "https://www.odoo.com/customers/country/canada-36",
  "https://www.odoo.com/customers/country/cape-verde-52",
  "https://www.odoo.com/customers/country/cayman-islands-119",
  "https://www.odoo.com/customers/country/central-african-republic-38",
  "https://www.odoo.com/customers/country/chad-205",
  "https://www.odoo.com/customers/country/chile-44",
  "https://www.odoo.com/customers/country/china-46",
  "https://www.odoo.com/customers/country/colombia-47",
  "https://www.odoo.com/customers/country/comoros-114",
  "https://www.odoo.com/customers/country/congo-40",
  "https://www.odoo.com/customers/country/cook-islands-43",
  "https://www.odoo.com/customers/country/costa-rica-48",
  "https://www.odoo.com/customers/country/croatia-95",
  "https://www.odoo.com/customers/country/curacao-252",
  "https://www.odoo.com/customers/country/cyprus-54",
  "https://www.odoo.com/customers/country/czech-republic-55",
  "https://www.odoo.com/customers/country/cote-divoire-42",
  "https://www.odoo.com/customers/country/democratic-republic-of-the-congo-39",
  "https://www.odoo.com/customers/country/denmark-58",
  "https://www.odoo.com/customers/country/djibouti-57",
  "https://www.odoo.com/customers/country/dominica-59",
  "https://www.odoo.com/customers/country/dominican-republic-60",
  "https://www.odoo.com/customers/country/ecuador-62",
  "https://www.odoo.com/customers/country/egypt-64",
  "https://www.odoo.com/customers/country/el-salvador-201",
  "https://www.odoo.com/customers/country/equatorial-guinea-85",
  "https://www.odoo.com/customers/country/eritrea-66",
  "https://www.odoo.com/customers/country/estonia-63",
  "https://www.odoo.com/customers/country/ethiopia-68",
  "https://www.odoo.com/customers/country/fiji-70",
  "https://www.odoo.com/customers/country/finland-69",
  "https://www.odoo.com/customers/country/france-74",
  "https://www.odoo.com/customers/country/french-guiana-78",
  "https://www.odoo.com/customers/country/french-polynesia-169",
  "https://www.odoo.com/customers/country/gabon-75",
  "https://www.odoo.com/customers/country/gambia-82",
  "https://www.odoo.com/customers/country/georgia-77",
  "https://www.odoo.com/customers/country/germany-56",
  "https://www.odoo.com/customers/country/ghana-79",
  "https://www.odoo.com/customers/country/gibraltar-80",
  "https://www.odoo.com/customers/country/greece-86",
  "https://www.odoo.com/customers/country/grenada-76",
  "https://www.odoo.com/customers/country/guadeloupe-84",
  "https://www.odoo.com/customers/country/guam-89",
  "https://www.odoo.com/customers/country/guatemala-88",
  "https://www.odoo.com/customers/country/guernsey-253",
  "https://www.odoo.com/customers/country/guinea-83",
  "https://www.odoo.com/customers/country/guinea-bissau-90",
  "https://www.odoo.com/customers/country/guyana-91",
  "https://www.odoo.com/customers/country/haiti-96",
  "https://www.odoo.com/customers/country/honduras-94",
  "https://www.odoo.com/customers/country/hong-kong-92",
  "https://www.odoo.com/customers/country/hungary-97",
  "https://www.odoo.com/customers/country/iceland-105",
  
  "https://www.odoo.com/customers/country/indonesia-98",
  "https://www.odoo.com/customers/country/iran-104",
  "https://www.odoo.com/customers/country/iraq-103",
  "https://www.odoo.com/customers/country/ireland-99",
  "https://www.odoo.com/customers/country/israel-100",
  "https://www.odoo.com/customers/country/italy-106",
  "https://www.odoo.com/customers/country/jamaica-107",
  "https://www.odoo.com/customers/country/japan-109",
  "https://www.odoo.com/customers/country/jordan-108",
  "https://www.odoo.com/customers/country/kazakhstan-120",
  "https://www.odoo.com/customers/country/kenya-110",
  "https://www.odoo.com/customers/country/kosovo-315",
  "https://www.odoo.com/customers/country/kuwait-118",
  "https://www.odoo.com/customers/country/kyrgyzstan-111",
  "https://www.odoo.com/customers/country/laos-121",
  "https://www.odoo.com/customers/country/latvia-130",
  "https://www.odoo.com/customers/country/lebanon-122",
  "https://www.odoo.com/customers/country/lesotho-127",
  "https://www.odoo.com/customers/country/liberia-126",
  "https://www.odoo.com/customers/country/libya-131",
  "https://www.odoo.com/customers/country/liechtenstein-124",
  "https://www.odoo.com/customers/country/lithuania-128",
  "https://www.odoo.com/customers/country/luxembourg-129",
  "https://www.odoo.com/customers/country/macau-141",
  "https://www.odoo.com/customers/country/madagascar-135",
  "https://www.odoo.com/customers/country/malawi-149",
  "https://www.odoo.com/customers/country/malaysia-151",
  "https://www.odoo.com/customers/country/maldives-148",
  "https://www.odoo.com/customers/country/mali-138",
  "https://www.odoo.com/customers/country/malta-146",
  "https://www.odoo.com/customers/country/marshall-islands-136",
  "https://www.odoo.com/customers/country/martinique-143",
  "https://www.odoo.com/customers/country/mauritania-144",
  "https://www.odoo.com/customers/country/mauritius-147",
  "https://www.odoo.com/customers/country/mayotte-237",
  "https://www.odoo.com/customers/country/mexico-150",
  "https://www.odoo.com/customers/country/monaco-133",
  "https://www.odoo.com/customers/country/mongolia-140",
  "https://www.odoo.com/customers/country/montenegro-50",
  "https://www.odoo.com/customers/country/morocco-132",
  "https://www.odoo.com/customers/country/mozambique-152",
  "https://www.odoo.com/customers/country/myanmar-139",
  "https://www.odoo.com/customers/country/namibia-153",
  "https://www.odoo.com/customers/country/nepal-161",
  "https://www.odoo.com/customers/country/netherlands-159",
  "https://www.odoo.com/customers/country/netherlands-antilles-8",
  "https://www.odoo.com/customers/country/new-caledonia-154",
  "https://www.odoo.com/customers/country/new-zealand-165",
  "https://www.odoo.com/customers/country/nicaragua-158",
  "https://www.odoo.com/customers/country/niger-155",
  "https://www.odoo.com/customers/country/nigeria-157",
  "https://www.odoo.com/customers/country/north-macedonia-137",
  "https://www.odoo.com/customers/country/northern-ireland-332",
  "https://www.odoo.com/customers/country/northern-mariana-islands-142",
  "https://www.odoo.com/customers/country/norway-160",
  "https://www.odoo.com/customers/country/oman-166",
  "https://www.odoo.com/customers/country/pakistan-172",
  "https://www.odoo.com/customers/country/panama-167",
  "https://www.odoo.com/customers/country/papua-new-guinea-170",
  "https://www.odoo.com/customers/country/paraguay-179",
  "https://www.odoo.com/customers/country/peru-168",
  "https://www.odoo.com/customers/country/philippines-171",
  "https://www.odoo.com/customers/country/poland-173",
  "https://www.odoo.com/customers/country/portugal-177",
  "https://www.odoo.com/customers/country/puerto-rico-176",
  "https://www.odoo.com/customers/country/qatar-180",
  "https://www.odoo.com/customers/country/republic-of-moldova-134",
  "https://www.odoo.com/customers/country/romania-182",
  "https://www.odoo.com/customers/country/russian-federation-183",
  "https://www.odoo.com/customers/country/rwanda-184",
  "https://www.odoo.com/customers/country/reunion-181",
  "https://www.odoo.com/customers/country/saint-barthelemy-250",
  "https://www.odoo.com/customers/country/saint-kitts-and-nevis-115",
  "https://www.odoo.com/customers/country/saint-lucia-123",
  "https://www.odoo.com/customers/country/saint-martin-french-part-256",
  "https://www.odoo.com/customers/country/saint-vincent-and-the-grenadines-228",
  "https://www.odoo.com/customers/country/san-marino-196",
  "https://www.odoo.com/customers/country/saudi-arabia-185",
  "https://www.odoo.com/customers/country/senegal-197",
  "https://www.odoo.com/customers/country/serbia-49",
  "https://www.odoo.com/customers/country/seychelles-187",
  "https://www.odoo.com/customers/country/sierra-leone-195",
  "https://www.odoo.com/customers/country/singapore-190",
  "https://www.odoo.com/customers/country/sint-maarten-dutch-part-259",
  "https://www.odoo.com/customers/country/slovakia-194",
  "https://www.odoo.com/customers/country/slovenia-192",
  "https://www.odoo.com/customers/country/solomon-islands-186",
  "https://www.odoo.com/customers/country/somalia-198",
  "https://www.odoo.com/customers/country/somaliland-318",
  "https://www.odoo.com/customers/country/south-africa-239",
  "https://www.odoo.com/customers/country/south-korea-117",
  "https://www.odoo.com/customers/country/south-sudan-258",
  "https://www.odoo.com/customers/country/spain-67",
  "https://www.odoo.com/customers/country/sri-lanka-125",
  "https://www.odoo.com/customers/country/state-of-palestine-257",
  "https://www.odoo.com/customers/country/sudan-188",
  "https://www.odoo.com/customers/country/suriname-199",
  "https://www.odoo.com/customers/country/sweden-189",
  "https://www.odoo.com/customers/country/switzerland-41",
  "https://www.odoo.com/customers/country/syria-202",
  "https://www.odoo.com/customers/country/taiwan-218",
  "https://www.odoo.com/customers/country/tajikistan-209",
  "https://www.odoo.com/customers/country/tanzania-219",
  "https://www.odoo.com/customers/country/thailand-208",
  "https://www.odoo.com/customers/country/togo-207",
  "https://www.odoo.com/customers/country/trinidad-and-tobago-216",
  "https://www.odoo.com/customers/country/tunisia-212",
  "https://www.odoo.com/customers/country/turkmenistan-211",
  "https://www.odoo.com/customers/country/turks-and-caicos-islands-204",
  "https://www.odoo.com/customers/country/turkiye-215",
  "https://www.odoo.com/customers/country/uganda-221",
  "https://www.odoo.com/customers/country/ukraine-220",

  
  "https://www.odoo.com/customers/country/uruguay-225",
  "https://www.odoo.com/customers/country/uzbekistan-226",
  "https://www.odoo.com/customers/country/vanuatu-233",
  "https://www.odoo.com/customers/country/venezuela-229",
  "https://www.odoo.com/customers/country/vietnam-232",
  "https://www.odoo.com/customers/country/virgin-islands-british-230",
  "https://www.odoo.com/customers/country/virgin-islands-usa-231",
  "https://www.odoo.com/customers/country/yemen-236",
  "https://www.odoo.com/customers/country/zambia-240",
  "https://www.odoo.com/customers/country/zimbabwe-242"
];

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



  