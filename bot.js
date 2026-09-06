const mineflayer = require('mineflayer');
const express = require('express');
const config = require('./config.json');


// =======================
// WEB SERVER
// =======================

const app = express();

let botStatus = "Starting...";
let reconnectCount = 0;
let startTime = Date.now();


app.get('/', (req, res) => {

    let uptime = Math.floor((Date.now() - startTime) / 1000);

    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Minecraft AFK Bot</title>

        <style>
            body {
                background:#111;
                color:white;
                font-family:Arial;
                text-align:center;
                padding:40px;
            }

            .box {
                background:#222;
                padding:25px;
                border-radius:15px;
                max-width:500px;
                margin:auto;
            }

            .online {
                color:#00ff66;
            }

        </style>

    </head>

    <body>

    <div class="box">

        <h1>🤖 Minecraft AFK Bot</h1>

        <h2 class="online">
        🟢 ${botStatus}
        </h2>


        <p>
        Bot Name:
        <b>${config.botUsername}</b>
        </p>


        <p>
        Server:
        <b>${config.serverHost}:${config.serverPort}</b>
        </p>


        <p>
        Reconnect:
        <b>${reconnectCount}</b>
        </p>


        <p>
        Uptime:
        <b>${uptime}s</b>
        </p>


    </div>

    </body>
    </html>
    `);

});


app.listen(7860,()=>{
    console.log("🌐 Web aktif port 7860");
});




// =======================
// MINECRAFT BOT
// =======================

const STEP_INTERVAL = 1500;
const JUMP_DURATION = 500;


function createBot(){


const bot = mineflayer.createBot({

    host: config.serverHost,

    port: config.serverPort,

    username: config.botUsername,


    // server cracked
    auth:'offline',


    // auto version
    version:false,


    viewDistance:
    config.botChunk || 'tiny'

});



let movementPhase = 0;
let movementInterval = null;



bot.on('spawn',()=>{


    botStatus="Online";


    console.log(
    `✅ ${config.botUsername} masuk server`
    );


    setTimeout(()=>{


        bot.setControlState(
            'sneak',
            true
        );


        console.log(
        "🤖 AFK aktif"
        );


    },3000);



    setTimeout(
        movementCycle,
        STEP_INTERVAL
    );


});





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


break;


}



movementPhase =
(movementPhase+1)%4;



movementInterval =
setTimeout(
movementCycle,
STEP_INTERVAL
);


}





bot.on('end',()=>{


botStatus="Offline - Reconnecting";


console.log(
"⛔ Bot keluar"
);



reconnectCount++;



if(movementInterval)
clearTimeout(
movementInterval
);



setTimeout(()=>{


createBot();


},10000);



});






bot.on('error',(err)=>{


console.log(
"⚠️ Error:",
err.message
);


});





bot.on('message',(message)=>{


console.log(
"[SERVER]",
message.toString()
);


});



}




// START

createBot();
