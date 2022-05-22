const {MessageEmbed} = require('discord.js');
const { client } = require('..');
const {mimicUser} = require('../events/commandutils')
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
module.exports.run = async(message,args,client)=>{
    if (client.matches.find(m=>m.player1.id == message.author.id || m.player2.id == message.author.id)){
        let embed = new MessageEmbed()
        .setTitle("Nope")
        .setDescription(`Finish your current match with: **${getOpposition(message.author,client).username}**`)
        .setColor([255,0,0])
        .setTimestamp(new Date())
        .setFooter({ text: new Date().toDateString(), iconURL: message.author.displayAvatarURL({dynamic:true}) })
        message.channel.send({embeds:[embed]})
        return;
    }
    let ai = getRandomAI(message)
    if (ai == undefined){
        let embed = new MessageEmbed()
        .setTitle("Error")
        .setDescription(`Failed To Get AI Data!`)
        .setColor([255,0,0])
        .setTimestamp(new Date())
        .setFooter({ text: new Date().toDateString(), iconURL: message.author.displayAvatarURL({dynamic:true}) })
        message.channel.send({embeds:[embed]})
        return;
    }
    let match_data = {
        player1:message.author,
        player2:{name:ai.name,tier:ai.tier,windialog:ai.windialog,losedialog:ai.losedialog,isAI:true},
        tiles:createTiles(),
        turn:"Player2",
        message:undefined,
        id:getRandomInt(99999999)
    }
    match_data.message=await message.channel.send({embeds:[(await createMatchEmbed(message,match_data))]})
    client.matches.push(match_data)
    let embed = new MessageEmbed()
    .setTitle("Match Created ("+match_data.player2.tier+"'s Turn)")
    .setDescription(`Your Match Has Started With: **${match_data.player2.name}**`)
    if(match_data.player2.isAI != undefined){embed.addField(`AI Difficulty`,`**${match_data.player2.tier}**`)}
    embed.setColor([0,0,255])
    embed.setTimestamp(new Date())
    embed.setFooter({ text: new Date().toDateString(), iconURL: message.author.displayAvatarURL({dynamic:true}) })
    message.channel.send({embeds:[embed]})
    var startdialog = ai.startdialog[getRandomInt(ai.startdialog.length-1)]
    mimicUser(message.guild.id,message.channel.id,match_data.player2.name,startdialog)
}
function getRandomAI(message){
    let rng = getRandomInt(client.ai_tiers.length)
    if (rng > (client.ai_tiers.length-1)){rng=client.ai_tiers.length}
    let selectedtier = client.ai_tiers[rng]
    if (!selectedtier) return null;
    console.log(`${message.author.username} Will Recieve a random AI from the ${selectedtier} Tier`)
    let possibleAIs = client.ai_names.filter(ai=>ai.tier.toLowerCase()==selectedtier.toLowerCase())
    return possibleAIs[getRandomInt(possibleAIs.length-1)]
}
async function createMatchEmbed(message,match_data){
    let embedstring=""
    let tilex=0
    let tiley=0
    for (let y = 0; y < 3; y++) {
        tilex=0
        for (let x = 0; x < 5; x++) {
            let lastemoji=embedstring.split("").at(embedstring.split("").length-1)
            if(lastemoji=="⬛"||lastemoji=="❎"||lastemoji=="⚪"){
                embedstring+="⬜"
            } else {
                embedstring+=getTileOwner(tilex,tiley,match_data)
                tilex++
            }
        }
        tiley++
        if (y < 2){
            embedstring+="\n⬜⬜⬜⬜⬜\n"
        }
    }
    let embed = new MessageEmbed()
    .setTitle("Match")
    .setDescription(`${embedstring}`)
    .setColor([0,255,0])
    .setTimestamp(new Date())
    .setFooter({ text: new Date().toDateString(), iconURL: message.author.displayAvatarURL({dynamic:true}) })
    return embed
}
function createTiles(){
    let tiles=[]
    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            tiles.push({x:x,y:y,owner:"None"})
        }
    }
    return tiles
}
function getOpposition(author,client){
    if (client.matches.find(m=>m.player1.id == author.id)) return client.matches.find(m=>m.player1.id == author.id).player2
    if (client.matches.find(m=>m.player2.id == author.id)) return client.matches.find(m=>m.player2.id == author.id).player1
    return undefined
}
function getTileOwner(x,y,match){
    let tiles=match.tiles
    let tileowner="⬛"
    let tile = tiles.find(t=>t.x==x&&t.y==y)
    if (tile){
        if (tile.owner == "Player2"){tileowner="⚪"} else if (tile.owner=="Player1") {tileowner="❎"}
    }
    return tileowner
}
module.exports.assistfunctions={
    createMatchEmbed:createMatchEmbed
}
module.exports.info = {
    name:"PVE",
    command:"pve",
    description:"fight the AI"
}
