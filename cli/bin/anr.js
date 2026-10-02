#!/usr/bin/env node
const path = require('path');
const { initCommand, updateCommand, listCommand, doctorCommand, validateCommand, versionCommand } = require('../src/commands.js');

const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
  console.log(`
AI-Native Repository Standard CLI

Usage: anr <command> [options]

Commands:
  init [target]    Initialize an AI-Native Repository in the target directory
  update [target]  Update/sync existing AI-Native infrastructure to latest standard
  list             List available Runtimes and Tiers
  doctor           Check if the current project has AI-Native infrastructure
  validate         Validate the current AI-Native Repository
  version          Show CLI version

Options for 'init':
  --runtime <id>   Specify the Agent Runtime (e.g., claude-code, cursor, codex, gemini-cli)
  --tier <id>      Specify the Tier (light, standard, full)
  --lang <id>      Template language: en (default), zh-CN, ja (falls back to en per file)
  --dry-run        Show what would be created without making changes
  --force          Overwrite conflicting files

Options for 'update':
  --dry-run        Show planned updates without making changes
  --force          Force overwrite user-customized files in addition to infrastructure

Example:
  npx ai-native-repo init . --runtime cursor --tier standard
  npx ai-native-repo update .
  `);
}

if (!command || command === '--help' || command === '-h') {
  showHelp();
  process.exit(0);
}

switch (command) {
  case 'init':
    initCommand(args.slice(1));
    break;
  case 'update':
  case 'sync':
    updateCommand(args.slice(1));
    break;
  case 'list':
    listCommand();
    break;
  case 'doctor':
    doctorCommand();
    break;
  case 'validate':
    validateCommand(args.slice(1));
    break;
  case 'version':
    versionCommand();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}

