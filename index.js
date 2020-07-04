require('dotenv').config();
const { Telegraf } = require('telegraf');
const tt = require('tiktok-scraper');

const bot = new Telegraf(process.env.BOT_TOKEN);

function helpText(ctx) {
    const bot = ctx.botInfo.username;
    const text = `
Send me a link to TikTok
Commands:
/help \\- for this message
Inline mode \\(In chat with someone\\):
\`@${bot} @username\` \\- find last posts from user
\`@${bot} #hashtag\` \\- find last posts with hashtag
\`@${bot} link\` \\- find video by link
`;
    ctx.reply(text, {
        parse_mode: 'MarkdownV2'
    })
}

bot.start(helpText);
bot.help(helpText);
bot.hears('hi', (ctx) => ctx.reply('Hello there!'))

bot.catch((err, ctx) => {
    console.log(`Ooops, encountered an error for ${ctx.updateType}`, err);
})


const longUrl = /^https:\/\/www.tiktok.com\/@.+\/video\/\d+/i;
const shortUrl = /^https:\/\/vm.tiktok.com\/.+\/?/i;
bot.on('text', ctx => {
    const url = ctx.update.message.text;
    if (!url.match(longUrl) && !url.match(shortUrl)) {
        ctx.reply('I cant get video from this link, make sure it is tiktok url');
        return;
    }
    console.log(url);
    tt.getVideoMeta(url)
        .then(videoMeta => {
            const fileUrl = videoMeta.videoUrl;
            ctx.replyWithVideo(fileUrl, {
                caption: videoMeta.text,
            });
        })
        .catch(reason => {
            console.log(reason);
            ctx.reply('Can\'t extract metadata');
        });
});


bot.on('inline_query', ctx => {
    const query = ctx.update.inline_query.query;
    console.log(query);
    if (query.match(longUrl) || query.match(shortUrl)) {
        answerWithVideo(ctx, query);
        return;
    }
    if (query.startsWith("@")) {
        const username = query.slice(1);
        answerWithUserVideos(ctx, username);
        return;
    }
    if (query.startsWith("#")) {
        const hastag = query.slice(1);
        answerWithHashtagVideos(ctx, hastag);
        return;
    }
    ctx.answerInlineQuery([]);
});

function answerWithUserVideos(ctx, username) {
    answerWithVideos(ctx, tt.user(username, { number: 10 }));
}

function answerWithHashtagVideos(ctx, hashtag) {
    answerWithVideos(ctx, tt.hashtag(hashtag, { number: 10 }));
}

function answerWithVideos(ctx, data) {
    data
        .then(data => data.collector)
        .then(videos => {
            let result = [];
            let id = 0;
            for (let video of videos) {
                const videoObject = createVideoObject(video, id++);
                result.push(videoObject);
            }
            ctx.answerInlineQuery(result);
        })
        .catch(error => {
            console.log(error);
            ctx.answerInlineQuery([])
        });
}

function answerWithVideo(ctx, url) {
    return tt.getVideoMeta(url)
        .then(videoMeta => {
            const video = createVideoObject(videoMeta);
            ctx.answerInlineQuery([video]);
        })
        .catch(error => {
            console.log(error);
            ctx.answerInlineQuery([]);
        });
}

function createVideoObject(video, id = 0) {
    const title = `${video.text} | ${video.authorMeta.name}`;
    const videoObject = {
        type: 'video',
        id: id,
        mime_type: 'video/mp4',
        thumb_url: video.covers.default,
        video_url: video.videoUrl,
        caption: title,
        video_duration: video.videoMeta.duration,
        title: title,
    };
    return videoObject;
}

bot.launch();