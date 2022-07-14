console.log('Running')

function check_if_nsfw(predictions) { 
    return !(predictions[0].className === 'Neutral' || predictions[0].className === 'Drawing')
}

async function image_analysis(img) {
    const src = chrome.runtime.getURL('./nsfw.js')
    const nsfwjs = await import(src)
    const model = await nsfwjs.load()
    const predictions = await model.classify(img)
    console.log(predictions)
    const result = check_if_nsfw(predictions)
    console.log(result, img)
    return result
}
var scrolls = 0
var image_counter = 0
window.addEventListener("scroll", (e) => {
    let comments = document.getElementsByTagName('ytd-comment-thread-renderer')
    let imgs 
    if (comments.length) {
        imgs = document.querySelectorAll('ytd-comment-renderer a > yt-img-shadow > img')
        // image_analysis(imgs[scrolls])
        image_analysis(imgs[scrolls])
        scrolls >= comments.length ? scrolls : scrolls++
    }
   
})

