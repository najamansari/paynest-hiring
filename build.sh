#!/bin/bash
cd bidder-backend
pnpm install --prod --frozen-lockfile
cp -R dist ../backend

cd ../bidder-frontend
pnpm install --prod --frozen-lockfile
cp -R dist ../build
