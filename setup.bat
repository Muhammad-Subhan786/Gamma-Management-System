@echo off
echo 🚀 Setting up Employee Attendance System...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install dependencies
echo 📦 Installing dependencies...
call npm run install-all

REM Create environment file
echo 🔧 Setting up environment variables...
if not exist "server\.env" (
    copy "server\env.example" "server\.env"
    echo ✅ Created server\.env file
    echo ⚠️  Please edit server\.env with your MongoDB connection string
) else (
    echo ✅ server\.env already exists
)

echo.
echo 🎉 Setup completed!
echo.
echo Next steps:
echo 1. Edit server\.env with your MongoDB connection string
echo 2. Start MongoDB (if using local instance)
echo 3. Run: npm run dev
echo 4. Open http://localhost:3000 in your browser
echo.
echo Optional:
echo - Run 'cd server ^&^& npm run seed' to populate sample data
echo - Check README.md for detailed instructions
echo - Check DEPLOYMENT.md for deployment guide
echo.
pause 