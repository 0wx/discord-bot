if(process.env.NODE_ENV !== 'production') require('dotenv').config();

const Discord = require('discord.js-self');
const bot = new Discord.Client();
const controller = require('./controller/messages');


bot.on('ready', () => console.log(`Logged in as ${bot.user.tag}!`));
bot.on('message', controller);
bot.login(process.env.TOKEN);
