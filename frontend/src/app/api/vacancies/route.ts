import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'Frontend';
  const page = searchParams.get('page') || '1';

  // Map our categories to site-specific keywords/categories
  const djinniKwMap: Record<string, string> = {
    "Frontend": "Frontend",
    "Backend": "Backend",
    "Full Stack": "Fullstack",
    "DevOps": "DevOps",
    "QA": "QA",
    "Mobile": "Mobile",
    "Project Manager": "Project Manager",
    "UI/UX Designer": "Design",
    "Data Analyst": "Data Science"
  };

  const douCatMap: Record<string, string> = {
    "Frontend": "Front End",
    "Backend": "Back End",
    "Full Stack": "Full Stack",
    "DevOps": "DevOps",
    "QA": "QA",
    "Mobile": "Mobile",
    "Project Manager": "Project Manager",
    "UI/UX Designer": "Design",
    "Data Analyst": "Data Science"
  };

  const dKw = djinniKwMap[category] || category;
  const dCat = douCatMap[category] || category;

  const results: any[] = [];
  let idCounter = 1;

  try {
    // 1. Fetch Djinni
    const djinniUrl = `https://djinni.co/jobs/?primary_keyword=${encodeURIComponent(dKw)}&page=${page}`;
    console.log("Fetching Djinni:", djinniUrl);
    
    // We send a normal user agent so we don't get blocked
    const djinniRes = await fetch(djinniUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    if (djinniRes.ok) {
      const html = await djinniRes.text();
      let parsedSuccessfully = false;

      // Djinni usually embeds JobPosting structured data in a script tag
      const jsonMatch = html.match(/<script type="application\/ld\+json">[\s\S]*?(\[[\s\S]*?"@type":\s*"JobPosting"[\s\S]*?\])[\s\S]*?<\/script>/);
      
      if (jsonMatch && jsonMatch[1]) {
        try {
          // Attempt to parse JSON, it might fail if Djinni puts unescaped characters in descriptions
          const jobsData = JSON.parse(jsonMatch[1]);
          for (const job of jobsData.slice(0, 10)) {
            if (job['@type'] !== 'JobPosting') continue;
            
            let desc = job.description || "";
            desc = desc.replace(/<[^>]*>?/gm, ''); // remove HTML tags
            desc = desc.substring(0, 200) + "...";

            results.push({
              id: idCounter++,
              company: job.hiringOrganization?.name || "Djinni Company",
              logo: null,
              initial: (job.hiringOrganization?.name || "D").charAt(0).toUpperCase(),
              logoBg: "#6c5ce7",
              role: job.title || "Job Title",
              location: "Remote",
              desc: desc,
              inTracker: false,
              link: job.url || djinniUrl
            });
          }
          parsedSuccessfully = true;
        } catch (e) {
          console.error("Failed to parse Djinni JSON-LD, falling back to HTML parsing.");
        }
      } 
      
      if (!parsedSuccessfully) {
        // Fallback to cheerio parsing for Djinni
        const $ = cheerio.load(html);
        $('.list-jobs__item').slice(0, 10).each((i, el) => {
          const titleEl = $(el).find('.job-list-item__link');
          const title = titleEl.text().trim();
          const link = 'https://djinni.co' + (titleEl.attr('href') || '');
          const company = $(el).find('header a.mr-2').text().trim() || $(el).find('header a').first().text().trim() || "Company";
          const desc = $(el).find('.job-list-item__description span').text().trim().substring(0, 200) + "...";
          
          if (title) {
            results.push({
              id: idCounter++,
              company: company,
              logo: null,
              initial: company.charAt(0).toUpperCase(),
              logoBg: "#6c5ce7",
              role: title,
              location: "Remote",
              desc: desc,
              inTracker: false,
              link: link
            });
          }
        });
      }
    }
  } catch (err) {
    console.error("Djinni fetch error:", err);
  }

  try {
    // 2. Fetch DOU
    const douUrl = `https://jobs.dou.ua/vacancies/?category=${encodeURIComponent(dCat)}&page=${page}`;
    console.log("Fetching DOU:", douUrl);
    
    const douRes = await fetch(douUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    if (douRes.ok) {
      const html = await douRes.text();
      const $ = cheerio.load(html);

      $('.l-vacancy').slice(0, 10).each((i, el) => {
        const titleEl = $(el).find('.vt');
        const title = titleEl.text().trim();
        const link = titleEl.attr('href');
        const company = $(el).find('.company').text().trim().replace(/\\u00A0/g, ' ').replace('&nbsp;', ' ');
        const location = $(el).find('.cities').text().trim() || "Remote";
        const desc = $(el).find('.sh-info').text().trim().substring(0, 200) + "...";

        if (title && link) {
          results.push({
            id: idCounter++,
            company: company,
            logo: null,
            initial: company.charAt(0).toUpperCase(),
            logoBg: "#0ea5e9", // DOU blueish
            role: title,
            location: location,
            desc: desc,
            inTracker: false,
            link: link
          });
        }
      });
    }
  } catch (err) {
    console.error("DOU fetch error:", err);
  }

  // Shuffle or interleave results so it's a mix of Djinni and DOU
  const shuffled = results.sort(() => 0.5 - Math.random());

  return NextResponse.json({ vacancies: shuffled });
}
