const fs = require('fs')
module.exports.end = async(client,index)=>{
    let match = client.matches[index]
    client.matches.splice(index,1)
    fs.readdir('../datacollection','utf-8',function(err){
        if (err) return console.log(err)
        fs.rm(`../datacollection/data-match-${match.id}`,function(err){
            if (err) return;
        })
    })
}
module.exports.write = async(x,y,match)=>{
    fs.mkdir('../datacollection',function(err){
        if (err) return console.log(err)
        fs.appendFile(`../datacollection/data-match-${match.id}`,`${x},${y}\n`,'utf-8',function(err){
            if (err) return console.log(err)
        })
    })
}