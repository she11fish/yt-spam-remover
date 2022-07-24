console.log('Running')

setTimeout(() => {
    const comment_changes = document.querySelector('#primary ytd-item-section-renderer > #contents')
    const config = { childList: true }
    render_comments.observe(comment_changes, config)
}, 3000)

function initialize_reply_observers() {
    const config = { childList: true }
    const reply_changes = document.querySelectorAll('ytd-comment-replies-renderer #contents')
    for (let reply_change of reply_changes) open_reply.observe(reply_change, config)
}

function check_spam(user_comments, comment) {
    for (let user_comment of user_comments) 
        if (user_comment === comment) return true
    return false
}


const render_comments = new MutationObserver((entries) => {
    entries.forEach((entry, i, entries) => {
        let comment_box = entry.addedNodes[0]
        if (!comment_box) return
        if (comment_box.nodeName === 'ytd-continuation-item-renderer'.toUpperCase()) { 
            end_page.observe(comment_box)
            return
        }
    })
    initialize_reply_observers()
})

const blacklist = []
const comment_data = {}

const end_page = new IntersectionObserver(() => {
    console.log('end of page')
    setTimeout(() => { 
        let comment_box = document.querySelector('#primary ytd-item-section-renderer > #contents > ytd-continuation-item-renderer')
        let i = 19
        while (i >= 0) {
            if (!comment_box || !comment_box.previousSibling) { i--; continue }
            comment_box = comment_box.previousSibling
            if (comment_box.nodeName === 'ytd-continuation-item-renderer'.toUpperCase()) return
            console.log(comment_box.parentElement.children)
            let spaces = /\s?(^\s+|\s+$)/g
            let channel_name = comment_box.querySelector('span').innerText.replace(spaces, '')
            if (blacklist.includes(channel_name)) {
                comment_box.style="display: none !important"
                continue
            } 
            let check_duplicate_box = comment_box.getAttribute('check')
            if (check_duplicate_box) { i--; continue }
            console.log(comment_box)
            let img = comment_box.querySelector('img')
            let comment = comment_box.querySelector('ytd-expander yt-formatted-string').innerText
            comment_box.setAttribute("check", "true")
            if (!comment_data.hasOwnProperty(channel_name)) {
                comment_data[channel_name] = { comment_boxes: [comment_box], comments: [comment], img: img }
            } else {
                var comments = comment_data[channel_name].comments
                var comment_boxes = comment_data[channel_name].comment_boxes
                if (check_spam(comments, comment)) {
                    blacklist.push(channel_name)
                    comments.push(comment)
                    comment_boxes.push(comment_box)
                    for (let comment_box of comment_boxes) comment_box.style= "display: none !important"
                    delete comment_data[channel_name]
                    continue
                } 
            } 
            let regex = /<a|<\/a>/g
            let comment_html = comment_box.querySelector('ytd-expander yt-formatted-string').innerHTML
            let a_tag = comment_html.match(regex)
            let tagging_username = comment_html.match(/@/g)
            if (a_tag) a_tag = a_tag.join("")
            if (tagging_username) tagging_username = tagging_username.join("")
            if (a_tag === '<a</a>' && tagging_username !== "@") {
                blacklist.push(channel_name)
                comment_box.style="display: none !important"
                continue
            }
            console.log(comment_data)
            console.log(blacklist)
            i--;
        }
    }, 1000)
})

const reply_data = {}
const open_reply = new MutationObserver((entries) => {
    let replies_box = entries[0].target.children
    let i = 0
    while (i < replies_box.length) { 
        let reply_box = replies_box[i]
        if (reply_box.nodeName === 'ytd-continuation-item-renderer'.toUpperCase()) { 
            if (i === replies_box.length - 1) break
            reply_box.remove()
            i++
            continue
        } 
        let spaces = /\s?(^\s+|\s+$)/g
        let channel_name = reply_box.querySelector('span').innerText.replace(spaces, '')
        if (blacklist.includes(channel_name)) {
            reply_box.remove()
            continue
        }
        let check_duplicate_box = reply_box.getAttribute('check')
        if (check_duplicate_box) { i++; continue }
        reply_box.setAttribute("check","true")
        let img = reply_box.querySelector('img')
        let comment = reply_box.querySelector('ytd-expander yt-formatted-string').innerText
        let regex = /<a|<\/a>/g
        let comment_html = reply_box.querySelector('ytd-expander yt-formatted-string').innerHTML
        let a_tag = comment_html.match(regex)
        let tagging_username = comment_html.match(/@/g)
        if (a_tag) a_tag = a_tag.join("")
        if (tagging_username) tagging_username = tagging_username.join("")
        if (a_tag === '<a</a>' && tagging_username !== "@") {
            blacklist.push(channel_name)
            reply_box.remove()
            i++
            continue
        }
        if (!reply_data.hasOwnProperty(channel_name)) {
            reply_data[channel_name] = {comment_boxes: [reply_box], comments: [comment], img: img} 
        } else {
            var comments = reply_data[channel_name].comments
            var comment_boxes = reply_data[channel_name].comment_boxes
            if (check_spam(comments, comment)) {
                blacklist.push(channel_name)
                comments.push(comment)
                comment_boxes.push(reply_box)
                for (let comment_box of comment_boxes) { comment_box.remove(); }
                delete reply_data[channel_name]
            }
        } 
        i++
    }
})

