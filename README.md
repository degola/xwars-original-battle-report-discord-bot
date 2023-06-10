# X-Wars Original Battle Report Parser & Discord Bot

This is a Discord bot that parses the original battle reports from the game [X-Wars](https://original.xwars.net) and posts them to a Discord channel. To see it in Action visit the X-Wars Discord Server (https://discord.gg/MutQ4zPD).

## Usage

You can add this bot to your own Discord server with the following [Link](https://discord.com/api/oauth2/authorize?client_id=1113485760604147784&permissions=&scope=bot). It will post processed battle report into a channel which name contains `battle-reports`. Additionally to reports parsed by users the bot will automatically post notable battle reports.

### Commands
  - `/kb <url> <private> <format>`: Reads the report from the URL and replys with the parsed report. The bot will post the report publically unless private=true ist added. Optionally you can specify the message format.
  - `/config default_format <user|bot> <format>`: Gets or sets the default message format for either reports parsed by a user or automaticalle by the bot. You need the privilege to manage channels to use this command.
  
### Message Formats
  - `text`: detailed text report
  - `oneline`: short report that fits into one line

## Development

This bot was created within a few hours, please feel free to tidy it up and make it better, 
PRs more than welcome!

The bot is written for NodeJS v18+ and has several files:
  - `app.js`: main application and Discord bot which listens to commands
  - `deploy-commands.js`: deploys the commands configuration to the Discord server based on files in the `commands/` folder
  - `parser.js`: retrieves the battle report, retrieves data from the report and saves it anonymized to disk 
  - `message.js`: creates different message formats
  - `guild-config-storage`: sqlite3 storage for guild configuration

