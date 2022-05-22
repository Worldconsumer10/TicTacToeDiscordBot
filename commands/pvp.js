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
    let mention = message.mentions.users.first()
    if (mention == undefined){
        let embed = new MessageEmbed()
        .setTitle("Nope")
        .setDescription(`You need to mention someone!`)
        .setColor([255,0,0])
        .setTimestamp(new Date())
        .setFooter({ text: new Date().toDateString(), iconURL: message.author.displayAvatarURL({dynamic:true}) })
        message.channel.send({embeds:[embed]})
        return;
    }
    if (mention.id == message.author.id){
        let embed = new MessageEmbed()
        .setTitle("Nope")
        .setDescription(`You cant vs yourself`)
        .setColor([255,0,0])
        .setTimestamp(new Date())
        .setFooter({ text: new Date().toDateString(), iconURL: message.author.displayAvatarURL({dynamic:true}) })
        message.channel.send({embeds:[embed]})
        return;
    }
    if (mention.bot){
        let embed = new MessageEmbed()
        .setTitle("Nope")
        .setDescription(`You cant vs a bot!`)
        .setColor([255,0,0])
        .setTimestamp(new Date())
        .setFooter({ text: new Date().toDateString(), iconURL: message.author.displayAvatarURL({dynamic:true}) })
        message.channel.send({embeds:[embed]})
        return;
    }
    let dr = new MessageEmbed()
    .setTitle(`${mention.username}#${mention.discriminator}\n${message.author.username}#${message.author.discriminator} Requested a Duel`)
    .setColor([0,255,0])
    .setTimestamp(new Date())
    .setFooter({ text: new Date().toDateString(), iconURL: message.author.displayAvatarURL({dynamic:true}) })
    var dmsg = await message.channel.send({embeds:[dr]})
    if (!await confirmDuel(message,mention)){
        dmsg.delete()
        let embed = new MessageEmbed()
        .setTitle("Rejected The Duel")
        .setColor([255,0,0])
        .setTimestamp(new Date())
        .setFooter({ text: new Date().toDateString(), iconURL: message.author.displayAvatarURL({dynamic:true}) })
        message.channel.send({embeds:[embed]})
        return;
    }
    dmsg.delete()
    let match_data = {
        player1:message.author,
        player2:mention,
        tiles:createTiles(),
        turn:"Player1",
        message:undefined,
        id:getRandomInt(99999999)
    }
    match_data.message=await message.channel.send({embeds:[(await createMatchEmbed(message,match_data))]})
    client.matches.push(match_data)
    let embed = new MessageEmbed()
    .setTitle("Match Created ("+match_data.player1.username+"'s Turn)")
    .setDescription(`Your Match Has Started With: **${match_data.player2.username}**`)
    embed.setColor([0,0,255])
    embed.setTimestamp(new Date())
    embed.setFooter({ text: new Date().toDateString(), iconURL: message.author.displayAvatarURL({dynamic:true}) })
    message.channel.send({embeds:[embed]})
}
async function confirmDuel(message,mention){
    const collected = await message.channel.awaitMessages({filter: (m=>m.author.id == mention.id && (m.content.toLowerCase() == "y" || m.content.toLowerCase() == "yes")),time:10000,max:1,errors:['time','max']})
    return (collected.size > 0)
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
    name:"PVP",
    command:"pvp",
    description:"fight another player"
}
