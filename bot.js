const mineflayer = require('mineflayer');
const express = require('express');
const config = require('./config.json');


// ======================
// WEB PAGE
// ======================

const app = express();

let botStatus = "Starting...";
let reconnect = 0;
let startTime = Date.now();


app.get('/', (req, res) => {

    let uptime = Math.floor(
        (Date.now() - startTime) / 1000
    );

    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
    <title>AFK Bot Status</title>

    <style>
    body {
        background:#111;
        color:white;
        font-family:Arial;
        text-align:center;
        margin-top:50px;
    }

    .card {
        background:#222;
        padding:20px;
        border-radius:15px;
        display:inline-block;
    }

    .online {
        color:#00ff00;
    }
    </style>

    </head>

    <body>

    <div class="card">

    <h1>🤖 Minecraft AFK Bot</h1>

    <h2 class="online">
    ${botStatus}
    </h2>

    <p>
    Bot:
    ${config.botUsername}
    </p>

    <p>
    Server:
    ${config.serverHost}:${config.serverPort}
    </p>

    <p>
    Reconnect:
    ${reconnect}
    </p>

    <p>
    Uptime:
    ${uptime}s
    </p>

    </div>

    </body>
    </html>
    `);

});


app.listen(7860,()=>{
    console.log("🌐 Web aktif port 7860");
});




// ======================
// MINECRAFT BOT
// ======================


const STEP_INTERVAL = 1500;
const JUMP_DURATION = 500;


function createBot() {


const bot = mineflayer.createBot({

    host: config.serverHost,

    port: config.serverPort,

    username: config.botUsername,

    auth:'offline',

    version:false,

    viewDistance:
    config.botChunk || 'tiny'

});


let movementPhase = 0;
let movementInterval = null;



bot.on('spawn',()=>{


    botStatus = "🟢 Online";


    console.log(
    `✅ ${config.botUsername} berhasil masuk server`
    );


    setTimeout(()=>{

        bot.setControlState(
            'sneak',
            true
        );


        console.log(
        '🤖 Bot AFK aktif (Crouching)'
        );


    },3000);



    setTimeout(
        movementCycle,
        STEP_INTERVAL
    );


});




// Anti AFK

function movementCycle(){


    if(!bot.entity)
        return;


    switch(movementPhase){


    case 0:

        bot.setControlState(
        'forward',
        true
        );

        bot.setControlState(
        'back',
        false
        );

        bot.setControlState(
        'jump',
        false
        );

        break;



    case 1:

        bot.setControlState(
        'forward',
        false
        );

        bot.setControlState(
        'back',
        true
        );

        bot.setControlState(
        'jump',
        false
        );

        break;



    case 2:

        bot.setControlState(
        'jump',
        true
        );


        setTimeout(()=>{

            bot.setControlState(
            'jump',
            false
            );

        },JUMP_DURATION);


        break;



    case 3:

        bot.setControlState(
        'forward',
        false
        );

        bot.setControlState(
        'back',
        false
        );

        bot.setControlState(
        'jump',
        false
        );

        break;

    }



    movementPhase =
    (movementPhase + 1) % 4;



    movementInterval =
    setTimeout(
        movementCycle,
        STEP_INTERVAL
    );

}




// reconnect

bot.on('end',()=>{


    botStatus="🔴 Offline";


    reconnect++;


    console.log(
    '⛔ Bot keluar server'
    );


    if(movementInterval)
        clearTimeout(
        movementInterval
        );


    console.log(
    '🔄 Reconnect 10 detik...'
    );


    setTimeout(()=>{

        createBot();

    },10000);


});





bot.on('error',(err)=>{

console.log(
'⚠️ Error:',
err.message
);

});





bot.on('message',(message)=>{

console.log(
'[SERVER]',
message.toString()
);

});


}


// START BOT

createBot();
