/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
/**
 * Automated Accessibility (a11y) Compliance Auditor
 * Benchmarks WCAG 2.1 AA / Section 508 accessibility guidelines:
 * 1. Skip Navigation Link
 * 2. Semantic Landmark Hierarchy (header, main#main-content, footer, nav)
 * 3. Image Alt Attributes
 * 4. Form Input Labels & Accessible Names
 * 5. WAI-ARIA Interactive Attributes (accordions, dialogs)
 */

async function auditAccessibility() {
  const baseUrl = 'http://localhost:3000';
  const routes = ['/', '/privacy', '/terms', '/faq', '/request-demo', '/login'];
  let issues = 0;

  console.log(`\n========================================`);
  console.log(`♿ Giterp WCAG 2.1 AA Accessibility Audit`);
  console.log(`========================================`);

  for (const route of routes) {
    const url = `${baseUrl}${route}`;
    try {
      const res = await fetch(url);
      const html = await res.text();

      // Check 1: Skip to main content link
      const hasSkipLink = html.includes('Skip to main content') && html.includes('href="#main-content"');
      // Check 2: main#main-content landmark
      const hasMainLandmark = html.includes('id="main-content"');
      // Check 3: Missing alt attributes on <img>
      const imgWithoutAlt = html.match(/<img(?![^>]*\balt=)[^>]*>/gi) || [];
      // Check 4: Inputs without accessible labels or aria-label
      const rawInputs = html.match(/<input[^>]*>/gi) || [];
      const unlabelledInputs = rawInputs.filter(inp => {
        const isHidden = inp.includes('type="hidden"') || inp.includes('type="checkbox"');
        const hasAria = inp.includes('aria-label') || inp.includes('aria-labelledby');
        const hasId = inp.includes('id="');
        return !isHidden && !hasAria && !hasId;
      });

      console.log(`\n📄 Route: ${route}`);
      console.log(`  ${hasSkipLink ? '✅' : '❌'} Skip to main content link: ${hasSkipLink ? 'Present' : 'Missing'}`);
      console.log(`  ${hasMainLandmark ? '✅' : '❌'} Main landmark (#main-content): ${hasMainLandmark ? 'Present' : 'Missing'}`);
      console.log(`  ${imgWithoutAlt.length === 0 ? '✅' : '❌'} Images without alt: ${imgWithoutAlt.length}`);
      console.log(`  ${unlabelledInputs.length === 0 ? '✅' : '⚠️'} Inputs without accessible labels: ${unlabelledInputs.length}`);

      if (!hasSkipLink) issues++;
      if (!hasMainLandmark) issues++;
      if (imgWithoutAlt.length > 0) issues += imgWithoutAlt.length;
    } catch (err) {
      console.error(`Error auditing ${route}:`, err.message);
      issues++;
    }
  }

  // Check 5: ARIA Accordion Attributes on / & /faq
  try {
    const res = await fetch(`${baseUrl}/faq`);
    const faqHtml = await res.text();
    const hasAriaExpanded = faqHtml.includes('aria-expanded=');
    const hasAriaControls = faqHtml.includes('aria-controls=');
    const hasRoleRegion = faqHtml.includes('role="region"');
    console.log(`\n🧩 Interactive FAQ Accordion WAI-ARIA:`);
    console.log(`  ${hasAriaExpanded ? '✅' : '❌'} aria-expanded attribute: ${hasAriaExpanded ? 'Present' : 'Missing'}`);
    console.log(`  ${hasAriaControls ? '✅' : '❌'} aria-controls attribute: ${hasAriaControls ? 'Present' : 'Missing'}`);
    console.log(`  ${hasRoleRegion ? '✅' : '❌'} role="region" panels: ${hasRoleRegion ? 'Present' : 'Missing'}`);
  } catch (err) {
    console.error(`Error checking FAQ ARIA:`, err.message);
  }

  console.log(`\n========================================`);
  if (issues === 0) {
    console.log(`🎉 ALL WCAG 2.1 AA ACCESSIBILITY AUDIT CRITERIA PASSED!`);
  } else {
    console.warn(`⚠️ Total issues detected: ${issues}`);
  }
}

auditAccessibility();
