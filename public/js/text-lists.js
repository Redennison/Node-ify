// Get username from front-end storage
const username = localStorage.getItem('username');
// Get JWT from front-end storage
const token = localStorage.getItem('token')

// Set title as username's lists
document.getElementById('title').innerHTML = `${username}'s Lists`;

// Declare global variables
const lists = document.getElementById('lists'); 
const list_title = document.getElementById('list-title');
const form = document.getElementById('form');
const list = document.getElementById('list');
var user;

// Displays lists + button on left side
const displayLists = (list) => {
    lists.innerHTML = '';
    for (i=0;i<list.length;i++) {
        lists.innerHTML += `<div class='list'><button id='${list[i]._id}' class='py-3 listsButtons' onclick="displayListContents('${list[i]._id}');selectButton('${list[i]._id}')">${list[i].listName}</button></div>`;
    }
    lists.innerHTML += "<div id='addDiv' class='pt-3'><button onclick='addList()' id='addButton' class='py-2 px-3'>+</button></div>";
}

// Makes current list gray on sidebar and others white
const selectButton = (_id) => {
    const listButtons = document.getElementsByClassName('listsButtons');
    for (i=0;i<listButtons.length;i++) {
        listButtons[i].setAttribute('style', 'background-color: white;color: black');
    }
    document.getElementById(_id).setAttribute('style', 'background-color: rgb(87, 85, 85);color: white');
}

// Adjusts scrollable list of people when message or add person form is active
const setHeight = (block) => {
    var height = block.clientHeight + document.getElementById('listsTitle').clientHeight + 16;
    document.getElementById('peopleList').setAttribute('style', `height: calc(100vh - ${height}px)`);
    document.getElementById('peopleList').style.height = `calc(100vh - ${height}px)`;
}

// Disables or enables all buttons
const disableButtons = () => {
    const listButtons = document.getElementsByClassName('listButtons');
    const deletePersonButtons = document.getElementsByClassName('deletePerson');
    const addButton = document.getElementById('addButton');
    const listsButtons = document.getElementsByClassName('listsButtons');
    if (addButton.disabled === true) {
        for (i=0;i<listButtons.length;i++) {
            listButtons[i].disabled = false;
        } for (i=0;i<deletePersonButtons.length;i++) {
            deletePersonButtons[i].disabled = false;
        } for (i=0;i<listsButtons.length;i++) {
            listsButtons[i].disabled = false;
        } addButton.disabled = false;
    } else {
        for (i=0;i<listButtons.length;i++) {
            listButtons[i].disabled = true;
        } for (i=0;i<deletePersonButtons.length;i++) {
            deletePersonButtons[i].disabled = true;
        } for (i=0;i<listsButtons.length;i++) {
            listsButtons[i].disabled = true;
        } addButton.disabled = true;
    }
}

// Messages people in list
const message = (_id) => {
    disableButtons();

    // create form 
    form.innerHTML = `
        <form id='newMessageForm' class='mb-3'>
            <textarea id='messageTextArea' class='py-2 px-2' type='text' placeholder='Enter Message Here...' required></textarea>  <button class='messageButtons py-2' type='submit'>+</button><button class='messageButtons py-2' onclick="displayListContents('${_id}');disableButtons();">-</button>
        </form>
    `;

    const newMessageForm = document.getElementById('newMessageForm');
    setHeight(newMessageForm);
    newMessageForm.addEventListener('submit', sendMessage);
    async function sendMessage(event) {
        event.preventDefault();
        const message = document.getElementById('messageTextArea').value;

        const result = await fetch('/api/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify ({
                username,
                message,
                _id,
                token
            })
        }).then((res) => res.json());

        console.log(result.status);

        if (result.status === 'ok') {
            disableButtons();
            displayListContents(_id);
        } else {
            alert(result.error);
        }
    }
}


// Adds person to list
const addPerson = (_id) => {
    disableButtons();

    // create form 
    form.innerHTML = `
        <form id='addPersonForm' class='mb-3'>
            <input maxlength='40' class='py-2 px-2' id='personName' type='text' placeholder='Name' required/><input class='py-2 px-2' id='personNumber' type='tel' pattern='[0-9]{10}' placeholder='Phone Number' required/><button class='py-2' id='addPerson' type='submit'>+</button><button onclick="displayListContents('${_id}');disableButtons();" id='cancelPerson' class='py-2' onclick='displayLists(user.lists)'>-</button>
        </form>
    `;

    const addPersonForm = document.getElementById('addPersonForm');
    setHeight(addPersonForm);
    addPersonForm.addEventListener('submit', addPerson);
    async function addPerson(event) {
        event.preventDefault();
        const name = document.getElementById('personName').value;
        const number = document.getElementById('personNumber').value;

        const result = await fetch('/api/add-person', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify ({
                username,
                name,
                number,
                _id,
                token
            })
        }).then((res) => res.json());

        if (result.status === 'ok') {
            disableButtons();
            user = result.user;
            displayListContents(_id);
        } else {
            alert(result.error);
        }
    }
};

