const {client}= require('../index')
const Discord = require('discord.js')
const NCMessage = require('./message').NCMessage
async function mimicUser(guild_id,channel_id,username,whattosay){
    var guild = client.guilds.cache.find(g=>g.id.toString()==guild_id.toString())
    var channel = guild.channels.cache.find(c=>c.id.toString()==channel_id.toString())
    channel.createWebhook(username.toString(),{reason:"Fake User Talking.."}).then(webhook => {
        webhook.send(whattosay.toString()).then(()=>{
            webhook.delete("Finished Talking")
        })
    })
}
module.exports={
    mimicUser:mimicUser
}