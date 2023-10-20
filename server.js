import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Cors from 'cors'
import Pusher from 'pusher';


// App Config
const app = express();
const port = process.env.PORT || 9000;
// Middleware
app.use(express.json());
app.use(Cors());

// DB Config
const myurl =
  'mongodb+srv://admin:JcowVrlN26S6l1Fg@cluster0.ovfcmca.mongodb.net/?retryWrites=true&w=majority';

mongoose
  .connect(myurl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB Connected Successfully'))
  .catch((err) => console.error('Error connecting to the database:', err));

// API Endpoints

const pusher = new Pusher({
  // appId: "1691042",
  // key: "ba110c2a83de5a3b9f65",
  // secret: "c9663e9a6e447be77ffd",
  // cluster: "ap2",
  
  appId : "1691042",
  key : "ba110c2a83de5a3b9f65",
  secret : "c9663e9a6e447be77ffd",
  cluster : "ap2",
  useTLS: true
});

const db = mongoose.connection
db.once("open", () => {
    console.log("DB Connected")
    const msgCollection = db.collection("messagingmessages")
    const changeStream = msgCollection.watch()
    changeStream.on('change', change => {
        console.log(change)
        if(change.operationType === "insert") {
            const messageDetails = change.fullDocument
            pusher.trigger("messages", "inserted", {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            })
            } else {
            console.log('Error trigerring Pusher')
        }
    })
})

app.get('/', (req, res) => res.status(200).send('Hello TheWebDev'));

app.get('/messages/sync', async (req, res) => {
  try {
    const messages = await Messages.find().exec();
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).send(error);
  }
});

app.post('/messages/new', async (req, res) => {
  try {
    const dbMessage = req.body;
    const createdMessage = await Messages.create(dbMessage);
    res.status(201).json(createdMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).send(error);
  }
});

// Listener
app.listen(port, () => console.log(`Listening on localhost: ${port}`));
