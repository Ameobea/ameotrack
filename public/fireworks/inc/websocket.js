var socket = new WebSocket("ws://ip.ameobea.me:7507/");

socket.onmessage = function(data){
  message = JSON.parse(data.data);
  //console.log("mesage recieved from server: " + message);
  if(message.type == "event"){
    console.log("New event: " + JSON.stringify(message));
  }
}

socket.onerror = function (error) {
  console.log('WebSocket Error ' + error);
};
