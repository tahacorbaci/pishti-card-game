var url = require('url');
var express = require('express');   
             
var app = express();
var serv = require('http').Server(app);
app.use('/static',express.static(__dirname+'/client/img/final'));   
var pathname;
 
var keypress = require('keypress');
keypress(process.stdin);
 
app.get('/hand',function(req,res){  
    res.sendFile(__dirname+'/client/mustafa.html');
    pathname = url.parse(req.url).pathname; // pathname = '/MyApp' 
});
 
app.get('/table',function(req,res){ 
    res.sendFile(__dirname+'/client/zeynep.html');
    pathname = url.parse(req.url).pathname; // pathname = '/MyApp'  
});
 
 
serv.listen(3000);
console.log('server started');
 
var TV_SOCKET_LIST={};
var PHONE_SOCKET_LIST={};
var PLAYER_LIST={};
var pack=[];
var table= new Array(4);
var hand= new Array(4);
for (var i=0; i<4;i++)
    table[i]='b';
for (var i=0; i<4;i++) 
    hand[i]='b';
var Player = function(id){
    var self={
        id:id,
        name:"",
        score:"",
         
        }
    return self;
}
Player.update=function(){   
    var pack = [];
    for(var i in PLAYER_LIST){
        var player =  PLAYER_LIST[i];   
        pack.push({
            id:player.id,
            name:player.name,
        });
    }
    return pack;
}
 
 
console.log("Cards shuffled");
 
updatePlayers=function(){   
    pack=Player.update();
    for(var i in TV_SOCKET_LIST){
        var tvsocket = TV_SOCKET_LIST[i];       
        tvsocket.emit('userInfo',pack);     
    }
}
 
 
/*
//keypress function
process.stdin.on('keypress', function(ch, key) {
    if (key.name == 'c') {
        var cardId= Math.floor(Math.random() * 52);
        for ( var i in TV_SOCKET_LIST){ 
            socket = TV_SOCKET_LIST[i];
            socket.emit('cardPlayed',{id:cardId});          
        }           
    }
});
*/
 
var turnId;
var start;
var card;
var pId;
var tour;
 
var i=0;
var j=0;
var io = require('socket.io')(serv,{});
io.sockets.on('connection',function(socket){    
     
    if((i<4)&&(pathname=="/hand")&&(start!=true)){   
        var k=0;
        while(hand[k]!='b')
            k++;
        hand[k]='d';
        socket.id=k;    
        PHONE_SOCKET_LIST[socket.id]= socket;
        var player = Player(socket.id); 
         
        socket.on('signIn',  function(data) {
            player.name = data.name;    
            PLAYER_LIST[socket.id] = player;
            updatePlayers();        
        });
        socket.on('clicked',function(data){
            for (var m in TV_SOCKET_LIST){
                tvsocket= TV_SOCKET_LIST[m];
                tvsocket.emit('cardPlayed',{id:data.id});
                console.log(data.id);
            }
        });
                 
        i++;
        console.log("phone "+player.id+" G "+hand[player.id]+':d');             
         
        socket.on('disconnect',function(){                          
            console.log("phone "+ player.id+" Ç "+hand[player.id]+':b');
            delete PHONE_SOCKET_LIST[player.id];
            delete PLAYER_LIST[player.id];
            hand[player.id]='b';
            i--;            
            updatePlayers();            
        });
             
    }else if((j<4)&&(pathname=="/table")){   
        var k=0;
        while(table[k]!='b')
            k++;
        table[k]='d';   
        socket.id=k;
        TV_SOCKET_LIST[socket.id]= socket;  
        var player = Player(socket.id);     
        j++;
        console.log("tv "+player.id+" G "+table[player.id]+':d');       
        updatePlayers();
         
        socket.on('start', function(data){
            start=data;
            console.log("start = "+start);
        });
         
        socket.on('score',function(data){
            phonesocket=PHONE_SOCKET_LIST[data.id];
            phonesocket.emit('newScore',{score:data.score});
        });
         
        socket.on('turnMsg',function(data) {
            try{                
                turnId=data;
                console.log(turnId+" Turn");
                phonesocket = PHONE_SOCKET_LIST[turnId];            
                phonesocket.emit('turn',{bool:true});
                throw new Error('Player disconnected.');
            }
            catch(err){
                return err;
                }
        });
        socket.on('end',function(data){
            tour=data.bool;
        });
        if(tour!=true){
            socket.on('deal',function(data) {
                try{
                    console.log(data.p+"  playerID "+data.c+"  cardID ");
                    phonesocket = PHONE_SOCKET_LIST[data.p];                
                    phonesocket.emit('new',{id:data.c});    
                    throw new Error('Player disconnected.');
                    }
                    catch(err){
                        return err;
                    }
            });
        }
     
        socket.on('disconnect',function(){                          
            console.log("tv "+player.id+" Ç "+table[player.id]+':b');
            table[player.id]='b';           
            j--;
            delete TV_SOCKET_LIST[player.id];               
            updatePlayers();    
            });
             
             
         
    }else {
        //connection deny?
        console.log("Masa dolu.");
        socket.emit('connectionDenied', {});
    }
     
});