# Deployment Guide

This guide will help you deploy the Employee Attendance System to various platforms.

## 🚀 Quick Start

### 1. Local Development Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd employee-attendance-system

# Install dependencies
npm run install-all

# Set up environment variables
cp server/env.example server/.env
# Edit server/.env with your MongoDB connection string

# Seed the database with sample data
cd server
npm run seed

# Start the application
cd ..
npm run dev
```

### 2. Production Deployment

## 🌐 Frontend Deployment (GitHub Pages)

### Option 1: GitHub Pages (Recommended)

1. **Build the React app:**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to GitHub Pages:**
   - Go to your GitHub repository
   - Navigate to Settings > Pages
   - Select source: "Deploy from a branch"
   - Choose branch: `main` and folder: `/docs`
   - Copy the `build` folder contents to a `docs` folder in your repo root
   - Push the changes

3. **Update API URL:**
   - Edit `client/src/services/api.js`
   - Change the `API_BASE_URL` to your deployed backend URL

### Option 2: Netlify

1. **Connect your repository to Netlify**
2. **Build settings:**
   - Build command: `cd client && npm run build`
   - Publish directory: `client/build`
3. **Environment variables:**
   - Add `REACT_APP_API_URL` with your backend URL

### Option 3: Vercel

1. **Import your repository to Vercel**
2. **Configure build settings:**
   - Framework preset: Create React App
   - Root directory: `client`
3. **Environment variables:**
   - Add `REACT_APP_API_URL` with your backend URL

## 🔧 Backend Deployment

### Option 1: Heroku

1. **Install Heroku CLI and login:**
   ```bash
   heroku login
   ```

2. **Create Heroku app:**
   ```bash
   heroku create your-app-name
   ```

3. **Set environment variables:**
   ```bash
   heroku config:set MONGODB_URI=your-mongodb-atlas-uri
   heroku config:set NODE_ENV=production
   ```

4. **Deploy:**
   ```bash
   git push heroku main
   ```

### Option 2: Railway

1. **Connect your GitHub repository to Railway**
2. **Set environment variables:**
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `NODE_ENV`: `production`
   - `PORT`: Railway will set this automatically

3. **Deploy automatically on push to main branch**

### Option 3: Render

1. **Create a new Web Service on Render**
2. **Connect your GitHub repository**
3. **Configure:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `server`

4. **Set environment variables:**
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `NODE_ENV`: `production`

## 🗄️ Database Setup (MongoDB Atlas)

### 1. Create MongoDB Atlas Cluster

1. **Sign up/Login to MongoDB Atlas**
2. **Create a new cluster** (Free tier recommended for testing)
3. **Set up database access:**
   - Create a database user with read/write permissions
   - Note down username and password

4. **Set up network access:**
   - Add your IP address or `0.0.0.0/0` for all IPs (production)

### 2. Get Connection String

1. **Click "Connect" on your cluster**
2. **Choose "Connect your application"**
3. **Copy the connection string**
4. **Replace `<password>` with your database user password**

### 3. Update Environment Variables

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/employee-attendance?retryWrites=true&w=majority
```

## 🔒 Security Considerations

### 1. Environment Variables

- **Never commit `.env` files to version control**
- **Use environment variables for all sensitive data**
- **Rotate secrets regularly**

### 2. CORS Configuration

Update CORS settings in `server/index.js` for production:

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

### 3. MongoDB Security

- **Use MongoDB Atlas for production**
- **Enable network access restrictions**
- **Use strong passwords**
- **Enable MongoDB Atlas security features**

## 📱 Mobile Deployment

### PWA Features

The application is ready for PWA deployment. To enable:

1. **Add manifest.json to client/public/**
2. **Register service worker**
3. **Test on mobile devices**

### React Native (Future)

For mobile app deployment:
1. **Use React Native Web**
2. **Or create separate React Native app**
3. **Share API endpoints**

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
        heroku_app_name: ${{ secrets.HEROKU_APP_NAME }}
        heroku_email: ${{ secrets.HEROKU_EMAIL }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./client/build
```

## 🧪 Testing Deployment

### 1. Health Check

Test your backend API:
```bash
curl https://your-backend-url.com/api/health
```

### 2. Frontend Test

1. **Open your deployed frontend URL**
2. **Test check-in functionality**
3. **Test admin portal**
4. **Verify mobile responsiveness**

### 3. Database Test

1. **Connect to MongoDB Atlas**
2. **Verify collections are created**
3. **Test CRUD operations**

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Check CORS configuration
   - Verify frontend URL in backend CORS settings

2. **MongoDB Connection:**
   - Verify connection string
   - Check network access settings
   - Ensure database user has correct permissions

3. **Build Errors:**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for missing environment variables

4. **Runtime Errors:**
   - Check server logs
   - Verify environment variables
   - Test API endpoints individually

### Debug Commands

```bash
# Check server logs
heroku logs --tail

# Test database connection
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(console.error)"

# Test API endpoints
curl -X GET https://your-api-url.com/api/health
```

## 📊 Monitoring

### 1. Application Monitoring

- **Heroku Metrics** (if using Heroku)
- **Railway Metrics** (if using Railway)
- **Custom logging with Morgan**

### 2. Database Monitoring

- **MongoDB Atlas Metrics**
- **Connection monitoring**
- **Performance insights**

### 3. Error Tracking

Consider adding error tracking services:
- **Sentry**
- **LogRocket**
- **Bugsnag**

## 🔄 Updates and Maintenance

### 1. Regular Updates

- **Keep dependencies updated**
- **Monitor security advisories**
- **Update Node.js version regularly**

### 2. Backup Strategy

- **MongoDB Atlas automated backups**
- **Manual database exports**
- **Code repository backups**

### 3. Performance Optimization

- **Database indexing**
- **API response caching**
- **Frontend optimization**

---

**Need help?** Check the main README.md or create an issue in the repository. 