@echo off
cd /d "d:\eweew\AG\ccleak\opencode-dev\packages\opencode"
bun run --conditions=browser ./src/index.ts %*
