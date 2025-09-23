@echo off
echo Deploying CraftConnect Backend to Google Cloud...
cd backend
echo.
echo Make sure you have updated app.yaml with your environment variables!
echo.
pause
gcloud app deploy app.yaml --quiet
echo.
echo Backend deployed successfully!
echo.
echo Don't forget to deploy the frontend too:
echo cd .. 
echo npm run build
echo gcloud app deploy frontend-app.yaml
pause
