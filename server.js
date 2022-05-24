var PORT = process.env.PORT || 3000;
var moment = require('moment');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

var clientInfo = {};

function sendCurrentUsers(socket) {
    var info = clientInfo[socket.id];
    var users = [];

    if (typeof info === 'undefined') {
        return;
    }

    Object.keys(clientInfo).forEach(function(socketId){
        var userInfo = clientInfo[socketId];

        if(info.room === userInfo.room){
            users.push(userInfo.name);
        }
    })

    socket.emit('message',{
        name: 'System',
        text: 'Current users: ' + users.join(', '),
        timestamp: moment().valueOf()
    })
}

io.on('connection', function (socket) {
    console.log('User connected via socket.oi!');

    socket.on('joinRoom', function (req) {
        clientInfo[socket.id] = req;
        socket.join(req.room);
        socket.broadcast.to(req.room).emit('message', {
            name: 'System',
            text: req.name + ' has joined!',
            timestamp: moment().valueOf()
        });
    });

    socket.on('disconnect', function () {
        if (typeof clientInfo[socket.id] !== 'undefined') {
            console.log("Disconnect called");

            socket.leave(clientInfo[socket.id].room);
            io.to(clientInfo[socket.id].room).emit('message', {
                name: 'System',
                text: clientInfo[socket.id].name + ' has left!',
                timestamp: moment().valueOf()
            });

            delete clientInfo[socket.id];
        }
    });
    socket.on('message', function (message) {
        console.log('Message recived:' + message.text);

        if (message.text === '@currentUsers') {
            sendCurrentUsers(socket);
        } else {
            message.timestamp = moment().valueOf();
            //socket.broadcast.emit('message',message);
            io.to(clientInfo[socket.id].room).emit('message', message);
        }
    })


    socket.emit('message', {
        name: 'System',
        text: 'Welcome to the chat application !!',
        timestamp: moment().valueOf()
    });
});

http.listen(PORT, function () {
    console.log('Server Started');
});