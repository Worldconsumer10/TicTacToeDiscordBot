const {MessageEmbed} = require('discord.js')
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
module.exports.run = async(message,args,client)=>{
    let embed = new MessageEmbed()
    .setTitle("Help Menu")
    .setColor([0,255,0])
    .setTimestamp(new Date())
    .setFooter({ text: new Date().toDateString(), iconURL: message.author.displayAvatarURL({dynamic:true}) })
    client.commands.forEach((command,index) => {
        embed.addField(`${index+1}`,"Name: `"+command.info.name+"`, Description: "+`**${command.info.description}**, Run With: `+"`"+command.info.command+"!`")
    });
    message.channel.send({embeds:[embed]})
}
module.exports.info = {
    name:"Help Command",
    command:"help",
    description:"view the help list!"
}
