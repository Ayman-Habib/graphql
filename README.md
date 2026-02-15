# Reboot01 GraphQL Profile

A personal profile page built with GraphQL that displays your Reboot01 school data including XP, audits, projects, and skills.

## Features

 **Authentication**
- JWT-based login with Basic authentication
- Support for both username and email login
- Secure token storage and refresh

 **Profile Dashboard**
- User identification and level
- Total XP and weekly/daily XP tracking
- Audit ratio and statistics
- Project status tracking
- Skills display

 **Interactive Visualizations**
- XP progression over time (line chart)
- Audit ratio distribution (pie chart)
- Project status breakdown (donut chart with details)
- Responsive SVG graphs using D3.js

## Project Structure

```
├── index.html          # Main HTML page
├── auth.js             # Authentication service
├── graphql.js          # GraphQL queries
├── script.js           # Main application logic
├── charts.js           # Chart generation
├── style.css           # Styling
├── login.js            # (Currently unused)
├── database-struct.txt # Database schema reference
└── instructions.txt    # Project requirements
```

## Required Queries (All Implemented)

 **Simple Query** - Get user info
```graphql
query {
  user {
    id
    login
    attrs
  }
}
```

 **Query with Arguments** - Get XP transactions by user ID
```graphql
query GetXPTransactions($userId: Int!) {
  transaction(where: { userId: { _eq: $userId }, type: { _eq: "xp" } }) {
    id
    type
    amount
    createdAt
  }
}
```

 **Nested Query** - Get progress with user information
```graphql
query GetProgressWithUser($userId: Int!) {
  progress(where: { userId: { _eq: $userId } }) {
    id
    grade
    createdAt
    object { name type }
    user { id login }
  }
}
```

## Deployment Options

### 1. GitHub Pages (Recommended)

**Steps:**
1. Create a repository on GitHub
2. Clone it locally
3. Copy all project files to the repository
4. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: GraphQL Profile"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/graphql-profile.git
   git push -u origin main
   ```
5. Go to **Settings** → **Pages**
6. Select **Main** branch as source
7. Your site will be available at `https://YOUR_USERNAME.github.io/graphql-profile/`

### 2. Netlify

**Steps:**
1. Create account at [netlify.com](https://netlify.com)
2. Drag and drop project folder
3. Or connect GitHub repository
4. Site deployed instantly!

### 3. Vercel

**Steps:**
1. Create account at [vercel.com](https://vercel.com)
2. Import GitHub project
3. Click Deploy
4. Your site is live!

### 4. GitLab Pages

**Steps:**
1. Create GitLab repository
2. Add all files
3. Create `.gitlab-ci.yml`:
   ```yaml
   pages:
     stage: deploy
     script:
       - mkdir .public
       - cp -r * .public
       - mv .public public
     artifacts:
       paths:
         - public
     only:
       - main
   ```
4. Push to GitLab
5. Site available at `https://YOUR_USERNAME.gitlab.io/graphql-profile/`

## Local Development

### Prerequisites
- Web browser (Chrome, Firefox, Safari, Edge)
- Text editor
- Basic knowledge of JavaScript and GraphQL

### Running Locally

1. **Option 1: Simple HTTP Server**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (if installed)
   npx http-server
   ```
   Then visit: `http://localhost:8000`

2. **Option 2: Visual Studio Code Live Server**
   - Install "Live Server" extension
   - Right-click `index.html` → "Open with Live Server"

## API Endpoints

- **GraphQL Endpoint:** `https://learn.reboot01.com/api/graphql-engine/v1/graphql`
- **Authentication Endpoint:** `https://learn.reboot01.com/api/auth/signin`

## Data Displayed

### User Information
- User ID
- Login (username)
- Email (from attributes)
- Current Level
- Average Grade

### XP Statistics
- Total XP (all transactions)
- XP earned today
- XP earned this week
- Visual chart showing XP progression over time

### Audit Statistics
- Number of audits done
- Number of audits received
- Audit XP amounts
- Audit ratio (done/received)
- Pie chart visualization

### Project Statistics
- Total projects
- Projects passed
- Projects failed
- Projects in progress
- Status breakdown chart

### Skills
- All skills with amounts
- Color-coded by intensity
- Sorted by XP amount

## Graphs Implemented

1. **XP Over Time** - Line chart showing cumulative XP progression
2. **Audit Ratio** - Pie chart showing done vs received audits
3. **Project Status** - Donut chart with detailed breakdown

## Browser Support

- Chrome/Chromium (Latest)
- Firefox (Latest)
- Safari (Latest)
- Edge (Latest)

## Troubleshooting

### Login Issues
- Ensure username/email and password are correct
- Check for typos
- Try clearing browser cache and cookies

### No Data Displayed
- Verify you're logged in
- Check browser console for errors (F12)
- Ensure this account has data in the system
- Check if API is accessible

### Charts Not Showing
- Ensure D3.js loaded (check network tab)
- Check console for errors
- Try refreshing the page
- Clear browser cache

## Technologies Used

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Authentication:** JWT (JSON Web Tokens)
- **API:** GraphQL
- **Visualization:** D3.js v7
- **HTTP:** Fetch API

## Performance Tips

- Graphs are cached after first load
- XP transactions limited to 1000 most recent by default
- Skill deduplication removes redundant entries
- Project deduplication shows only latest attempt per project

## Security Notes

- Tokens stored in localStorage (suitable for public profile)
- Never hardcode credentials
- Always use HTTPS in production
- Tokens are cleared on logout
- CORS requests handled securely

## Features Roadmap

- [ ] Dark mode toggle
- [ ] Export statistics to CSV/PDF
- [ ] Multiple theme options
- [ ] Offline mode with cached data
- [ ] Advanced filtering options
- [ ] API rate limiting display
- [ ] Custom date range for statistics

## Contributing

Feel free to improve this project! Consider adding:
- Additional chart types
- More statistics
- UI/UX improvements
- Performance optimizations
- Bug fixes

## License

This project is part of the Reboot01 school curriculum.

## Author

Created as part of the GraphQL learning project at Reboot01.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the database schema (database-struct.txt)
3. Check the GraphQL endpoint directly via GraphiQL
4. Review browser console for specific errors

---

**Happy learning! **
