const {client} = require('../index');
const {suffix} = require('../config.json')
const { mimicUser } = require('./commandutils');
const {createMatchEmbed} = require('../commands/pve').assistfunctions
const {getAvalibleTiles,setTileAlligence} = require('./ready').readyfunctions
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
client.on('messageCreate',async (message)=>{
    var match = client.matches.find(m=>m.player1.id == message.author.id || m.player2.id == message.author.id)
    if (!match) return;
    if (!message.content.includes(suffix))return
    if (!message.content.startsWith("~"))return
    var cmd = message.content.split("~")[1]
    if (!cmd.includes(",")) return
    if (match.tiles.filter(t=>t.owner.toLowerCase() == "none").length <=0){
        var embed = await createMatchEmbed(match.message,match)
        embed.setTitle("Match (Player Turn)")
        embed.addField(`Game Over!`,`Victor Undecided!`)
        await match.message.channel.send({embeds:[embed]})
        if (match.player2.isAI){
            mimicUser(message.guild.id,message.channel.id,match.player2.name,match.player2.losedialog[getRandomInt(match.player2.losedialog.length-1)])
        }
        var i = getIndex(client,message.author)
        require('../matchutils/endmatch').end(client,i)
        return;
    } else {
        var space = cmd.split(" ")[0]
        var coords = space.split(",")
        var x = coords[0]
        var y = coords[1]
        if (isNaN(x) || isNaN(y)) return;
        savematchdata(coords,match)
        if (!yourturn(message.author,match)){
            if (!match.player2.isAI) return message.channel.send({content:"Its not your turn!"})
            mimicUser(message.guild.id,message.channel.id,match.player2.name,"HEY! Its not your turn!")
            return;
        }
        x=parseInt(x)-1
        y=parseInt(y)-1
        let ptiles = getAvalibleTiles(match.tiles)
        let targettile = ptiles.find(t=>t.x==x&&t.y==y)
        let playerside = getPlayerSide(match,message.author)
        if (playerside == undefined){console.log("Failed to get player side"); return}
        if (targettile){
            client.matches.find(m=>m.player1.id == message.author.id || m.player2.id == message.author.id).tiles=setTileAlligence(targettile,playerside,match.tiles)
        }
        let result = checkCompletion(match.tiles)
        if (result[0] == true){
            var embed = await createMatchEmbed(match.message,match)
            if (result[1]!= undefined){
                var victor = getVictorObject(result[1],match)
                embed.setTitle("Match (Player Turn)")
                embed.addField(`Game Over!`,`**${victor.name}** Wins!`)
                await match.message.channel.send({embeds:[embed]})
                if (result[1] == "Player1" && match.player2.isAI){
                    mimicUser(message.guild.id,message.channel.id,match.player2.name,match.player2.losedialog[getRandomInt(match.player2.losedialog.length-1)])
                } else if (result[1] == "Player2" && match.player2.isAI){
                    mimicUser(message.guild.id,message.channel.id,match.player2.name,match.player2.windialog[getRandomInt(match.player2.windialog.length-1)])
                }
                var i = getIndex(client,message.author)
                client.matches.splice(i,1)
                return;
            } else {
                embed.setTitle("Match (Player Turn)")
                embed.addField(`Game Over!`,`Victor Undecided!`)
                await match.message.channel.send({embeds:[embed]})
                if (match.player2.isAI){
                    mimicUser(message.guild.id,message.channel.id,match.player2.name,match.player2.losedialog[getRandomInt(match.player2.losedialog.length-1)])
                }
                var i = getIndex(client,message.author)
                require('../matchutils/endmatch').end(client,i)
                return;
            }
        } else {
            if (!match.player2.isAI){
                var embed = await createMatchEmbed(match.message,match)
                if (playerside == "Player1"){
                    embed.setTitle(`Match (${match.player2.username}'s Turn)`)
                } else {
                    embed.setTitle(`Match (${match.player1.username}'s Turn)`)
                }
                await match.message.channel.send({embeds:[embed]})
            }
            if (playerside == "Player1"){
                client.matches.find(m=>m.player1.id == message.author.id || m.player2.id == message.author.id).turn="Player2"
            } else {
                client.matches.find(m=>m.player1.id == message.author.id || m.player2.id == message.author.id).turn="Player1"
            }
        }
    }
})
function savematchdata(coords,match){
    require('../matchutils/endmatch').write(coords[0],coords[1],match)
}
function getVictorObject(victortag,match){
    if (victortag == "Player1") return {
        name:match.player1.username || match.player1.name
    }
    if (victortag == "Player2") return {
        name:match.player2.username || match.player2.name
    }
}
function getIndex(client,author){
    for (let i = 0; i < client.matches.length; i++) {
        const element = client.matches[i];
        if (element.player1.isAI == undefined && element.player1.id == author.id) return i;
        if (element.player2.isAI == undefined && element.player2.id == author.id) return i;
    }
    return null;
}
function checkCompletion(tiles){
    let valid = false
    let owner = "none"
    tiles.forEach((tile,index) => {
        if (tile.owner.toLowerCase() != "none"){
            let t_x=tile.x
            let t_y=tile.y
            let tile_owner=tile.owner
            let adjacenttiles=0
            //relative
            //Left -> Right
            let lr=getValidLine(t_x-1,t_y,t_x+1,t_y,tiles,tile_owner)
            //Bottom -> Top
            let bu=getValidLine(t_x,t_y-1,t_x,t_y+1,tiles,tile_owner)
            //BottomLeft -> TopRight
            let bdfu=getValidLine(t_x-1,t_y-1,t_x+1,t_y+1,tiles,tile_owner)
            //TopLeft->BottomRight
            let bufd=getValidLine(t_x-1,t_y+1,t_x+1,t_y-1,tiles,tile_owner)
            let res=(lr || bu || bdfu || bufd)
            if (res==true) {valid=res;owner=tile_owner}
        }
    })
    if (tiles.filter(t=>t.owner.toLowerCase() == "none").length <=0) return [true,undefined]
    return [valid,owner]
}
function getPlayerSide(match,author){
    if (match.player1.isAI == undefined && match.player1.id.toString() == author.id.toString()){return "Player1"}
    if (match.player2.isAI == undefined && match.player2.id.toString() == author.id.toString()){return "Player2"} else {return undefined}
}
function yourturn(author,match){
    if (match.turn=="Player1"){
        if (match.player1.isAI == undefined && match.player1.id.toString() == author.id.toString()){return true}
    }
    if (match.turn=="Player2"){
        if (match.player2.isAI == undefined && match.player2.id.toString() == author.id.toString()){return true}
    }
    return false;
}
function getValidLine(x1,y1,x2,y2,tiles,owner){
    let tile1 = tiles.find(t=>t.x==x1&&t.y==y1)
    let tile2 = tiles.find(t=>t.x==x2&&t.y==y2)
    let tile1valid = (tile1 != undefined)
    let tile2valid = (tile2 != undefined)
    if (tile1valid && tile2valid){
        let tile1owned = (tile1.owner == owner)
        let tile2owned = (tile2.owner == owner)
        return (tile1owned && tile2owned)
    } return false;
}