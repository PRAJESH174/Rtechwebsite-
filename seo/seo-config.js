/**
 * SEO Configuration for RTech Solutions
 * Centralized SEO settings and meta information
 */

const seoConfig = {
  // Site-wide settings
  site: {
    name: 'RTech Solutions',
    domain: 'https://www.rTechLearners.com',
    canonicalUrl: 'https://www.rTechLearners.com',
    language: 'en-US',
    alternateLanguages: ['en-IN', 'hi-IN'],
    type: 'Organization'
  },

  // Default meta tags
  defaults: {
    title: 'RTech Solutions - Microsoft Dynamics 365, Power Platform & Azure Training',
    description: 'Expert consulting, live training, and self-paced learning for Dynamics 365, Power Platform, Azure, and Microsoft 365. Elevate your skills with RTech Solutions courses.',
    keywords: 'Dynamics 365, Power Platform, Azure, Microsoft 365, training, courses, consulting, RTech Solutions, Microsoft Dynamics, cloud training',
    image: 'https://cdn.rTechLearners.com/og-image.jpg',
    imageWidth: 1200,
    imageHeight: 630,
    imageType: 'image/jpeg'
  },

  // Pages configuration
  pages: {
    home: {
      title: 'RTech Solutions - Microsoft Dynamics 365, Power Platform & Azure Training',
      description: 'Expert consulting, live training, and self-paced learning for Dynamics 365, Power Platform, Azure, and Microsoft 365.',
      keywords: 'Dynamics 365, Power Platform, Azure, Microsoft 365, training, courses',
      path: '/',
      priority: 1.0,
      changefreq: 'weekly'
    },
    courses: {
      title: 'Professional Courses - RTech Solutions',
      description: 'Learn Microsoft technologies through our comprehensive courses on Dynamics 365, Power Platform, Azure, and Microsoft 365.',
      keywords: 'training courses, Dynamics 365 courses, Power Platform training, Azure certification',
      path: '/courses',
      priority: 0.9,
      changefreq: 'monthly'
    },
    blog: {
      title: 'Blog - RTech Solutions',
      description: 'Latest insights, tips, and tutorials on Microsoft Dynamics 365, Power Platform, and Azure.',
      keywords: 'blog, tutorials, Microsoft Dynamics, Power Platform articles',
      path: '/blog',
      priority: 0.8,
      changefreq: 'weekly'
    },
    videos: {
      title: 'Video Tutorials - RTech Solutions',
      description: 'Watch our collection of video tutorials on Microsoft technologies and certifications.',
      keywords: 'video tutorials, training videos, Microsoft Dynamics videos',
      path: '/videos',
      priority: 0.8,
      changefreq: 'weekly'
    },
    about: {
      title: 'About RTech Solutions',
      description: 'Learn about RTech Solutions, your trusted partner in Microsoft cloud technology training and consulting.',
      keywords: 'about us, company information, RTech Solutions',
      path: '/about',
      priority: 0.7,
      changefreq: 'yearly'
    },
    contact: {
      title: 'Contact RTech Solutions',
      description: 'Get in touch with RTech Solutions for training inquiries, consulting services, or support.',
      keywords: 'contact us, support, inquiries',
      path: '/contact',
      priority: 0.7,
      changefreq: 'yearly'
    }
  },

  // Specific course pages
  courses: {
    dynamics365: {
      title: 'Microsoft Dynamics 365 Training - RTech Solutions',
      description: 'Comprehensive Dynamics 365 training covering Sales, Customer Service, Field Service, and more.',
      keywords: 'Dynamics 365 training, Dynamics 365 certification, CRM training',
      path: '/courses/dynamics-365',
      priority: 0.8
    },
    powerplatform: {
      title: 'Power Platform Training - Power Apps, Power BI & Power Automate',
      description: 'Learn Power Apps, Power BI, Power Automate, and Power Virtual Agents from industry experts.',
      keywords: 'Power Platform training, Power Apps training, Power BI training, Power Automate',
      path: '/courses/power-platform',
      priority: 0.8
    },
    azure: {
      title: 'Microsoft Azure Training & Certification - RTech Solutions',
      description: 'Master Azure cloud services, architecture, and DevOps with hands-on training.',
      keywords: 'Azure training, Azure certification, cloud computing, AZ-900, AZ-104',
      path: '/courses/azure',
      priority: 0.8
    },
    microsoft365: {
      title: 'Microsoft 365 Training - RTech Solutions',
      description: 'Comprehensive Microsoft 365 training including Teams, SharePoint, and modern workplace solutions.',
      keywords: 'Microsoft 365 training, Teams training, SharePoint training',
      path: '/courses/microsoft-365',
      priority: 0.8
    }
  },

  // Open Graph tags
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteTitle: 'RTech Solutions - Microsoft Training & Consulting',
    siteDescription: 'Expert training and consulting for Microsoft Dynamics 365, Power Platform, and Azure'
  },

  // Twitter Card configuration
  twitter: {
    card: 'summary_large_image',
    site: '@rTechLearners',
    creator: '@rTechLearners',
    title: 'RTech Solutions - Microsoft Training',
    description: 'Expert training for Dynamics 365, Power Platform, and Azure'
  },

  // Schema.org structured data
  schema: {
    organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'RTech Solutions',
      url: 'https://www.rTechLearners.com',
      logo: 'https://cdn.rTechLearners.com/logo.png',
      description: 'Expert consulting and training for Microsoft technologies',
      foundingDate: '2020',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        telephone: '+91-XXXXXXXXXX',
        email: 'info@rtechlearners.com'
      },
      sameAs: [
        'https://www.facebook.com/rTechLearners',
        'https://twitter.com/rTechLearners',
        'https://www.linkedin.com/company/rtech-solutions',
        'https://www.instagram.com/rtechlearners',
        'https://www.youtube.com/@rTechLearners'
      ]
    },
    course: {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: 'Microsoft Dynamics 365 & Power Platform Training',
      description: 'Comprehensive training on Microsoft Dynamics 365 and Power Platform',
      provider: {
        '@type': 'Organization',
        name: 'RTech Solutions'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '250'
      }
    }
  },

  // Robots meta tags
  robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',

  // Canonical URL strategy
  canonical: {
    preferWWW: true,
    preferHTTPS: true
  },

  // Hreflang configuration for multi-language
  hreflang: {
    en_us: 'https://www.rTechLearners.com',
    en_in: 'https://www.rTechLearners.com/en-in',
    hi_in: 'https://www.rTechLearners.com/hi-in'
  },

  // Social media configuration
  socialMedia: {
    facebook: {
      appId: '1234567890',
      pageUrl: 'https://www.facebook.com/rTechLearners'
    },
    twitter: {
      handle: '@rTechLearners'
    },
    linkedin: {
      companyUrl: 'https://www.linkedin.com/company/rtech-solutions'
    },
    instagram: {
      handle: '@rtechlearners'
    },
    youtube: {
      channelUrl: 'https://www.youtube.com/@rTechLearners'
    }
  },

  // Breadcrumb navigation
  breadcrumbs: {
    enabled: true,
    schema: 'https://schema.org/BreadcrumbList'
  },

  // JSON-LD configuration
  jsonLd: {
    enabled: true,
    includeOrganization: true,
    includeBreadcrumbs: true,
    includeSchema: true
  }
};

module.exports = seoConfig;
