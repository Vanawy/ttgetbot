class Texts {
    constructor(vars = {}) {
        this.vars = {
            bot_name: 'ttgetbot',
            developer_name: 'vanawy',
            ...vars,
        }

        this.help = `
Send me a link to TikTok
Commands:
/help \\- for this message
Inline mode \\(In chat with someone\\):
Currently don't work
\`@${this.vars.bot_name} @username\` \\- find last posts from user
\`@${this.vars.bot_name} #hashtag\` \\- find last posts with hashtag
\`@${this.vars.bot_name} link\` \\- find video by link

Author: @${this.vars.developer_name}
`;
        this.wrong_url = `I cant get video from this link, make sure it is tiktok url or report an issue in DM: @${this.vars.developer_name}`;
    }
}

module.exports = Texts;