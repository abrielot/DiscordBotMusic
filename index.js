const Discord = require ('discord.js');
const ytdl = require ('ytdl-core');
const configjson = require('./config.json');
const google = require('googleapis');

const youtube = new google.youtube_v3.Youtube({
    version: 'v3',
    auth: configjson.GOOGLE_KEY
});
const client = new Discord.Client();

const prefixo = configjson.PREFIX;

const servidores = {
    'server': {
        connection: null,
        dispatcher: null,
        row: [],
        implay: false
    }
}

client.on("ready", () => {
    console.log('Online!');
});

client.on("message", async (msg) => {

    // filtro
    if (!msg.guild) return;

    if (!msg.content.startsWith(prefixo)) return;

    if (!msg.member.voice.channel) {
        msg.channel.send('Must be on a voice channel!');
        return;
    }

    // comandos
    if (msg.content === prefixo + 'join') { // !join
        try{
            servidores.server.connection = await msg.member.voice.channel.join();
        }
        catch (err) {
            console.log('Error joining a voice channel!');
            console.log(err);
        }
    }

    if (msg.content === prefixo + 'leave') { // !leave
       msg.member.voice.channel.leave();
       servidores.server.connection = null;
       servidores.server.dispatcher = null;
    }

    if (msg.content.startsWith(prefixo + 'play')) { // !play <link>
        let whatoplay = msg.content.slice(6);

        if (whatoplay.length === 0) {
            msg.channel.send('something missing to play!');
            return;
        }

        if (servidores.server.connection === null) {
            try{
                servidores.server.connection = await msg.member.voice.channel.join();
            }
            catch (err) {
                console.log('Error joining a voice channel!');
                console.log(err);
            }
        }

        if (ytdl.validateURL(whatoplay)) {
            servidores.server.row.push(whatoplay);
            console.log('Add: ' + whatoplay);
            playmusic();
        }
        else {
            youtube.search.list({
                q: whatoplay,
                part: 'snippet',
                fields: 'Items(id(videoId),snippet(title,channelTitle))',
                type: 'video',
            }, function (err, result) {
                if (err) {
                    console.log(err);
                }
                if (result) {
                    const listresult = [];
                    for (let i in result.data.items) {
                        const fordItem = {
                            'tituloVideo': result.data.items[i].snippet.title,
                            'nameChannel': result.data.items[i].snippet.channelTitle,
                            'id': result.data.items[i].id.videoId
                        }

                        listresult.push(fordItem);
                    }
                }
            });
        }
    }

    if (msg.content === prefixo + 'pause') { // !pause
        servidores.server.dispatcher.pause();
    }

    if (msg.content === prefixo + 'resume') { // !resume
        servidores.server.dispatcher.resume();
    }
});


const playmusic = () => {
    if (servidores.server.implay === false) {
        const playing = servidores.server.row[0];
        servidores.server.implay = true;
        servidores.server.dispatcher = servidores.server.connection.play(ytdl(playing, configjson.YTDL));

        servidores.server.dispatcher.on('finish', () =>{
        	servidores.server.row.shift();
            servidores.server.implay = false;
            if (servidores.server.row.length > 0) {
                playmusic();
            }
            else {
                servidores.server.dispatcher = null;
            }
        });
    }
    
}


client.login(configjson.TOKEN_DISCORD);