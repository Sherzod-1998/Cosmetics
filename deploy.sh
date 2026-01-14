#!/bin/bash
set -e

# PRODUCTION
git reset --hard
git checkout main
git pull origin main

npm i
npm run build

# PM2
pm2 start process.config.js --env production
pm2 save
pm2 ls

# DEVELOPMENT (optional)
# git reset --hard
# git checkout develop
# git pull origin develop
# npm i
# pm2 start process.config.js --env development
EOF

chmod +x deploy.sh