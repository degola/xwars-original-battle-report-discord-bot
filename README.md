# X-Wars Original Battle Report Parser & Discord Bot

This is a Discord bot that parses the original battle reports from the game [X-Wars](https://original.xwars.net) and posts them to a Discord channel on the X-Wars Discord Server (https://discord.gg/MutQ4zPD).

This bot was created within a few hours, please feel free to tidy it up and make it better, 
PRs more than welcome!

The bot is written for NodeJS v18+ and has 2 main files:
- `app.js`: main application and Discord bot which listens to commands
- `deploy-commands.js`: deploys the commands configuration to the Discord server based on files in the `commands/` folder

