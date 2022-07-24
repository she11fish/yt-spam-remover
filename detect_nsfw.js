function check_if_nsfw(predictions) { 
    return !(predictions[0].className === 'Neutral' || predictions[0].className === 'Drawing')
}

async function image_analysis(img, comment_box, channel_name) {
    // Importing nsfwjs module
    const chrome_url = chrome.runtime.getURL('/nsfw.js')
    const exported_module = await import(chrome_url)
    const nsfwjs = exported_module.default
    
    // Allow cross origin to the image
    img.crossOrigin = 'anonymous'

    // Analysis of the image
    const model = await nsfwjs.load()
    const predictions = await model.classify(img)
    
    // Check if the image is nsfw
    const result = check_if_nsfw(predictions)
    if (result) {   
        console.log('Deleted')
        console.log(img.src)
        blacklist.push(channel_name)
        comment_box.style = "display: none !important" 
    }
}