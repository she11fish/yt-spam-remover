const button = document.getElementById("button")
const status = document.getElementById("status")
const green = "background-color: rgb(43, 255, 0)"
const red = "background-color: rgb(255, 0, 0)"
var state

chrome.tabs.query({ currentWindow: true, active: true }, tabs => { 
    const tab = tabs[0]
    chrome.tabs.sendMessage(tab.id, { getStatus: "true" })
        .then(() => console.log('Message sent'))
        .catch(console.log)
})

chrome.runtime.onMessage.addListener((msg) => {
    state = msg.state
    button.style = state ? green : red
    status.innerText = state ? "ON" : "OFF"
})
button.addEventListener("click", (e) => {
    console.log('Clicked')
    chrome.tabs.query({ currentWindow: true, active: true }, tabs => { 
        const tab = tabs[0]
        state = !state
        chrome.tabs.sendMessage(tab.id, { state: `${state ? "on" : "off"}` })
            .then(() => console.log('Message sent'))
            .catch((err) => console.log(err))
    })
    button.style = !state ? green : red
    status.innerText = !state ? "ON" : "OFF"

})
