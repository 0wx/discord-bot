const meta = require('metafetch');
const isURL = require('is-url');
const axios = require('axios');
const translate = require('../lib/translate');
const translationChannel = process.env.NODE_ENV === "production" ? "701767679102550016" : "771805055418499125";
const fs = require('fs');

const avatarUrl = (id, avatar) => avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}` : "https://cdn.discordapp.com/embed/avatars/1.png";
const filterList = [
    'https:\/\/docs.google.com\/spreadsheets\/d\/1ieuBy28G-ZKPLV-7SUuWN9Eu56U-xw4Z1t2JrpEClfc/.+',
    'https?:[\/.a-z0-9A-Z-]+(tbtc|keep).network(.+)?',
    'https?:\/\/(cdn.)?(discordapp|discord).com(.+)?',
    'https?:\/\/[a-zA-Z0-9.-]\/',
    'https?:\/\/keep.directory.+',
    'https?:\/\/keep.directory',
    'https?:\/\/medium\.com\/cross-chain\/.+',
    'https?:\/\/(.+)?facebook.com.+',
    'https?:\/\/(.+)?twitter.com.+',
    'https?:\/\/(.+)?telegram.com.+',
];



module.exports = async (msg) => {
    let { content, createdTimestamp, author: { username, discriminator, avatar, id, bot } } = msg;

    // ignoring messages from another channel or bot
    if (msg.channel.id != translationChannel || bot) return;
    // some helpfull operator
    const noQuoted = (text) => text[0] != '>';
    const splitSpace = (text) => text.split(' ');
    const filterUrl = (url) => filterList.every(filter => !url.match(new RegExp(filter, 'i')))
    
    // Update the database
    axios
        .get('https://keep.directory/api/update')
        .then(x => console.log(x.data.message))
        .catch(e => console.log(e));

    // parse message
    content = content
        //remove quoted messages '>'
        .split('\n')
        .filter(noQuoted)

        // split every word 
        .map(splitSpace)
        .flat()

        // filter the word is url or not
        // and check is it a tbtc or keep link
        .filter(isURL)
        .filter(filterUrl)

        // surprisingly it's caused some bugs if I dont do this
        // because sometimes the url already encoded
        // just to make sure it's 1 level under encodeURI
        .map(decodeURI)
        .map(encodeURI);

    // define details
    let details = {
        chat_id: msg.id,
        id,
        name: username,
        discriminator,
        avatarUrl: avatarUrl(id, avatar),
        timestamp: createdTimestamp,
    };
    // read meta tag from the url
    let embeds = [], err = [];
    for (let item of content) {
        try {
            let response = await meta.fetch(item);
            embeds.push(response);
        } catch (e) {
            console.log(e);
            err.push(item);
        }
    };

    if(err.length) fs.appendFileSync('./toCheck.txt', `${new Date()}\n${JSON.stringify({...details, embeds: err })}\n`);

    // details to push alongside with parsed url


    embeds = embeds
        // removing error url
        .filter(item => !(item instanceof Error))
        .map(({ title, description }, i) => ({ title, url: decodeURI(content[i]), description }))

        // add details along side with the url
        .map(item => ({ ...details, ...item }));

    // go to translate
    translate(embeds);
}
