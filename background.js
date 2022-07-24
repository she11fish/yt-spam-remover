console.log('Running')
browser.browserAction.onClicked.addListener(buttonClicked)

function buttonClicked(tab) {
    console.log('button clicked')
    console.log(tab)
}