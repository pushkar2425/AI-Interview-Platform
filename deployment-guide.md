# AI Voice Interview App - Complete Deployment Guide

This guide provides step-by-step instructions for deploying your AI Voice Interview application using Google Gemini, with the frontend on Vercel and backend on Render/Heroku.

## 📋 Prerequisites

Before deploying, ensure you have:
- Google Account (for Gemini API)
- GitHub account
- Vercel account (sign up with GitHub)
- Render or Heroku account

## 🔑 Getting API Keys

### Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Select "Create API key in new project" or choose existing project
5. Copy your API key and save it securely

**Important**: Keep your API key secure and never commit it to version control.

## 🚀 Backend Deployment

### Option 1: Deploy to Render (Recommended)

Render provides easy deployment with automatic builds from GitHub.

#### Step 1: Prepare Your Repository

1. Create a new GitHub repository for your backend
2. Push all backend files to the repository:
   ```bash
   git init
   git add main.py requirements.txt Procfile .env.example README.md
   git commit -m "Initial FastAPI backend commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/ai-interview-backend.git
   git push -u origin main
   ```

#### Step 2: Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub account if not already connected
4. Select your backend repository
5. Configure the service:
   - **Name**: `ai-interview-backend`
   - **Language**: `Python`
   - **Branch**: `main`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free (for testing) or paid for production

#### Step 3: Set Environment Variables

In the Render dashboard, go to your service settings and add:
- `GEMINI_API_KEY`: Your Google Gemini API key
- `JWT_SECRET`: A secure random string (generate one online)

#### Step 4: Deploy

Click "Create Web Service" and wait for deployment to complete. Your API will be available at `https://your-service-name.onrender.com`

### Option 2: Deploy to Heroku

#### Step 1: Install Heroku CLI

