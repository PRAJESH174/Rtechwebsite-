/**
 * Google Analytics Configuration for RTech Solutions
 * Sets up analytics tracking, events, and conversions
 */

const googleAnalyticsConfig = {
  // Measurement ID (GA4)
  measurementId: process.env.GOOGLE_ANALYTICS_ID || 'G-XXXXXXXXXX',

  // Google Tag Manager Container ID (optional)
  gtmContainerId: process.env.GTM_CONTAINER_ID || 'GTM-XXXXXXX',

  // Configuration settings
  config: {
    anonymize_ip: true,
    allow_google_signals: true,
    allow_ad_personalization_signals: true,
    cookie_flags: 'SameSite=None;Secure'
  },

  // Custom events
  events: {
    // User engagement
    page_view: {
      name: 'page_view',
      description: 'Page viewed'
    },
    
    // Course interactions
    course_viewed: {
      name: 'view_item',
      category: 'course',
      description: 'User viewed a course'
    },
    
    course_enrolled: {
      name: 'add_to_cart',
      category: 'course',
      description: 'User enrolled in a course'
    },

    // Video interactions
    video_played: {
      name: 'video_start',
      category: 'video',
      description: 'User started playing a video'
    },

    video_completed: {
      name: 'video_complete',
      category: 'video',
      description: 'User completed watching a video'
    },

    // Payment events
    add_payment_info: {
      name: 'add_payment_info',
      category: 'payment',
      description: 'User entered payment information'
    },

    purchase: {
      name: 'purchase',
      category: 'payment',
      description: 'User completed a purchase'
    },

    refund: {
      name: 'refund',
      category: 'payment',
      description: 'Transaction was refunded'
    },

    // Form interactions
    form_submit: {
      name: 'form_submit',
      category: 'engagement',
      description: 'User submitted a form'
    },

    // Signup/Login
    sign_up: {
      name: 'sign_up',
      category: 'engagement',
      description: 'User signed up'
    },

    login: {
      name: 'login',
      category: 'engagement',
      description: 'User logged in'
    },

    // Content interactions
    post_viewed: {
      name: 'view_item',
      category: 'content',
      description: 'User viewed a blog post'
    },

    post_shared: {
      name: 'share',
      category: 'content',
      description: 'User shared content'
    },

    // Search
    search: {
      name: 'search',
      category: 'engagement',
      description: 'User performed a search'
    },

    // Error tracking
    error: {
      name: 'exception',
      category: 'error',
      description: 'An error occurred'
    }
  },

  // Conversion goals
  conversions: {
    purchase: {
      id: 'purchase',
      value: 'total_price',
      currency: 'INR'
    },
    sign_up: {
      id: 'sign_up',
      value: null
    },
    first_course_enrollment: {
      id: 'first_course_enrollment',
      value: 'course_price'
    }
  },

  // Custom dimensions
  customDimensions: {
    user_type: {
      index: 1,
      name: 'User Type'
    },
    user_plan: {
      index: 2,
      name: 'User Plan'
    },
    course_category: {
      index: 3,
      name: 'Course Category'
    },
    content_type: {
      index: 4,
      name: 'Content Type'
    }
  },

  // Custom metrics
  customMetrics: {
    engagement_score: {
      index: 1,
      name: 'Engagement Score'
    },
    course_progress: {
      index: 2,
      name: 'Course Progress %'
    }
  },

  // Goals
  goals: {
    first_purchase: {
      id: 1,
      name: 'First Purchase',
      type: 'transaction'
    },
    course_completion: {
      id: 2,
      name: 'Course Completion',
      type: 'event'
    },
    newsletter_signup: {
      id: 3,
      name: 'Newsletter Signup',
      type: 'event'
    }
  },

  // Audiences
  audiences: {
    high_value_users: {
      name: 'High Value Users',
      conditions: [
        { dimension: 'total_revenue', operator: '>', value: 5000 }
      ]
    },
    course_completers: {
      name: 'Course Completers',
      conditions: [
        { event: 'course_completed' }
      ]
    },
    inactive_users: {
      name: 'Inactive Users',
      conditions: [
        { metric: 'days_since_last_active', operator: '>', value: 30 }
      ]
    }
  }
};

module.exports = googleAnalyticsConfig;
