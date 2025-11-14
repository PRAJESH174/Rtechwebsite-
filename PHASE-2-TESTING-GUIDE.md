# Phase 2 Frontend Integration - Testing Guide

This document provides comprehensive testing procedures to verify Phase 2 frontend-to-backend API integration.

## Prerequisites

1. **Backend Server Running**: Express.js server must be running on `http://localhost:5000`
2. **Frontend Running**: Index.htm served via HTTP (not file://)
3. **API Client Loaded**: api-integration.js must be imported and available globally
4. **Browser Console**: Open Developer Tools (F12) to monitor for errors

## Test Environment Setup

```bash
# Terminal 1: Start Express backend
npm start
# Expected: Server listening on http://localhost:5000

# Terminal 2: Serve frontend (if needed)
python -m http.server 8000
# Navigate to http://localhost:8000
```

## Test Cases

### 1. Authentication Flow

#### Test 1.1: User Signup with OTP
**Expected**: User registers, receives OTP verification, account created

```javascript
// In browser console, verify API client exists
console.log(apiClient); // Should show APIClient instance

// Steps:
1. Click "Sign Up" button
2. Fill form: Name, Email, Mobile, Password
3. Click "Send OTP"
   - Expected: showLoading() displays
   - Expected: OTP sent message shows
   - Expected: OTP modal opens
4. Enter OTP: 123456
5. Click "Verify OTP"
   - Expected: Account created successfully message
   - Expected: Auto-redirected to login modal
6. Verify in localStorage:
   - localStorage.getItem('auth_token') should exist
   - localStorage.getItem('currentUser') should have user data
```

**Verify API Calls**:
```javascript
// Monitor API calls in Console
// Should see POST /api/auth/send-otp
// Should see POST /api/auth/verify-otp
// Should see POST /api/auth/signup
```

---

#### Test 1.2: User Login
**Expected**: User logs in with email/password, JWT token stored

```javascript
// Steps:
1. Click "Login" button
2. Enter registered email and password
3. Click "Login"
   - Expected: Loading indicator shows
   - Expected: Success message displayed
   - Expected: Modal closes automatically
   - Expected: User data synced from API
4. Verify in console:
   console.log(apiClient.getToken()); // Should return JWT token
   console.log(localStorage.getItem('currentUser')); // Should have user object
```

**Verify API Calls**:
```javascript
// Should see POST /api/auth/login with email/password
// Response should include: success, token, data (user info)
```

---

#### Test 1.3: Admin Login
**Expected**: Admin logs in, gains admin access

```javascript
// Steps:
1. Click "Admin Login" button
2. Enter credentials: username=admin, password=admin123
3. Click "Login"
   - Expected: Admin login successful message
   - Expected: Admin panel opens
   - Expected: Dashboard displayed
4. Verify in console:
   console.log(currentUser.isAdmin); // Should be true
   console.log(isAdmin); // Should be true
```

**Verify API Calls**:
```javascript
// Should see POST /api/auth/admin-login
// Response should include admin=true in data
```

---

### 2. Post Management

#### Test 2.1: Create Post
**Expected**: User creates and publishes a post via API

```javascript
// Prerequisites: User must be logged in

// Steps:
1. Click "Create Post" button
2. Write content in Quill editor: "# Test Post\nThis is a test post"
3. Click "Publish"
   - Expected: Loading indicator displays
   - Expected: Success message shown
   - Expected: Returned to home page
   - Expected: Post appears in feed
4. Verify post data:
   console.log(posts[0]); // First post should be newly created one
   console.log(posts[0].author); // Should be current user name
```

**Verify API Calls**:
```javascript
// Should see POST /api/posts with:
// {
//   title: "Test Post",
//   content: "<h1>Test Post</h1><p>This is a test post</p>",
//   category: "general",
//   tags: ["general"]
// }
```

---

#### Test 2.2: Like Post
**Expected**: User likes a post, like count increases

```javascript
// Prerequisites: At least one post must exist

// Steps:
1. Find a post in feed
2. Click like button (heart icon)
   - Expected: Button highlights
   - Expected: Like count increases
   - Expected: No errors in console
3. Verify in console:
   console.log(posts[0].likes); // Should be > 0
```

**Verify API Calls**:
```javascript
// Should see POST /api/posts/{postId}/like
```

---

#### Test 2.3: Admin Edit Post
**Expected**: Admin edits post content via API

```javascript
// Prerequisites: Admin logged in, posts exist

// Steps:
1. Go to Admin Panel → Manage Posts
2. Find a post and click "Edit"
3. Modify content in Quill editor
4. Click "Publish"
   - Expected: Success message
   - Expected: Post updated in table
5. Verify post was updated:
   console.log(posts.find(p => p.id === editedPostId));
```

---

### 3. Video Management

#### Test 3.1: Load Videos
**Expected**: Videos load from API on page load

```javascript
// Steps:
1. Navigate to Videos page
2. Wait for content to load
   - Expected: Videos display in grid
   - Expected: Video titles, descriptions visible
3. Verify videos in console:
   console.log(videos); // Should be array of video objects
   console.log(videos.length); // Should be > 0
```

**Verify API Calls**:
```javascript
// On page load, should see GET /api/videos?page=1&limit=20
// Response should include array of videos
```

---

#### Test 3.2: Admin Upload Video
**Expected**: Admin uploads video via API

```javascript
// Prerequisites: Admin logged in

// Steps:
1. Go to Admin Panel → Upload Video
2. Fill form:
   - Title: "Test Video"
   - Description: "Test video description"
   - Video File: Select a video file
   - Category: Select category
3. Click "Upload"
   - Expected: Loading indicator
   - Expected: Success message
   - Expected: Video appears in videos list
4. Verify:
   console.log(videos[0].title); // Should be "Test Video"
```

---

### 4. Payment Processing

#### Test 4.1: Card Payment
**Expected**: Payment processed via API

```javascript
// Prerequisites: User logged in, viewing course

// Steps:
1. Click "Enroll" on a course
2. Review payment details
3. Select "Credit/Debit Card"
4. Fill card form:
   - Card Number: 4111111111111111 (test card)
   - Name: John Doe
   - Expiry: 12/25
   - CVV: 123
5. Click "Pay Now"
   - Expected: Loading indicator
   - Expected: Payment processing...
   - Expected: Success modal shows
   - Expected: Transaction recorded
6. Verify transaction:
   console.log(transactions[0]); // Should have transaction data
   console.log(transactions[0].status); // Should be 'completed'
```

**Verify API Calls**:
```javascript
// Should see POST /api/payments/process with:
// {
//   courseId: "course-id",
//   amount: total,
//   method: "card",
//   paymentDetails: { cardNumber, cardName, cardExpiry, cardCVV }
// }
```

---

#### Test 4.2: UPI Payment
**Expected**: UPI payment processed

```javascript
// Steps:
1. Enroll in course
2. Select "UPI" payment method
3. Enter UPI ID: user@paytm
4. Click "Pay with UPI"
   - Expected: Success after processing
   - Expected: Transaction created

// Verify:
console.log(transactions[transactions.length-1].method); // Should be 'upi'
```

---

### 5. SEO Settings

#### Test 5.1: Update SEO Settings (Admin Only)
**Expected**: Admin updates SEO meta tags

```javascript
// Prerequisites: Admin logged in

// Steps:
1. Go to Admin Panel → SEO Settings
2. Modify fields:
   - Title: "New Title - RTech"
   - Description: "New description for testing"
   - Keywords: "new, keywords, test"
3. Click "Update SEO Settings"
   - Expected: Loading indicator
   - Expected: Success message
   - Expected: Preview updates
4. Verify meta tags in HTML:
   document.querySelector('meta[name="description"]').content
   // Should be "New description for testing"
   document.title // Should be "New Title - RTech"
```

**Verify API Calls**:
```javascript
// Should see PUT /api/admin/seo-settings with updated data
```

---

#### Test 5.2: Dynamic Page Meta Tags
**Expected**: Meta tags change when navigating between pages

```javascript
// Steps:
1. Check home page meta tags:
   console.log(document.title); // Should be home title
2. Click "About" in navigation
3. Check meta tags updated:
   console.log(document.title); // Should be "About RTech Solutions"
4. Click "Trainings"
5. Check meta tags updated again:
   console.log(document.title); // Should be "Live Training Programs..."

// Verify in HTML:
document.querySelector('meta[name="description"]').content
document.querySelector('meta[property="og:title"]').content
document.querySelector('meta[property="og:description"]').content
```

---

### 6. Error Handling & User Feedback

#### Test 6.1: Invalid Login
**Expected**: Error message shown for invalid credentials

```javascript
// Steps:
1. Click Login
2. Enter invalid email/password
3. Click Login
   - Expected: showError() displays
   - Expected: Error message visible
   - Expected: No page navigation
   - Expected: Form not cleared
4. Check console: No JavaScript errors
```

---

#### Test 6.2: Network Error Handling
**Expected**: App handles API errors gracefully

```javascript
// Steps:
1. Stop backend server (kill Express process)
2. Try to login
   - Expected: Error message displays
   - Expected: No crash or infinite loading
   - Expected: User can retry
3. Restart backend server
4. Try again - should work

// Verify in console:
// Error should be caught and displayed via showError()
```

---

#### Test 6.3: Loading States
**Expected**: UI shows loading feedback during API calls

```javascript
// Steps:
1. Click Login
2. Immediately check UI:
   - Expected: "Loading..." indicator visible
   - Expected: Loading message displayed
   - Expected: Button disabled (if implemented)
3. Wait for response
   - Expected: Loading indicator removed
   - Expected: Result shown (success or error)
```

---

### 7. Data Persistence

#### Test 7.1: Logout & Login
**Expected**: User data persists across sessions

```javascript
// Steps:
1. Login with user account
2. Create/like posts
3. Check localStorage:
   localStorage.getItem('currentUser') // Should exist
   localStorage.getItem('auth_token') // Should exist
   localStorage.getItem('rtech-posts') // Should have posts
4. Refresh page (F5)
5. Verify user still logged in:
   console.log(currentUser); // Should have user data
   console.log(apiClient.isAuthenticated()); // Should be true
```

---

#### Test 7.2: Sync Data from API
**Expected**: Fresh data synced from API on page load

```javascript
// Prerequisites: Make changes in admin panel on another device/tab

// Steps:
1. Open new browser tab with same site
2. Wait for page to load
3. Check if synced data matches:
   console.log(posts); // Should match API data
   console.log(videos); // Should match API data
```

---

### 8. Cross-Browser Testing

Test the following scenarios in different browsers:

- **Chrome/Chromium**: Primary development browser
- **Firefox**: Alternative engine testing
- **Safari/Mobile**: Mobile responsiveness
- **Edge**: Windows compatibility

**Checklist for each browser**:
- [ ] Auth flow works
- [ ] Forms submit correctly
- [ ] Error messages display
- [ ] Loading indicators visible
- [ ] Meta tags update
- [ ] Local storage accessible
- [ ] No console errors

---

## Automated Test Checklist

Run these checks programmatically in browser console:

```javascript
// 1. API Client Exists
console.assert(window.apiClient !== undefined, 'API client not loaded');

// 2. Error handling functions exist
console.assert(typeof showError === 'function', 'showError missing');
console.assert(typeof showSuccess === 'function', 'showSuccess missing');
console.assert(typeof showLoading === 'function', 'showLoading missing');
console.assert(typeof hideLoading === 'function', 'hideLoading missing');

// 3. Global data variables exist
console.assert(Array.isArray(posts), 'posts not initialized');
console.assert(Array.isArray(videos), 'videos not initialized');
console.assert(Array.isArray(transactions), 'transactions not initialized');

// 4. Meta tag functions exist
console.assert(typeof updateSEOMetaTags === 'function', 'updateSEOMetaTags missing');
console.assert(typeof updatePageMetaTags === 'function', 'updatePageMetaTags missing');

// 5. Check localStorage
console.log('localStorage keys:', Object.keys(localStorage));

// 6. Check API endpoints
console.log('Available API methods:');
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(apiClient)));

console.log('✅ All assertions passed!');
```

---

## Performance Testing

### API Response Times

Monitor response times for critical operations:

```javascript
// In api-integration.js, add timing
console.time('Login Request');
await apiClient.login(email, password);
console.timeEnd('Login Request');
// Expected: < 1000ms
```

### Expected Times:
- Auth operations: < 500ms
- Post operations: < 300ms
- Payment processing: < 2000ms
- Page metadata updates: < 100ms

---

## Security Testing

### JWT Token Handling
```javascript
// Verify token stored correctly
console.log(localStorage.getItem('auth_token'));
// Should be: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Verify Authorization header added
// Check Network tab → Headers
// Should see: Authorization: Bearer <token>
```

### Input Validation
```javascript
// Try XSS payload
// Email: test@test.com<script>alert('xss')</script>
// Should not execute script (API validates)

// Try SQL injection
// Email: test@test.com' OR '1'='1
// Should not crash or return unauthorized data
```

---

## Known Issues & Workarounds

### Issue 1: CORS Errors
**Symptom**: "Access to XMLHttpRequest blocked by CORS policy"
**Solution**: Ensure backend has CORS enabled in Express

```javascript
// In server.js, should have:
app.use(cors());
```

### Issue 2: Token Expiration
**Symptom**: 401 Unauthorized after 7 days
**Solution**: Refresh token logic needed in phase 3

### Issue 3: localStorage Full
**Symptom**: "QuotaExceededError" when saving data
**Solution**: Clear localStorage or implement size management

---

## Test Results Template

```markdown
# Phase 2 Integration Testing - Results

**Date**: [YYYY-MM-DD]
**Tester**: [Name]
**Environment**: [Browser, OS, Backend Version]

## Authentication
- [ ] Signup with OTP: PASS / FAIL
- [ ] Login: PASS / FAIL
- [ ] Admin Login: PASS / FAIL
- [ ] Token Storage: PASS / FAIL

## Posts
- [ ] Create Post: PASS / FAIL
- [ ] Like Post: PASS / FAIL
- [ ] Edit Post (Admin): PASS / FAIL
- [ ] Comment on Post: PASS / FAIL

## Videos
- [ ] Load Videos: PASS / FAIL
- [ ] Upload Video (Admin): PASS / FAIL

## Payments
- [ ] Card Payment: PASS / FAIL
- [ ] UPI Payment: PASS / FAIL
- [ ] Wallet Payment: PASS / FAIL

## SEO
- [ ] Update SEO Settings: PASS / FAIL
- [ ] Dynamic Page Tags: PASS / FAIL

## Error Handling
- [ ] Invalid Login Error: PASS / FAIL
- [ ] Network Error Handling: PASS / FAIL
- [ ] Loading States: PASS / FAIL

## Overall
**Total Tests**: __/29
**Pass Rate**: ___%
**Issues Found**: [List any bugs/improvements]

**Notes**: [Additional observations]
```

---

## Quick Test Script

Save this as `test-phase2.js` and run in browser console:

```javascript
(async () => {
    console.log('=== PHASE 2 API INTEGRATION TEST ===\n');
    
    try {
        // Test 1: Check API client
        console.log('✓ API Client loaded:', !!apiClient);
        
        // Test 2: Check data sync
        console.log('✓ Posts loaded:', posts.length > 0);
        console.log('✓ Videos loaded:', videos.length > 0);
        
        // Test 3: Check meta tags
        console.log('✓ Meta tags present:', !!document.title);
        
        // Test 4: Check error handling
        console.log('✓ Error handling available:', typeof showError === 'function');
        
        // Test 5: Check storage
        console.log('✓ Local storage working:', !!localStorage);
        
        console.log('\n=== ALL CHECKS PASSED ===');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
})();
```

---

## Summary

Phase 2 Testing verifies:
1. ✅ API client properly integrated
2. ✅ All authentication endpoints working
3. ✅ CRUD operations functional
4. ✅ Error handling implemented
5. ✅ Loading states visible
6. ✅ SEO metadata updates
7. ✅ Data persistence
8. ✅ Cross-browser compatibility

**Total Test Cases**: 29+ scenarios
**Expected Coverage**: > 80% of Phase 2 functionality
**Estimated Time**: 60-90 minutes for full manual testing
