/**
 * SEO Metadata Generator
 * Generates dynamic meta tags and structured data for RTech Solutions
 */

const seoConfig = require('./seo-config');

class SEOMetadataGenerator {
  /**
   * Generate meta tags for a page
   */
  static generateMetaTags(pageKey, customData = {}) {
    const pageData = seoConfig.pages[pageKey] || seoConfig.defaults;
    const merged = { ...pageData, ...customData };

    return `
    <!-- Meta Tags for SEO -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${merged.description}">
    <meta name="keywords" content="${merged.keywords}">
    <meta name="robots" content="${seoConfig.robots}">
    <meta name="author" content="RTech Solutions">
    <meta name="language" content="${seoConfig.site.language}">
    <meta name="revisit-after" content="7 days">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${seoConfig.site.domain}${merged.path || '/'}">
    
    <!-- Alternate Links for Multi-language -->
    <link rel="alternate" hreflang="en-US" href="https://www.rTechLearners.com">
    <link rel="alternate" hreflang="en-IN" href="https://www.rTechLearners.com/en-in">
    <link rel="alternate" hreflang="hi-IN" href="https://www.rTechLearners.com/hi-in">
    <link rel="alternate" hreflang="x-default" href="https://www.rTechLearners.com">
    
    <!-- Open Graph Tags for Social Media -->
    <meta property="og:type" content="${seoConfig.openGraph.type}">
    <meta property="og:url" content="${seoConfig.site.domain}${merged.path || '/'}">
    <meta property="og:title" content="${merged.title}">
    <meta property="og:description" content="${merged.description}">
    <meta property="og:image" content="${merged.image || seoConfig.defaults.image}">
    <meta property="og:image:width" content="${seoConfig.defaults.imageWidth}">
    <meta property="og:image:height" content="${seoConfig.defaults.imageHeight}">
    <meta property="og:image:type" content="${seoConfig.defaults.imageType}">
    <meta property="og:site_name" content="${seoConfig.openGraph.siteTitle}">
    <meta property="og:locale" content="${seoConfig.openGraph.locale}">
    
    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="${seoConfig.twitter.card}">
    <meta name="twitter:site" content="${seoConfig.twitter.site}">
    <meta name="twitter:creator" content="${seoConfig.twitter.creator}">
    <meta name="twitter:title" content="${seoConfig.twitter.title}">
    <meta name="twitter:description" content="${seoConfig.twitter.description}">
    <meta name="twitter:image" content="${seoConfig.defaults.image}">
    
    <!-- Additional SEO Tags -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
    <meta name="theme-color" content="#0056b3">
    
    <!-- Preconnect to external resources -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdn.rTechLearners.com">
    <link rel="preconnect" href="https://www.google-analytics.com">
    <link rel="dns-prefetch" href="https://www.googletagmanager.com">
    
    <!-- Preload critical resources -->
    <link rel="preload" as="font" href="https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;600;700&display=swap" crossorigin>
    `;
  }

  /**
   * Generate JSON-LD structured data
   */
  static generateJSONLD(type = 'organization') {
    const schemas = {
      organization: seoConfig.schema.organization,
      course: seoConfig.schema.course
    };

    return `
    <script type="application/ld+json">
      ${JSON.stringify(schemas[type] || schemas.organization, null, 2)}
    </script>
    `;
  }

  /**
   * Generate breadcrumb JSON-LD
   */
  static generateBreadcrumbs(breadcrumbArray) {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbArray.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };

    return `
    <script type="application/ld+json">
      ${JSON.stringify(breadcrumbSchema, null, 2)}
    </script>
    `;
  }

  /**
   * Generate Google Analytics tracking code
   */
  static generateGoogleAnalytics(measurementId) {
    return `
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', {
        'page_path': window.location.pathname,
        'anonymize_ip': true,
        'allow_google_signals': true,
        'allow_ad_personalization_signals': true
      });
    </script>
    `;
  }

  /**
   * Generate Google Tag Manager code
   */
  static generateGoogleTagManager(containerId) {
    return `
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${containerId}');</script>
    <!-- End Google Tag Manager -->
    `;
  }

  /**
   * Generate robots.txt content
   */
  static generateRobotsTxt() {
    return `
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/
Disallow: /api/
Crawl-delay: 2

User-agent: Googlebot
Crawl-delay: 1

Sitemap: https://www.rTechLearners.com/sitemap.xml
    `;
  }

  /**
   * Generate security headers
   */
  static generateSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    };
  }

  /**
   * Generate sitemap entry
   */
  static generateSitemapEntry(loc, lastmod = new Date().toISOString().split('T')[0], changefreq = 'monthly', priority = 0.8) {
    return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
    `;
  }
}

module.exports = SEOMetadataGenerator;
