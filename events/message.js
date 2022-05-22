const {client} = require('../index')
const {suffix} = require('../config.json')
var NCMessage=[]
client.on('messageCreate',(message)=>{
    if (message.author.bot) return;
    if (message.channel.type != "GUILD_TEXT") return;
    if (!message.content.split(" ").at(0).includes(suffix)) return addToArray(message)
    let command = message.content.split(" ").at(0).split(suffix).join('')
    let args = message.content.split(" ")
    let cmdfile = client.commands.find(c=>c.info.command == command)
    if (!cmdfile) return;
    message.delete()
    cmdfile.run(message,args,client)
})
function addToArray(message){
    if (NCMessage.length >= 100){
        NCMessage.splice(0,1)
        NCMessage.push(message)
    } else {NCMessage.push(message)}
}
module.exports.NCMessage = NCMessage