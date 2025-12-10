# Deploy Expo Web Project to Expo Hosting (EAS)
# This script exports and deploys your web app using Expo's hosting service

Write-Host "Building web export..." -ForegroundColor Cyan
npx expo export --platform web

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nBuild complete! Deploying to Expo Hosting..." -ForegroundColor Green
Write-Host ""

# Check if user wants production deployment
$deployProd = Read-Host "Deploy to production? (y/N)"
if ($deployProd -eq "y" -or $deployProd -eq "Y") {
    Write-Host "Deploying to production..." -ForegroundColor Green
    npx eas-cli deploy --platform web --prod
} else {
    Write-Host "Deploying to preview..." -ForegroundColor Green
    npx eas-cli deploy --prod
}