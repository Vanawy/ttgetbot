require('dotenv').config();
const { Telegraf } = require('telegraf');
const tt = require('tiktok-scraper');

const bot = new Telegraf(process.env.BOT_TOKEN);

const longUrl = /^https:\/\/www.tiktok.com\/@.+\/video\/\d+/i;
const shortUrl = /^https:\/\/vm.tiktok.com\/.+\/?/i;

bot.start((ctx) => ctx.reply('Send me a link to TikTok and I send video to you! (WITH WATERMARK)'));
bot.help((ctx) => ctx.reply('Send me a link to TikTok'));
bot.hears('hi', (ctx) => ctx.reply('Hello there!'))

bot.catch((err, ctx) => {
    console.log(`Ooops, encountered an error for ${ctx.updateType}`, err);
})
bot.on('text', async ctx => {
    const url = ctx.update.message.text;
    if (!url.match(longUrl) && !url.match(shortUrl)) {
        ctx.reply("I cant get video from this link, make sure it is tiktok url");
    }
    const videoMeta = await tt.getVideoMeta(url);
    console.log(videoMeta);
    const fileUrl = videoMeta.videoUrl;
    ctx.replyWithVideo(fileUrl, {
        caption: videoMeta.text,
    });
});

bot.launch();