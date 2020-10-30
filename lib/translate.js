const translate = require('translation-google');
const similiarity = require('../lib/similiarity');
const axios = require('axios');
const fs = require('fs');
const send = require('../lib/send');
const api = 'https://keep.directory/api/all';

const delay = (n) => new Promise((res) => setTimeout(res, n));

module.exports = async (data) => {

    // get all the main article
    let all = await axios.get(api);
    all = all.data
        .flat()
        .map(item => {
            if (item.url.match(/.+blog\.keep\.network.+/i)) return { ...item, root: 'keep', child: 'blog' };
            if (item.url.match(/.+tbtc\.network.+/i)) return { ...item, root: 'tbtc', child: item.url.split('/')[3] };
            return { ...item, root: null, child: null };
        });


    

    let i = 0;
    for (var item of data) {
        try {
            console.log(item.title, item.description);
            let translated = await translate(item.title, { to: "en" });

            let _title = translated.text;
            if (translated.from.language.iso == 'en') translated = await translate(item.description, { to: "en" });

            let match = all
                .map(({ title, url, root, child }) => ({
                    matchTitle: title,
                    matchUrl: url,
                    confident: similiarity(_title, title),
                    root,
                    child,
                    other: similiarity(_title, title) < 0.51,
                }))
                .sort((a, b) => b.confident - a.confident)[0];

            let results = {
                ...item,
                translateTitle: _title,
                translateFrom: translated.from.language.iso,
                ...match,
            };

            // send to keep.directory!
            send(results);



        } catch (error) {
            console.log('Got banned by google translate, lol.', error);
            let least = data.findIndex(x => x.url == item.url);
            let text = `${new Date()}\n${JSON.stringify(data.slice(least))}\n==============`
            fs.appendFileSync('./toCheck.txt', text);
            break;
        }

        // wait 30 sec before continued
        // To make sure I'm not gonna got ip ban by google I split the messages url
        if (!!i && !(i % 10)) await delay(30000);
    }

}