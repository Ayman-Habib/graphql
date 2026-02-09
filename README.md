# 📋 GraphQL Profile Dashboard

A comprehensive profile dashboard built with GraphQL, JWT authentication, and interactive SVG-based statistics graphs.

## 🎯 Project Overview

This project demonstrates:
- **GraphQL API Integration** - Query user data with advanced GraphQL features
- **JWT Authentication** - Secure login with token-based access control
- **Interactive Graphs** - Beautiful SVG-based data visualizations (4+ different graph types)
- **Responsive Design** - Mobile-friendly UI with modern styling
- **User Dashboard** - Personalized profile with key statistics
- **Error Handling** - Comprehensive error management and user feedback

## ✨ Features

### 🔐 Authentication
- **Login Page** - Supports both username and email login
- **JWT Token Management** - Secure token storage in localStorage
- **Logout Functionality** - Safe session termination
- **Error Handling** - Informative error messages for invalid credentials
- **API Endpoint**: `https://learn.reboot01.com/api/auth/signin`

### 📊 Profile Sections

#### 1. Basic User Information
- User ID
- Login/Username
- **Query Type**: Simple Query
```graphql
{
  user {
    id
    login
  }
}
```

#### 2. Total XP Earned
- Total XP accumulation
- XP transaction history
- Recent XP Progress Graph
- **Query Type**: Query with WHERE clause (Arguments)
```graphql
{
  transaction(where: { type: { _eq: "xp" }}) {
    amount
    createdAt
    path
    objectId
  }
}
```

#### 3. Results Summary
- Pass/Fail statistics
- Success rate percentage
- Interactive Pass/Fail Ratio Graph
- **Query Type**: Nested Query (with sorting and limits)
```graphql
{
  result(order_by: {createdAt: desc}, limit: 200) {
    id
    grade
    path
    createdAt
    object {
      name
      type
    }
  }
}
```

#### 4. Audit Ratio
- Audit completion ratio
- Audits done vs received
- Audit Ratio Donut Graph
- **Query Type**: Nested Query with custom fields
```graphql
{
  user {
    login
    auditRatio
    totalUp
    totalDown
  }
}
```

#### 5. Skills (Optional)
- User learned skills
- **Query Type**: Query with Arguments

### 📈 Statistics & Graphs