// Deletes list
async function deleteList(_id, listName) {
    let answer = confirm(`Are you sure you would like to delete ${listName}?`);

    if (answer) {
        const result = await fetch('/api/remove-list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify ({
                username,
                _id,
                token
            })
        }).then((res) => res.json());

        if (result.status === 'ok') {
            user = result.user;
            displayLists(user.lists);
            if (user.lists.length > 0)  {
                displayListContents(user.lists[0]._id);
                document.getElementById(user.lists[0]._id).setAttribute('style', 'background-color: rgb(87, 85, 85);color: white');
            } else {
                form.innerHTML = '';
                list_title.innerHTML = '';
                list.innerHTML = '';

            }
            lists.scrollTop = 0;
        } else { 
            alert(result.error);
        }
    }
}


// Removes person
async function removePerson(person_id, list_id) { 

    const result = await fetch('/api/remove-person', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify ({
            username,
            person_id,
            token
        })
    }).then((res) => res.json());

    if (result.status === 'ok') {
        user = result.user;
        displayListContents(list_id);
    } else {
        alert(result.error);
    }  
}

// Adds list
const addList = () => {
    disableButtons();
    const index = lists.innerHTML.length-119;
    lists.innerHTML = lists.innerHTML.substr(0, index) + `<form id='createForm'><input maxlength='40' class='py-2 px-2' id='listName' type='text' placeholder='List Name' required/><button class='py-2' id='createList' type='submit'>+</button><button id='cancelList' class='py-2' onclick='disableButtons();displayLists(user.lists);'>-</button></form>` + lists.innerHTML.substr(index);

    const createForm = document.getElementById('createForm');
    createForm.addEventListener('submit', createList);
    async function createList(event) {
        event.preventDefault();
        const listName = document.getElementById('listName').value;

        const result = await fetch('/api/create-list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify ({
                listName,
                username,
                token
            })
        }).then((res) => res.json());

        if (result.status === 'ok') {
            disableButtons();
            user = result.user;
            displayLists(user.lists);
            displayListContents(user.lists[user.lists.length-1]._id);
            selectButton(user.lists[user.lists.length-1]._id);
            lists.scrollTop = lists.scrollHeight;
        } else {
            alert(result.error);
        }
    }
};

// Displays list buttons and people in active list
const displayListContents = (_id) => { 
    for (i=0;i<user.lists.length;i++) {
        if (user.lists[i]._id === _id) {
            console.log(user.lists[i].listName);
            // Remove form
            form.innerHTML = '';

            // Set list title
            list_title.innerHTML = `<div id='listsTitle'><h2 class='py-2 px-3' id='listNameTitle'>${user.lists[i].listName}</h2><div class='p-2'><input class='listButtons p-2' type='image' src='images/plus.png' onclick="addPerson('${_id}')"></input><input class='listButtons p-2 mx-3' type='image' src='images/comment.png' onclick="message('${_id}')"></input><input class='listButtons p-2' type='image' src='images/trash.png' onclick="deleteList('${_id}','${user.lists[i].listName}')"></input></div></div>`;
            console.log(list_title.innerHTML);
            // Display people in list
            list_html = `<ul id='peopleList' class='px-1'>`;
            for (j=0;j<user.lists[i].listContents.length;j++) {
                list_html += `<li class='mb-3'><div class='name px-2'>Name: ${user.lists[i].listContents[j].name}</div><div class='number px-2'>Phone Number: ${user.lists[i].listContents[j].number}</div><input class='deletePerson px-2' type='image' src='images/delete.png' onclick="removePerson('${user.lists[i].listContents[j]._id}','${user.lists[i]._id}')"></input></li>`;
            } 
            list_html += '</ul>';
            list.innerHTML = list_html;
            break;
        }
    }
}

// Shows first list when app opened
async function getLists() {
    const result = await fetch('/api/get-lists', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify ({
            username,
            token
        })
    }).then((res) => res.json());

    if (result.status === 'ok') {
        user = result.user;
        displayLists(user.lists);
        if (user.lists.length > 0) {
            displayListContents(user.lists[0]._id);
            selectButton(user.lists[0]._id);
        }
    } else {
        alert('error displaying data');
    }
}

getLists();