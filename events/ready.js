const {client} = require('../index')
const {createMatchEmbed} = require('../commands/pve').assistfunctions
const {mimicUser} = require("./commandutils")
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
client.on('ready',async ()=>{
    console.log("Client Logged In!")
    client.user.setStatus('online')
    client.user.setActivity({name:"Noughts And Crosses",type:'PLAYING'})
    await require('../database/databasecontroller.js').init()
    setUsername()
    setInterval(() => {
        OperateAI()
    }, 1000);
})
function setUsername(){
    client.guilds.cache.forEach(guild=>{
        var clientmember = guild.members.cache.find(m=>m.id.toString()==client.user.id.toString())
        if (clientmember.nickname == "Noughts And Crosses") return
        clientmember.setNickname("Noughts And Crosses","Set Chosen Nickname")
    })
}
async function OperateAI(){
    var matches = client.matches.filter(m=>m.player2.isAI != undefined)
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        if (match.turn != "Player2") return;
        if (match.tiles.filter(t=>t.owner.toLowerCase() == "none").length <= 0){
            let message = match.message
            var embed = await createMatchEmbed(match.message,match)
            embed.setTitle("Match (Player Turn)")
            embed.addField(`Game Over!`,`Victor Undecided!`)
            await match.message.channel.send({embeds:[embed]})
            if (match.player2.isAI){
                mimicUser(message.guild.id,message.channel.id,match.player2.name,match.player2.losedialog[getRandomInt(match.player2.losedialog.length-1)])
            }
            require('../matchutils/endmatch').end(client,i)
            return;
        } else {
            let ai = match.player2
            if (ai.tier == "WeakAI"){
                let tile = weakAIMove(match,ai)
                if (tile){client.matches[i].tiles=setTileAlligence(tile,"Player2",match.tiles)}
                if (tile){savematchdata(tile,match)}
            } else if (ai.tier=="HardAI"){
                let tile = hardAIMove(match,ai)
                if(tile){client.matches[i].tiles=setTileAlligence(tile,"Player2",match.tiles)}
                if (tile){savematchdata(tile,match)}
            } else if (ai.tier=="NeuAI"){
                let tile = neuAIMove(match,ai)
                if(tile){client.matches[i].tiles=setTileAlligence(tile,"Player2",match.tiles)}
                if (tile){savematchdata(tile,match)}
            }
            let message = match.message
            let result = checkCompletion(match.tiles)
            if (result[0] == true){
                var embed = await createMatchEmbed(match.message,match)
                if (result[1]!= undefined){
                    var victor = getVictorObject(result[1],match)
                    embed.setTitle("Match (AI Turn)")
                    embed.addField(`Game Over!`,`**${victor.name}** Wins!`)
                    await match.message.channel.send({embeds:[embed]})
                    if (result[1] == "Player1" && match.player2.isAI){
                        mimicUser(message.guild.id,message.channel.id,match.player2.name,match.player2.losedialog[getRandomInt(match.player2.losedialog.length-1)])
                    } else if (result[1] == "Player2" && match.player2.isAI){
                        mimicUser(message.guild.id,message.channel.id,match.player2.name,match.player2.windialog[getRandomInt(match.player2.windialog.length-1)])
                    }
                    client.matches.splice(i,1)
                    return;
                } else {
                    embed.setTitle("Match (AI Turn)")
                    embed.addField(`Game Over!`,`Victor Undecided!`)
                    await match.message.channel.send({embeds:[embed]})
                    if (match.player2.isAI){
                        mimicUser(message.guild.id,message.channel.id,match.player2.name,match.player2.losedialog[getRandomInt(match.player2.losedialog.length-1)])
                    }
                    require('../matchutils/endmatch').end(client,i)
                    return;
                }
            } else {
                client.matches[i].turn="Player1"
                var embed = await createMatchEmbed(match.message,match)
                embed.setTitle("Match (AI Turn)")
                await match.message.channel.send({embeds:[embed]})
            }
        }
    }
}
function savematchdata(tile,match){
    require('../matchutils/endmatch').write(tile.x,tile.y,match)
}
function setTileAlligence(tile,side,tiles){
    let newtiles=[]
    tiles.forEach(t_tile => {
        if (t_tile.x==tile.x && t_tile.y == tile.y){
            newtiles.push({x:t_tile.x,y:t_tile.y,owner:side})
        } else {
            newtiles.push(t_tile)
        }
    });
    return newtiles
}
function weakAIMove(match,ai){
    var avalibletiles=getAvalibleTiles(match.tiles)
    let tile = avalibletiles[getRandomInt(avalibletiles.length-1)]
    if (!tile) return null
    return tile
}
function hardAIMove(match,ai){//hard ai will attempt to place its nodes where ever it can potentially form a line
    var ownedtiles = match.tiles.filter(t=>t.owner.toLowerCase() == "player2")
    if (ownedtiles.length <= 0){
        var tiles=match.tiles.filter(t=>t.owner.toLowerCase()=="none")
        var tile = tiles[getRandomInt(tiles.length-1)]
        return tile
    } else {
        let totalpotentialtiles=[]
        ownedtiles.forEach(tile => {
            var t_x = tile.x
            var t_y = tile.y
            var tile_owner = tile.owner
            var adjacenttiles = getHardClaimableTiles(t_x,t_y,tile_owner,match)
            totalpotentialtiles.push(adjacenttiles)
        });
        var tb = getLargestSubArray(totalpotentialtiles)
        if (tb.length > 0){
            var tile = tb[getRandomInt(tb.length-1)]
            return tile
        }
    }
    return match.tiles.filter(t=>t.owner.toLowerCase()=="none")
}
function getLargestSubArray(parentarray){
    let largesize=0
    let Tarray=[]
    parentarray.forEach(array => {
        if (array.length > largesize){
            Tarray=array
            largesize=array.length
        }
    });
    return Tarray
}
function getHardClaimableTiles(x,y,owner,match){
    var adjacenttiles=[]
    if (owner == "Player2"){
        //if left then claim right
        let checktiles=[x-1,y,x+1,y]
        if (isTileOwned(checktiles[0],checktiles[1],owner,match) && isTile(checktiles[2],checktiles[3],match) && isTileUnowned(checktiles[2],checktiles[3],match)){adjacenttiles.push(getTileAtPos(checktiles[2],checktiles[3],match))}
        //if down then claim up
        checktiles=[x,y-1,x,y+1]
        if (isTileOwned(checktiles[0],checktiles[1],owner,match) && isTile(checktiles[2],checktiles[3],match) && isTileUnowned(checktiles[2],checktiles[3],match)){adjacenttiles.push(getTileAtPos(checktiles[2],checktiles[3],match))}
        //if right then claim left
        checktiles=[x+1,y,x-1,y]
        if (isTileOwned(checktiles[0],checktiles[1],owner,match) && isTile(checktiles[2],checktiles[3],match) && isTileUnowned(checktiles[2],checktiles[3],match)){adjacenttiles.push(getTileAtPos(checktiles[2],checktiles[3],match))}
        //if up then claim down
        checktiles=[x,y+1,x,y-1]
        if (isTileOwned(checktiles[0],checktiles[1],owner,match) && isTile(checktiles[2],checktiles[3],match) && isTileUnowned(checktiles[2],checktiles[3],match)){adjacenttiles.push(getTileAtPos(checktiles[2],checktiles[3],match))}
    
        //diagonal
    
        //if TR then claim BL
        checktiles=[x+1,y+1,x-1,y+1]
        if (isTileOwned(checktiles[0],checktiles[1],owner,match) && isTile(checktiles[2],checktiles[3],match) && isTileUnowned(checktiles[2],checktiles[3],match)){adjacenttiles.push(getTileAtPos(checktiles[2],checktiles[3],match))}
        //if BR then claim TR
        checktiles=[x-1,y-1,x+1,y-1]
        if (isTileOwned(checktiles[0],checktiles[1],owner,match) && isTile(checktiles[2],checktiles[3],match) && isTileUnowned(checktiles[2],checktiles[3],match)){adjacenttiles.push(getTileAtPos(checktiles[2],checktiles[3],match))}
        //if TL then claim BR
        checktiles=[x-1,y+1,x+1,y+1]
        if (isTileOwned(checktiles[0],checktiles[1],owner,match) && isTile(checktiles[2],checktiles[3],match) && isTileUnowned(checktiles[2],checktiles[3],match)){adjacenttiles.push(getTileAtPos(checktiles[2],checktiles[3],match))}
        //if BL then claim TR
        checktiles=[x+1,y-1,x-1,y-1]
        if (isTileOwned(checktiles[0],checktiles[1],owner,match) && isTile(checktiles[2],checktiles[3],match) && isTileUnowned(checktiles[2],checktiles[3],match)){adjacenttiles.push(getTileAtPos(checktiles[2],checktiles[3],match))}
        if (adjacenttiles.length <= 0){adjacenttiles=findAdjacentTiles(x,y,match)}
    } else if (owner.toLowerCase() == "none"){
        let shouldclaim=false
        if (isTileOwned(x-1,y,"Player2",match)){shouldclaim=true}
        if (isTileOwned(x+1,y,"Player2",match)){shouldclaim=true}
        if (isTileOwned(x,y-1,"Player2",match)){shouldclaim=true}
        if (isTileOwned(x,y+1,"Player2",match)){shouldclaim=true}
        if (isTileOwned(x-1,y-1,"Player2",match)){shouldclaim=true}
        if (isTileOwned(x+1,y+1,"Player2",match)){shouldclaim=true}
        if (isTileOwned(x-1,y+1,"Player2",match)){shouldclaim=true}
        if (isTileOwned(x+1,y-1,"Player2",match)){shouldclaim=true}
        if (shouldclaim){adjacenttiles=[getTileAtPos(x,y,match)]}
    }
    if (adjacenttiles.length <= 0){adjacenttiles=match.tiles.filter(t=>t.owner.toLowerCase()=="none")}
    return adjacenttiles
}
function findAdjacentTiles(x,y,match){
    let adjacenttiles=[]
    let checktiles=[x+1,y,x+2,y]
    if (isTile(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[2],checktiles[3],match)){adjacenttiles.push(getTileAtPos(checktiles[0],checktiles[1],match))}
    //if down then claim up
    checktiles=[x,y+1,x,y+2]
    if (isTile(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[2],checktiles[3],match)){adjacenttiles.push(getTileAtPos(checktiles[0],checktiles[1],match))}
    //if right then claim left
    checktiles=[x-1,y,x-2,y]
    if (isTile(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[2],checktiles[3],match)){adjacenttiles.push(getTileAtPos(checktiles[0],checktiles[1],match))}
    //if up then claim down
    checktiles=[x,y-1,x,y-2]
    if (isTile(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[2],checktiles[3],match)){adjacenttiles.push(getTileAtPos(checktiles[0],checktiles[1],match))}

    //diagonal

    //if TR then claim BL
    checktiles=[x-1,y+1,x-2,y+2]
    if (isTile(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[2],checktiles[3],match)){adjacenttiles.push(getTileAtPos(checktiles[0],checktiles[1],match))}
    //if BR then claim TR
    checktiles=[x+1,y-1,x+2,y-2]
    if (isTile(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[2],checktiles[3],match)){adjacenttiles.push(getTileAtPos(checktiles[0],checktiles[1],match))}
    //if TL then claim BR
    checktiles=[x+1,y+1,x+2,y+2]
    if (isTile(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[2],checktiles[3],match)){adjacenttiles.push(getTileAtPos(checktiles[0],checktiles[1],match))}
    //if BL then claim TR
    checktiles=[x-1,y-1,x-2,y-2]
    if (isTile(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[2],checktiles[3],match)){adjacenttiles.push(getTileAtPos(checktiles[0],checktiles[1],match))}
    if (adjacenttiles.length <= 0){
        if (isTile(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[0],checktiles[1],match)){adjacenttiles.push(getTileAtPos(checktiles[0],checktiles[1],match))}
        //if down then claim up
        checktiles=[x,y+1,x,y+2]
        if (isTile(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[0],checktiles[1],match)){adjacenttiles.push(getTileAtPos(checktiles[0],checktiles[1],match))}
        //if right then claim left
        checktiles=[x-1,y,x-2,y]
        if (isTile(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[0],checktiles[1],match)){adjacenttiles.push(getTileAtPos(checktiles[0],checktiles[1],match))}
        //if up then claim down
        checktiles=[x,y-1,x,y-2]
        if (isTile(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[0],checktiles[1],match)){adjacenttiles.push(getTileAtPos(checktiles[0],checktiles[1],match))}
    
        //diagonal
    
        //if TR then claim BL
        checktiles=[x-1,y+1,x-2,y+2]
        if (isTile(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[0],checktiles[1],match)){adjacenttiles.push(getTileAtPos(checktiles[0],checktiles[1],match))}
        //if BR then claim TR
        checktiles=[x+1,y-1,x+2,y-2]
        if (isTile(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[0],checktiles[1],match)){adjacenttiles.push(getTileAtPos(checktiles[0],checktiles[1],match))}
        //if TL then claim BR
        checktiles=[x+1,y+1,x+2,y+2]
        if (isTile(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[0],checktiles[1],match)){adjacenttiles.push(getTileAtPos(checktiles[0],checktiles[1],match))}
        //if BL then claim TR
        checktiles=[x-1,y-1,x-2,y-2]
        if (isTile(checktiles[0],checktiles[1],match) && isTileUnowned(checktiles[0],checktiles[1],match)){adjacenttiles.push(getTileAtPos(checktiles[0],checktiles[1],match))}
        return adjacenttiles
    }
    return adjacenttiles
}
function getTileAtPos(x,y,match){
    return match.tiles.find(t=>t.x==x&&t.y==y)
}
function isTileUnowned(x,y,match){
    return match.tiles.find(t=>t.x==x&&t.y==y && t.owner.toLowerCase() == "none") != undefined
}
function isTile(x,y,match){
    return match.tiles.filter(t=>t.x==x&&t.y==y) != undefined
}
function isTileOwned(x,y,owner,match){
    var tile = match.tiles.filter(t=>t.x==x&&t.y==y)
    return (tile != undefined && tile.owner == owner)
}
function getAvalibleTiles(tiles){
    let possibletiles=[]
    for (let i = 0; i < tiles.length; i++) {
        const element = tiles[i];
        if (element.owner.toLowerCase() == "none"){possibletiles.push(element)}
    }
    return possibletiles
}
module.exports.readyfunctions ={
    setTileAlligence:setTileAlligence,
    getAvalibleTiles:getAvalibleTiles,
    setUsername:setUsername
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
    if (tiles.filter(t=>t.owner.toLowerCase() == "none").length <= 0) return [true,undefined]
    return [valid,owner]
}
function getVictorObject(victortag,match){
    if (victortag == "Player1") return {
        name:match.player1.username || match.player1.name
    }
    if (victortag == "Player2") return {
        name:match.player2.username || match.player2.name
    }
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