- Download from [Heroku website](https://devcenter.heroku.com/articles/heroku-cli)
- Login: `heroku login`

#### Step 2: Create Heroku App

```bash
# Create app
heroku create your-app-name

# Set environment variables
heroku config:set JWT_SECRET=your-super-secure-jwt-secret
heroku config:set GEMINI_API_KEY=your-gemini-api-key

# Deploy
git push heroku main
```

Your API will be available at `https://your-app-name.herokuapp.com`

## 🌐 Frontend Deployment

### Deploy React App to Vercel

#### Step 1: Prepare Frontend Repository

1. Create a new GitHub repository for your frontend
2. Extract the frontend files from the web application created earlier:
   - `index.html`
   - `style.css` 
   - `app.js`
3. Create a simple `package.json` for the static site:

```json
{
  "name": "ai-voice-interview-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "serve -s . -l 3000",
    "build": "echo 'Static site - no build needed'",
    "start": "serve -s . -l 3000"
  },
  "devDependencies": {
    "serve": "^14.2.0"
  }
}
```

#### Step 2: Update API URLs

In your `app.js` file, update the API base URL to point to your deployed backend:

```javascript
// Replace localhost with your deployed backend URL
const API_BASE_URL = 'https://your-backend-app.onrender.com';
// or for Heroku: 'https://your-app-name.herokuapp.com'
```

#### Step 3: Deploy to Vercel

1. Push your frontend to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your frontend repository
5. Configure project:
   - **Framework Preset**: Other
   - **Build Command**: Leave empty (static site)
   - **Output Directory**: `.` (current directory)
6. Click "Deploy"

Your frontend will be available at `https://your-project-name.vercel.app`

## 🔧 Configuration Updates

### Update CORS Settings

After deploying your frontend, update your backend's CORS settings in `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-project-name.vercel.app",  # Your Vercel domain
        "http://localhost:3000",  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Redeploy your backend after making this change.

## 🧪 Testing Your Deployment

### Backend Testing

1. Visit `https://your-backend-url.com/docs` to see the Swagger API documentation
2. Test the health endpoint: `https://your-backend-url.com/health`
3. Try registering a new user through the API docs

### Frontend Testing

1. Visit your Vercel URL
2. Try starting an interview
3. Grant microphone permissions when prompted
4. Complete a mock interview and check if AI feedback is generated

## 🔒 Security Considerations

### Production Environment Variables

For production deployments, ensure:

1. **JWT_SECRET**: Use a strong, random 256-bit key
2. **GEMINI_API_KEY**: Keep secure, never expose in frontend
3. **Database**: Consider upgrading to PostgreSQL for production
4. **HTTPS**: Both platforms provide HTTPS by default
5. **Rate Limiting**: Consider adding rate limiting for production use

### Database Considerations

The current setup uses SQLite, which works for development and small-scale production. For larger applications, consider:

1. **PostgreSQL**: Render provides free PostgreSQL databases
2. **MongoDB**: For document-based storage
3. **Database Backups**: Set up regular backups for production data

## 📊 Monitoring and Logs

### Backend Monitoring

- **Render**: View logs in the Render dashboard
- **Heroku**: Use `heroku logs --tail` command
- Set up error monitoring with services like Sentry

### Frontend Monitoring

- **Vercel**: Built-in analytics and error tracking
- **Browser Console**: Monitor JavaScript errors
- **Google Analytics**: Add for usage tracking

## 🚀 Advanced Deployment Options

### Custom Domain

#### For Vercel Frontend:
1. Go to your project settings in Vercel
2. Add your custom domain
3. Update DNS records as instructed

#### For Render Backend:
1. Go to service settings
2. Add custom domain
3. Update DNS records

### Environment-Specific Configurations

Create different configurations for:
- **Development**: Local development with relaxed security
- **Staging**: Testing environment with production-like settings
- **Production**: Secure, optimized configuration

## 🔄 Continuous Deployment

Both platforms support automatic deployment from GitHub:

1. **Vercel**: Automatically deploys on git push to main branch
2. **Render**: Automatically deploys on git push to connected branch

Set up branch protection rules in GitHub for safer deployments.

## 📱 Mobile Considerations

The application uses Web Speech API, which has varying support across mobile browsers:

- **Chrome Mobile**: Full support
- **Safari Mobile**: Limited support
- **Firefox Mobile**: Partial support

Consider adding fallback options or native app development for better mobile support.

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**: Update backend CORS settings with correct frontend URL
2. **API Key Errors**: Verify Gemini API key is set correctly
3. **Microphone Permissions**: Ensure HTTPS is enabled (both platforms provide this)
4. **Build Failures**: Check logs for dependency issues

### Getting Help

- **Render Support**: [Documentation](https://render.com/docs)
- **Vercel Support**: [Documentation](https://vercel.com/docs)
- **Heroku Support**: [Dev Center](https://devcenter.heroku.com/)

## 📈 Scaling Considerations

As your application grows:

1. **Database**: Migrate to PostgreSQL or MongoDB
2. **Authentication**: Consider OAuth providers (Google, GitHub)
3. **File Storage**: Use cloud storage for audio files
4. **CDN**: Implement content delivery networks
5. **Load Balancing**: Multiple backend instances
6. **Caching**: Redis for session management

## 💰 Cost Considerations

### Free Tier Limitations

- **Render**: 750 hours/month, sleeps after 15 minutes of inactivity
- **Heroku**: 1000 hours/month (with credit card), sleeps after 30 minutes
- **Vercel**: Unlimited static sites, 100GB bandwidth/month
- **Gemini API**: Free tier with generous limits

### Paid Upgrades

Consider paid plans for:
- Always-on services (no sleeping)
- Custom domains
- Increased bandwidth
- Better performance
- Advanced monitoring

## 🎯 Next Steps

After successful deployment:

1. **Monitor Usage**: Track API calls and user engagement
2. **Gather Feedback**: Collect user feedback for improvements
3. **Add Features**: Enhanced AI analysis, more question types
4. **Mobile App**: Consider React Native or Flutter version
5. **Enterprise Features**: Team accounts, advanced analytics

This completes your deployment guide for the AI Voice Interview application. Your users can now practice interviews with AI-powered feedback from anywhere in the world!