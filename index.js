require('dotenv').config();
const { default: Axios } = require('axios');
const Path = require('path');
const Fs = require('fs');
const { Telegraf } = require('telegraf');
const tt = require('tiktok-scraper');
const bot = new Telegraf(process.env.BOT_TOKEN);

const Texts = require('./texts.js')
const texts = new Texts({
    bot_name: process.env.BOT_NICKNAME,
    developer_name: process.env.DEVELOPER_NICKNAME,
});

function helpText(ctx) {
    ctx.reply(texts.help, {
        parse_mode: 'MarkdownV2'
    })
}
bot.start(helpText);
bot.help(helpText);

bot.catch((err, ctx) => {
    console.log(`Ooops, encountered an error for ${ctx.updateType}`, err);
})


const longUrl = /^https:\/\/www.tiktok.com\/@.+\/video\/\d+/i;
const shortUrl = /^https:\/\/\w+.tiktok.com\/.+\/?/i;
bot.on('text', ctx => {
    const url = ctx.update.message.text;
    if (!url.match(longUrl) && !url.match(shortUrl)) {
        ctx.reply(texts.wrong_url);
        return;
    }
    console.log(url);
    tt.getVideoMeta(url)
        .then(videoMeta => {
            const fileUrl = videoMeta.videoUrl;
            const name = videoMeta.id + '_' + Date.now() + '.mp4';
            const title = `${videoMeta.text} | ${videoMeta.authorMeta.name}`;

            const request = Axios({
                method: 'GET',
                url: fileUrl,
                responseType: 'stream',
                headers: {
                    Referer: url,
                }
            });

            request
                .then(response => {
                    const path = Path.resolve(__dirname, 'downloads', name);
                    const writer = Fs.createWriteStream(path);

                    response.data.pipe(writer);
        
                    return new Promise((resolve, reject) => {

                        writer.on('finish', () => {
                            console.log(path);
                            resolve(path);
                        })
        
                        writer.on('error', err => {
                            reject(err);
                        })
                    });
                })
                .then(path => {
                    return ctx.replyWithVideo({
                        source: Fs.createReadStream(path),
                        filename: name,
                    }, {
                        caption: title,
                    })
                    .then(result => {
                        Fs.unlink(path, _ => console.log('deleted.'));
                        return result;
                    });
                })
                .then(result => {
                    const file_id = result.video.file_id;
                    const thumb_file_id = result.video.thumb.file_id;
                    // TODO: Store it to DB
                })
            ;
        })
        .catch(reason => {
            console.log(reason);
            ctx.reply('Can\'t extract metadata');
        })
    ;
});

bot.launch();