const mongoose = require('mongoose')
const options = {
    autoIndex: false, // Don't build indexes
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4 // Use IPv4, skip trying IPv6
  };
const url="mongodb://localhost:27017/T-T-T"
var timeout=1
module.exports = {
    init: async () => {
        mongoose.Promise = global.Promise;
        mongoose.connect(url,options).catch(err => {
            console.log(`An Error Occured: ${err}`)
        })
        mongoose.connection.on('connecting', function(){
            console.log('Attempting To Establish A Connection With The Database')
        })
        mongoose.connection.on('connected', function(){
            console.log('Successfully Connected to Database!')
        })
        mongoose.connection.on('err', function(err){
            console.error(`Connection To Database Encountered A Error: ${err.stack}`);
        })
        mongoose.connection.on('disconnected', function(){
            console.log('Connection To Database Lost!')
            setTimeout(() => {
                this.reconnect()
                timeout++;
            }, timeout*1000);
        })
    },
    reconnect:async()=>{
        mongoose.connect(url,options).catch(err=>console.log(`An Error Occured: ${err}`))
    }
}