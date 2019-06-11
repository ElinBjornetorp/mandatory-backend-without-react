const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs');

let messages = {};

//Fetching stored messages
fs.readFile('./messages.json', (err, data) => {
  if (err) {
    //If there is no file or the file is empty, do nothing.
    //*It is recommended by Node.js to handle the error here instead of checking for the existance of the file before calling readFile.
    console.log(err);
    return;
  }

  else {
    try {
      //Parse messages
      let storedMessages = JSON.parse(data);
      console.log('storedMessages: ', storedMessages);

      //Update 'messages'
      messages = storedMessages;
    }
    catch(error) {
      throw new Error('Oops, something went wrong! Probably not JSON.');
    }
  }
});

function roomDoExist(roomName) {
  for(let room in messages) {
    if(roomName === room) {
      return true;
    }
  }
  return false;
}

function createId(room) {
  let nr = 1;
  let messagesInRoom = messages[room].messages;
  console.log('messagesInRoom: ', messagesInRoom);

  if(messagesInRoom.length > 0) {
    let latestMessageId = messagesInRoom[messagesInRoom.length - 1].id;
    console.log('latestMessageId: ', latestMessageId);
    let latestMessageNr = parseInt(latestMessageId.split('-')[1]);
    console.log('latestMessageNr: ', latestMessageNr);
    nr = latestMessageNr + 1;
  }
  return 'message-' + nr;
}

// ---------------- Middlewares ---------------------------

app.use(express.json());

// --------------- Routes --------------------------------

app.get('/messages/:room', (request, response) => { // This route returns all messages in a room
  let room = request.params.room;

  //Validation: Check that the room exists.
  if(roomDoExist(room) === false) {
    response.status(404).end();
    return;
  }

  let messagesInRoom = messages[room].messages;
  response.json(messagesInRoom);
});

app.get('/rooms', (request, response) => {
  let allRooms = Object.keys(messages);
  console.log('allRooms: ', allRooms);
  response.json(allRooms);
});

app.post('/rooms', (request, response) => { //This route creates a new room
  //This route expects JSON that converts into a JavaScript object: {roomName: 'living room'}
  // ? Question: Sending a string instead? How?
  let roomName = request.body.roomName;

  //Validation: Room name must be a string that is no longer than 20 characters
  if(typeof roomName !== 'string' || roomName.length > 20) {
    response.status(400).end();
    return;
  }

  messages[roomName] = {name: roomName, messages: []};

  console.log('messages: ', messages);

  //Saving messages object with the new key (=room)
  fs.writeFile('./messages.json', JSON.stringify(messages), function(error) {
    if(error) console.log(error);
    console.log('New room saved in messages.json');
  });

  //Ending response
  response.status(201).end();
});

app.post('/messages/:room', (request, response) => {
  //Adding a new message. Expecting JSON with a username key and a content key.
  let room = request.params.room;
  let username = request.body.username;
  let content = request.body.content;

  //Validating that the room exists
  if(roomDoExist(room) === false) {
    response.status(404).end();
    return;
  }

  //Validating that 'username' and 'content' are strings
  if(typeof username !== 'string' || typeof content !== 'string') {
    response.status(400).end();
    return;
  }

  //Creating new object
  let newMessage = {
    username: username,
    content: content,
    id: createId(room),
  };

  console.log('newMessage: ', newMessage);

  //Adding new message to the room
  messages[room].messages.push(newMessage);

  console.log('messages: ', messages);

  //Updating messages.json
  fs.writeFile('./messages.json', JSON.stringify(messages), function() {
    console.log('messages.json updated');
  });

  //Emitting message
  //*Not implemented yet...

  response.status(201).json(newMessage);
});


app.listen(port, () => console.log('Example app listening on port ' + port));
