const socket = new WebSocket('ws://ameo.link:7507/');

socket.onmessage = data => {
  const message = JSON.parse(data.data);
  //console.log("mesage recieved from server: " + message);
  if (message.type == 'event') {
    console.log('New event: ' + JSON.stringify(message));
  }
};

socket.onerror = error => console.log('WebSocket Error: ' + error);
