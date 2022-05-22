const {client} = require('../index')
const {setUsername} = require('./ready').readyfunctions
client.on("guildMemberAdd",(member)=>{
    if (member.id != client.user.id) return;
    setUsername()
})