#### Graph 1: Recent XP Progress (Bar Chart)
- Visual representation of recent XP transactions
- Shows last 12 XP gains
- Interactive tooltips with date and amount
- Color: Blue (#2196F3)

#### Graph 2: Pass/Fail Ratio (Donut Chart)
- Percentage of passed vs failed evaluations
- Color-coded: Green (Pass) vs Red (Fail)
- Center percentage display
- Shows actual counts below chart

#### Graph 3: Audit Ratio (Circular Progress)
- Visual representation of audit done vs received
- Donut chart with two segments
- Color-coded: Blue (Audits Done) vs Orange (Audits Received)
- Ratio calculation in center

#### Graph 4: XP Distribution by Project (Bar Chart)
- Top 8 projects by XP earned
- Color-coded bars for visual distinction
- Shows abbreviated project names
- XP amount in thousands

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **GraphQL**: GraphQL queries with variables and nesting
- **Authentication**: JWT Bearer tokens
- **Visualization**: SVG-based charts (no external libraries)
- **API**: GraphQL Engine from learn.reboot01.com

## 📁 Project Structure

```
graphql/
├── index.html           # Login page
├── profile.html         # Main profile dashboard
├── css/
│   └── style.css        # All styling and responsive design
├── js/
│   ├── auth.js          # Authentication functions
│   ├── graphql.js       # GraphQL request handler
│   ├── graphs.js        # Graph drawing functions
│   └── profile.js       # Profile data fetching and rendering
└── README.md            # This file
```

## 🚀 Getting Started

### Prerequisites
- Web browser with JavaScript enabled
- Internet connection
- Valid credentials for learn.reboot01.com

### Running Locally

1. Clone or download the project
2. Open `index.html` in a web browser
3. Enter your username/email and password
4. View your personalized dashboard with graphs

### Deployment

The project can be deployed to:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

## 📊 GraphQL Query Types Used

✅ **Simple Query** - Basic field selection
✅ **Query with Arguments** - Using WHERE clauses and filters
✅ **Nested Query** - Related table relationships
✅ **Query with Sorting/Limits** - order_by and limit parameters
✅ **Multiple Queries** - Parallel data fetching

## 🎨 Design Features

- **Gradient Background** - Purple to violet gradient
- **Cards Layout** - Clean, organized information sections
- **Hover Effects** - Interactive feedback on elements
- **Responsive** - Adapts to mobile, tablet, and desktop
- **Color Coding** - Intuitive color scheme:
  - Blue (#2196F3) - Primary actions, XP info
  - Green (#4CAF50) - Success, Pass status
  - Red (#f44336) - Danger, Fail status
  - Orange (#FF9800) - Warning, Audit received

## 🔒 Security Notes

- JWT tokens are stored in localStorage
- Tokens are sent via Bearer authentication
- JWT payload can be inspected to extract user ID
- Automatic logout on authentication errors
- Clear error messages for debugging

## 📝 Notes

- All graphs are SVG-based for scalability and performance
- No external charting libraries required
- Data is fetched directly from GraphQL API
- All timestamps are formatted in local timezone
- Graceful error handling for missing data

## 👨‍💻 Author

Created as part of GraphQL learning project at Zone01/Reboot01

## 📄 License

Free to use and modify for educational purposes

- Last 12 transactions displayed
- Hover tooltips with XP amounts
- Interactive and animated bars

#### Graph 2: Pass/Fail Ratio (Donut Chart)
- Circular progress graph showing success rate
- Color-coded segments (Green for PASS, Red for FAIL)
- Center percentage display
- Summary statistics below

#### Graph 3: Audit Ratio (Donut Chart)
- Visual representation of audit completion ratio
- Blue for audits done, Orange for audits received
- Ratio display in center (e.g., 2.5:1)
- Summary statistics

## 🚀 Quick Start

### Prerequisites
- Modern web browser with ES6 support
- GraphQL API endpoint (configured with your domain)
- Valid school credentials

### Installation

1. **Clone or download** the project files
2. **Update the API endpoint** in `js/graphql.js`:
   ```javascript
   const API_URL = "https://your-domain.com/api/graphql-engine/v1/graphql";
   ```

3. **Update the signin endpoint** in `js/auth.js`:
   ```javascript
   fetch("https://your-domain.com/api/auth/signin", {
   ```

4. **Open `index.html`** in your browser or serve via HTTP server

### Usage

1. **Login** with your school credentials (username or email)
2. **View Your Profile** with personal statistics
3. **Explore Graphs** for visual insights into your progress
4. **Logout** when finished

## 📁 Project Structure

```
graphql/
├── index.html           # Login page
├── profile.html         # Profile dashboard
├── css/
│   └── style.css       # Responsive styling
└── js/
    ├── auth.js         # Authentication logic (login/logout)
    ├── graphql.js      # GraphQL query handler
    ├── profile.js      # Profile data fetching
    └── graphs.js       # SVG graph generation
```

## 🔍 GraphQL Queries Implemented

### 1. Simple Query - User Information
```graphql
{
  user {
    id
    login
  }
}
```

### 2. Query with Arguments - XP Transactions
```graphql
{
  transaction(where: { type: { _eq: "xp" }}) {
    amount
    createdAt
    path
  }
}
```

### 3. Nested Query - Results with Object Details
```graphql
{
  result(order_by: {createdAt: desc}, limit: 100) {
    id
    grade
    path
    createdAt
    object {
      name
      type
    }
  }
}
```

### 4. Advanced Nested Query - User Audit Data
```graphql
{
  user {
    login
    auditRatio
    totalUp
    totalDown
  }
}
```

## 🎨 Design Features

### UI/UX Best Practices
✅ **Responsive Design** - Works on desktop, tablet, and mobile
✅ **Color Coding** - Clear visual hierarchy with color system
✅ **Loading States** - User-friendly feedback during login
✅ **Error Handling** - Clear, actionable error messages
✅ **Accessibility** - Semantic HTML and keyboard navigation
✅ **Performance** - Optimized SVG rendering
✅ **Visual Feedback** - Hover effects and animations

### Color Scheme
- Primary: Purple (#667eea)
- Secondary: Dark Purple (#764ba2)
- Success: Green (#4CAF50)
- Danger: Red (#f44336)
- Info: Blue (#2196F3)
- Warning: Orange (#FF9800)

## 🔧 Technical Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Variables
- **JavaScript (ES6+)** - Dynamic data handling
- **SVG** - Scalable vector graphics for charts
- **Fetch API** - HTTP requests
- **GraphQL** - Query language for APIs
- **JWT** - Token-based authentication

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🔐 Security Features

- **JWT Token Storage** - Secure token management
- **Authorization Headers** - Bearer token authentication
- **CORS Support** - Cross-origin resource sharing
- **Input Validation** - Form field validation
- **Session Management** - Automatic redirect if token missing

## 📊 Data Visualization

All graphs are created using **SVG** with:
- **Interactive tooltips** - Hover information
- **Smooth animations** - Visual polish
- **Responsive sizing** - Adapts to screen size
- **Color gradients** - Professional appearance
- **Clear legends** - Data interpretation

## 🚀 Deployment

### Hosting Options
- **GitHub Pages** - Static site hosting
- **Netlify** - Drag-and-drop deployment
- **Vercel** - Optimized for static sites
- **Firebase Hosting** - Fast and secure
- **AWS S3** - Scalable cloud storage

### Deployment Steps

1. Build the project (no build step needed - it's pure HTML/CSS/JS)
2. Upload files to your hosting service
3. Configure environment variables (API endpoint)
4. Enable HTTPS (required for secure API calls)
5. Test authentication flow

## 🐛 Troubleshooting

### Login Issues
- Verify credentials are correct
- Check API endpoint configuration
- Ensure CORS is enabled on server
- Check browser console for errors

### Graph Display Issues
- Verify GraphQL query returns data
- Check SVG viewBox dimensions
- Ensure localStorage contains JWT token
- Clear browser cache if needed

### Missing Data
- Confirm user has data in the system
- Verify GraphQL query syntax
- Check API response in Network tab
- Review console for GraphQL errors

## 📚 Learning Resources

- [GraphQL Official Docs](https://graphql.org/)
- [SVG Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG)
- [JWT Explanation](https://jwt.io/introduction)
- [Fetch API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

## 📝 Audit Checklist

### Functional Requirements
- ✅ Login with valid/invalid credentials
- ✅ Profile page with 3+ information sections
- ✅ Statistical graphs section (minimum 2 different graphs)
- ✅ Logout functionality
- ✅ Profile hosted online
- ✅ Data accuracy verified against GraphQL

### Technical Requirements
- ✅ Simple GraphQL queries (normal)
- ✅ Nested GraphQL queries
- ✅ GraphQL queries with arguments
- ✅ SVG-based graphs
- ✅ JWT authentication
- ✅ Responsive design
- ✅ Error handling

### Bonus Features
- ✅ 4+ information sections
- ✅ 3+ different graph types
- ✅ Advanced UI/UX design
- ✅ Additional statistics

## 📧 Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Verify API configuration
4. Check network tab for API responses

## 📄 License

This project is created for educational purposes.

---

**Created:** January 2026
**Last Updated:** January 26, 2026
