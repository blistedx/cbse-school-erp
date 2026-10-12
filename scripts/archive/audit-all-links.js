/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
/**
 * Comprehensive Link Checker & Health Auditor
 * Crawls all internal links across Giterp public pages and validates HTTP status codes.
 */

async function crawlLinks() {
  const baseUrl = 'http://localhost:3000';
  const startPages = ['/', '/privacy', '/terms', '/faq', '/request-demo', '/login'];
  const visitedPages = new Set();
  const testedLinks = new Map(); // url -> status
  const brokenLinks = [];

  for (const pagePath of startPages) {
    if (visitedPages.has(pagePath)) continue;
    visitedPages.add(pagePath);

    const pageUrl = `${baseUrl}${pagePath}`;
    try {
      const res = await fetch(pageUrl);
      if (res.status >= 400) {
        brokenLinks.push({ source: 'startPages', target: pagePath, status: res.status });
        continue;
      }
      const html = await res.text();

      // Extract href values
      const hrefRegex = /href=["']([^"']+)["']/g;
      let match;

      while ((match = hrefRegex.exec(html)) !== null) {
        const href = match[1];

        // Skip non-HTTP links like mailto:, tel:, javascript:
        if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
          continue;
        }

        // Handle Anchor on current page
        if (href.startsWith('#')) {
          const anchorId = href.slice(1);
          if (anchorId !== 'top') {
            const hasId = html.includes(`id="${anchorId}"`) || html.includes(`id='${anchorId}'`);
            if (!hasId) {
              brokenLinks.push({ source: pagePath, target: href, reason: `Anchor #${anchorId} not found in DOM` });
            }
          }
          continue;
        }

        // Internal relative link
        if (href.startsWith('/')) {
          if (!testedLinks.has(href)) {
            try {
              // Strip hash before testing HTTP
              const cleanPath = href.split('#')[0];
              const testUrl = `${baseUrl}${cleanPath}`;
              const linkRes = await fetch(testUrl);
              testedLinks.set(href, linkRes.status);

              if (linkRes.status >= 400) {
                brokenLinks.push({ source: pagePath, target: href, status: linkRes.status });
              }
            } catch (err) {
              brokenLinks.push({ source: pagePath, target: href, error: err.message });
            }
          } else if (testedLinks.get(href) >= 400) {
            brokenLinks.push({ source: pagePath, target: href, status: testedLinks.get(href) });
          }
        }
      }
    } catch (err) {
      brokenLinks.push({ source: 'network', target: pageUrl, error: err.message });
    }
  }

  console.log(`\n========================================`);
  console.log(`🔗 Giterp Link Crawler Audit Report`);
  console.log(`========================================`);
  console.log(`Pages Crawled: ${visitedPages.size}`);
  console.log(`Unique Internal Links Tested: ${testedLinks.size}`);
  console.log(`Tested Links Map:`);
  for (const [link, status] of testedLinks.entries()) {
    console.log(`  ${status === 200 ? '✅' : '❌'} ${link} -> HTTP ${status}`);
  }

  if (brokenLinks.length === 0) {
    console.log(`\n🎉 ZERO BROKEN LINKS! All internal paths and anchors resolved successfully.`);
  } else {
    console.log(`\n⚠️ Found ${brokenLinks.length} broken links:`);
    console.table(brokenLinks);
  }
}

crawlLinks();
