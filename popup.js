const button = document.getElementById("button");
const status = document.getElementById("status")
var state
chrome.tabs.query({ currentWindow: true, active: true }, tabs => { 
    const tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, { getStatus: "true" })
        .then(() => console.log('Message sent'))
        .catch((err) => console.log(err));
});


chrome.runtime.onMessage.addListener((msg, sender, response) => {
    state = msg.state
    console.log(state)
    if (state) {
        button.style = "background-color: rgb(43, 255, 0)"
        status.innerText = "ON"
    } else {
        button.style = "background-color: rgb(255, 0, 0)"
        status.innerText = "OFF"
    }
})
button.addEventListener("click", (e) => {
    console.log('Clicked')
    console.log(chrome.tabs.query)
    chrome.tabs.query({ currentWindow: true, active: true }, tabs => { 
        const tab = tabs[0];
        console.log(chrome.tabs)
        state = !state
        console.log(state)
        chrome.tabs.sendMessage(tab.id, { state: `${state ? "on" : "off"}` })
            .then(() => console.log('Message sent'))
            .catch((err) => console.log(err));
    });
    if (!state) {
        button.style = "background-color: rgb(43, 255, 0)"
        status.innerText = "ON"
    } else {
        button.style = "background-color: rgb(255, 0, 0)"
        status.innerText = "OFF"
    }
});
