const form = document.getElementById('changePwd');
form.addEventListener('submit', changePwd);

async function changePwd(event) {
    event.preventDefault();
    const password = document.getElementById('password').value;

    const result = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify ({
            newpassword: password,
            token: localStorage.getItem('token')
        })
    }).then((res) => res.json());

    if (result.status === 'ok') {
        console.log(`Got the token: ${result.data}`)
        location.href = '/login';
    } else {
        alert(result.error);
    }
}