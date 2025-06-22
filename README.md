# AutoBrief - Team Summaries

A web application for generating team summaries and managing integrations with various services.

## Deployment Instructions

This application is configured for deployment on Render.com.

### Prerequisites

- Node.js 18+
- npm or yarn
- A Render.com account

### Deployment Steps

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. In Render Dashboard, create a new Web Service
3. Connect your Git repository
4. Use the following settings:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.js`
   - **Environment Variables**: All required environment variables are configured in render.yaml

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open http://localhost:3000 in your browser

## Environment Variables

All required environment variables are configured in the render.yaml file.

## Features

- Firebase Authentication
- GitHub Integration
- Google Calendar Integration
- Slack Integration
- Notion Integration
- Jira Integration
- Daily Summaries
- Team Management