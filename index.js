const Discord = require('discord.js')
const fs = require('fs')
const colors = require('colors')
const {token} = require('./config.json')
const Intents = Discord.Intents
console.clear()
console.clear()
const client = new Discord.Client({ intents:[Intents.FLAGS.GUILD_MESSAGES,Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,Intents.FLAGS.DIRECT_MESSAGE_TYPING,Intents.FLAGS.GUILDS,Intents.FLAGS.GUILD_WEBHOOKS] });
client.commands = []
client.ai_names = []
client.matches = []
//matches will be
// {
//     player1=user,
//     player2=user,
//     tiles=tilearray
// }

fs.readdir('./events','utf-8',function(err,files){
    if (err) return console.log(err)
    if (!files) return console.log("No Files")
    let jsfiles = files.filter(f=>f.endsWith('.js'))
    if (jsfiles.length > 0){console.log(`Begging To Load: ${jsfiles.length} Events!`)}
    jsfiles.forEach(file=>{
        try{
            const {} = require(`./events/${file}`)
            console.log(colors.green(`|| Module: ${file} [Loaded Successfully] ||`))
        }catch(err){
            console.log(colors.red(`|| Module: ${file} [Failed To Load] ||`))
            console.log(err)
        }
    })
})
fs.readdir('./commands','utf-8',function(err,files){
    if (err) return console.log(err)
    if (!files) return console.log("No Files")
    let jsfiles = files.filter(f=>f.endsWith('.js'))
    if (jsfiles.length > 0){console.log(`\nBegging To Load: ${jsfiles.length} Commands!`)}
    jsfiles.forEach(file=>{
        try{
            const cmdfile = require(`./commands/${file}`)
            if (!cmdfile.info) {throw new Error("Info Invalid")}
            if (!cmdfile.run) {throw new Error("No Function To Run")}
            client.commands.push({
                info:cmdfile.info,
                run:cmdfile.run
            })
            console.log(colors.green(`|| Module: ${file} [Loaded Successfully] ||`))
        }catch(err){
            console.log(colors.red(`|| Module: ${file} [Failed To Load] ||`))
            console.log(err)
        }
    })
})

let allowed_ai_tiers = ["HardAI","WeakAI"]

client.ai_tiers = allowed_ai_tiers || []

fs.readFile('./ai_names.txt','utf-8',function(err,data){
    if (err) return console.log(err)
    if (!data) return console.log("No AI Names..")
    var name_datas = data.split("\n")
    if (name_datas.length <=0) return;
    console.log("===============")
    console.log("Loading AI Names")
    name_datas.forEach((name_data,name_index) => {
        try{
            let json_data = JSON.parse(name_data)
            if (client.ai_tiers.find(tier=>tier.toLowerCase()==json_data.tier.toLowerCase()) != undefined){
                client.ai_names.push({
                    name:json_data.name,
                    tier:json_data.tier,
                    windialog:json_data.win||[],
                    losedialog:json_data.lose||[],
                    startdialog:json_data.start||[]
                })
                console.log(colors.green(`|| AI Data: ${json_data.name} (Tier: ${json_data.tier}) [Loaded Successfully] ||`))
            } else {
                console.log(colors.red(`|| AI Data: ${json_data.name} (Tier: ${json_data.tier}) [Loaded Successfully But Was Excluded Due To Filter!] ||`))
            }
        }catch(err){
            console.log(colors.red(`|| AI Data (Index): ${name_index} [Failed To Load] ||`))
            console.log(err)
        }
    });
    console.log("===============")
})
client.login(token)
module.exports = {
    client:client
}