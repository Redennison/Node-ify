const express = require('express');
const mongoose = require('mongoose');
const User = require('./model/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Twilio keys
const apiKey = process.env.KEY;
const apiSecret = process.env.SECRET;
const accountSid = process.env.SID;
const client = require('twilio')(apiKey, apiSecret, { accountSid: accountSid });

const JWT_SECRET = process.env.JWT_SECRET;

const app = express();

const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');

mongoose.connect(process.env.URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

app.use(express.static(__dirname + '/public'));
app.use(express.json());

app.get('/', (req, res) => {
    res.redirect('/register');
});

app.get('/register', (req, res) => {
    res.render('register');
})

app.get('/login', (req, res) => {
    res.render('login');
})

app.get('/change-password', (req, res) => {
    res.render('change-password');
})

app.get('/text-lists', (req, res) => {
    res.render('text-lists');
})

app.get('/start-up', (req, res) => {
    res.render('start-up');
})

app.post('/api/get-lists', async (req, res) => {
    const { username } = req.body;
    const user = await User.findOne({ username }).lean(); 
    res.json({ status: 'ok', user });
})

app.post('/api/send-message', async (req, res) => {
    const { username, message, _id } = req.body;

    if (!message || typeof message !== 'string') {
        return res.json({ status: 'error', error: 'Invalid message' });
    }

    const listContents = (await User.findOne({ "lists._id": _id }, { "lists.$": 1 })).lists[0].listContents;
    var success = true;

    return res.json({status: 'error', error: "This website is for demonstration purposes only. SMS messaging is currently disabled as we don't want to allow public access to messaging."})

    try {
        for (i=0;i<listContents.length;i++) {
            client.messages
                .create({
                    body: `Hi ${listContents[i].name},\n${message}\n${username}`,
                    from: '+16043635574',
                    to: `+1${listContents[i].number}`
                })
                .catch(() => {
                    // return res.json error
                    success = false;
                })
                .then(() => {
                    if (!success) {
                        return res.json({ status: 'error', error: 'As this is not a production application the text will not be sent to avoid charges.' });
                    }
                });
        }
    } catch {
        return res.json({ status: 'error', error: 'Unable to send message. Please try again.' });
    }

    res.json({ status: 'ok' });
})

app.post('/api/remove-person', async (req, res) => {
    const { username, person_id: _id } = req.body;

    try {
        await User.updateOne(
            { "lists.listContents._id": _id },
            {
                $pull: 
                {
                    "lists.$.listContents": {
                        _id
                    }
                }
            },
            { multi: true }
        )
    } catch(error) {
        return res.json({ status: 'error', error: 'Unable to remove person. Please try again.' })
    }

    const user = await User.findOne({ username }).lean();

    res.json({ status: 'ok', user });
})

app.post('/api/add-person', async (req, res) => {
    const { username, name, number, _id } = req.body;

    const listContents = (await User.findOne({ "lists._id": _id }, { "lists.$": 1 })).lists[0].listContents;

    for (i=0;i<listContents.length;i++) {
        if (listContents[i].name === name && listContents[i].number === number) {
            return res.json({ status: 'error', error: 'Name/number already exists' });
        }
    }

    if (!name || typeof name !== 'string') {
        return res.json({ status: 'error', error: 'Invalid name' });
    }

    if (!number || typeof number !== 'string') {
        return res.json({ status: 'error', error: 'Invalid number' });
    }

    await User.updateOne(
        { "lists._id": _id },
        { 
            $push: {
                "lists.$.listContents": {
                    name,
                    number
                }
            }
        }
    )

    const user = await User.findOne({ username }).lean();

    res.json({ status: 'ok', user });
})

app.post('/api/remove-list', async (req, res) => {
    const { username, _id } = req.body;

    try {
        await User.updateOne(
            { "lists._id": _id },
            {
                $pull: 
                {
                    lists: {
                        _id
                    }
                }
            },
            { multi: true }
        )
    } catch(error) {
        return res.json({ status: 'error', error: 'Unable to remove list. Please try again.' })
    }

    const user = await User.findOne({ username }).lean();

    res.json({ status: 'ok', user });
})

app.post('/api/create-list', async (req, res) => {
    const { listName, username } = req.body;

    if (await User.find({ username, "lists.listName": listName }).countDocuments() > 0) {
        return res.json({ status: 'error', error: 'You must use different list names' });
    } 

    await User.updateOne(
        { username },
        { 
            $push: { 
                lists: {
                    listName,
                    listContents: []
                }
            }
        }
    )

    const user = await User.findOne({ username }).lean();

    res.json({ status: 'ok', user });
})

app.post('/api/change-password', async (req, res) => {
    const { token, newpassword: plainTextPassword } = req.body;

    if (!plainTextPassword || typeof plainTextPassword !== 'string') {
        return res.json({ status: 'error', error: 'Invalid password' });
    }

    if (plainTextPassword.length < 4) {
        return res.json({ status: 'error', error: 'Password too small. Should be at least 4 characters'});
    }

    try {
        const user = jwt.verify(token, JWT_SECRET);

        const _id = user.id;

        const hashedPassword = await bcrypt.hash(plainTextPassword, 10);

        await User.updateOne(
            { _id }, 
            {
                $set: { password: hashedPassword }
            }
        )
        res.json({ status: 'ok' });
    } catch(error) {
        res.json({ status: 'error', error: 'Unable to change password. Please try again.' });
    }

})

app.post('/api/login', async(req, res) => {
    
    const { username, password } = req.body;
    const user = await User.findOne({ username }).lean(); 

    if (!user) {
        return res.json({ status: 'error', error: 'Invalid username/password'});
    }

    if (await bcrypt.compare(password, user.password)) {

        const token = jwt.sign(
            { 
                id: user._id, 
                username: user.username 
            }, 
            JWT_SECRET
        );

        return res.json({ status: 'ok', data: token, username: user.username });
    }

    res.json({ status: 'error', error: 'Invalid username/password' });
})

app.post('/api/register', async (req, res) => {

    const { username, password: plainTextPassword } = req.body;

    if (!username || typeof username !== 'string') {
        return res.json({ status: 'error', error: 'Invalid username' });
    }

    if (!plainTextPassword || typeof plainTextPassword !== 'string') {
        return res.json({ status: 'error', error: 'Invalid password' });
    }

    if (plainTextPassword.length < 4) {
        return res.json({ status: 'error', error: 'Password too small. Should be at least 4 characters'});
    }

    const password = await bcrypt.hash(plainTextPassword, 10);

    try {
        const response = await new User({
            username,
            password,
            lists: []
        }).save();
        console.log(`User created successfully: ${response}`);
    } catch (error) {
        if (error.code === 11000) {
            return res.json({ status: 'error', error: 'Username already in use' });
        }
    }

    res.json({ status: 'ok' });

})

app.listen(port, () => {
    console.log(`running on port ${port}`);
});