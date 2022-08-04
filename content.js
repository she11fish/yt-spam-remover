console.log('Running')

var state
const blacklist = []
const reply_data = {}
const comment_data = {}
const screen_loader = 'ytd-continuation-item-renderer'.toUpperCase()

chrome.runtime.onMessage.addListener(msg => { 
    console.log('message received')
    if (msg.getStatus === "true") {
        chrome.runtime.sendMessage({ state: state })
        return
    }

    switch (msg.state) {
        case 'on': {
            console.log('Turning On!')
            state = true
            main()
            break
        }
        case 'off': {
            console.log('Turning Off!')
            state = false
            break
        }
        default: {
            console.log('Error: Could not Identify state')
            break
        }
        
    }
})

function initialize_reply_observers(reply_comments) {
    const config = { childList: true }
    const reply_changes = document.querySelectorAll('ytd-comment-replies-renderer #contents')
    for (let reply_change of reply_changes) reply_comments.observe(reply_change, config)
}

function check_spam(comment, user_comments, comment_box, comment_boxes) {
    for (const [index , user_comment] of user_comments.entries()) {
        current_box = comment_boxes[index]
        if (user_comment === comment && current_box !== comment_box) return true
    }
    return false
}

function intialize_comment_observer(render_comments) {
    const comment_changes = document.querySelector('#primary ytd-item-section-renderer > #contents')
    const config = { childList: true }
    render_comments.observe(comment_changes, config)

}

function comment_contains_url(comment_html) {
    let regex = /<a|<\/a>/g
    let a_tag = comment_html.match(regex)
    let tagging_username = comment_html.match(/@/g)
    if (a_tag) a_tag = a_tag.join("")
    if (tagging_username) tagging_username = tagging_username.join("")
    return a_tag === '<a</a>' && tagging_username !== "@"
}

function reply_callback(entries) {
    const replies_box = entries[0].target.children
    for (const reply_box of replies_box) { 
        // Check if user clicked off
        if (!state) {
            reply_comments.disconnect()
            return
        }

        // Mitigate multiple youtube loading scrolls from rendering
        // only if it appears in the middle of the comment section 
        if (reply_box.nodeName === screen_loader) { 
            // Check if last element is screen loader
            let last_index = replies_box.length - 1
            if (replies_box[last_index] === reply_box) 
                break
            reply_box.style = "display: none !important"
            continue
        } 

        let channel_name = reply_box.querySelector('span').innerText.trim()
        
        if (blacklist.includes(channel_name)) {
            reply_box.style = "display: none !important"
            continue
        }

        // Check if the tag has already been checked before
        let check_duplicate_box = reply_box.getAttribute('check')
        if (check_duplicate_box) { 
            continue 
        }
        reply_box.setAttribute("check","true")

        let reply = reply_box.querySelector('ytd-expander yt-formatted-string').innerText
        let comment_html = reply_box.querySelector('ytd-expander yt-formatted-string').innerHTML

        // Check if comment contains url 
        if (comment_contains_url(comment_html)) {
            blacklist.push(channel_name)
            reply_box.style = "display: none !important"
            continue
        }

        if (!reply_data.hasOwnProperty(channel_name)) {
            reply_data[channel_name] = { reply_boxes: [reply_box], replies: [reply] } 
        } else {
            var replies = reply_data[channel_name].replies
            var reply_boxes = reply_data[channel_name].reply_boxes

            if (check_spam(reply, replies, reply_box, reply_boxes)) {
                blacklist.push(channel_name)

                replies.push(reply)
                reply_boxes.push(reply_box)

                for (let comment_box of reply_boxes) 
                    comment_box.style = "display: none !important"
                delete reply_data[channel_name]
            }
        } 
    }
}

function end_page_callback() {
    if (!state) {
        end_page.disconnect()
        return
    }
    let comment_box = document.querySelector(
        '#primary ytd-item-section-renderer > #contents > ytd-continuation-item-renderer'
        )
    let comments_added = 20
    for (let i = comments_added - 1; i >= 0; i--) {
        // Check if comment_box is a real comment
        if (!comment_box || !comment_box.previousSibling) 
            continue 
        comment_box = comment_box.previousSibling
        
        // Check if comment_box is a screen loader
        if (comment_box.nodeName === screen_loader) 
            return

        let channel_name = comment_box.querySelector('span').innerText.trim()


        if (blacklist.includes(channel_name)) {
            comment_box.style = "display: none !important"
            continue
        } 

        // Check if comment has already been checked before
        let check_duplicate_box = comment_box.getAttribute('check')
        if (check_duplicate_box) 
            continue 
        comment_box.setAttribute("check", "true")

        let comment = comment_box.querySelector('ytd-expander yt-formatted-string').innerText

        if (!comment_data.hasOwnProperty(channel_name)) {
            comment_data[channel_name] = { 
                comment_boxes: [comment_box], 
                comments: [comment] 
            }
        } else {
            var comments = comment_data[channel_name].comments
            var comment_boxes = comment_data[channel_name].comment_boxes
            if (check_spam(comment, comments, comment_box, comment_boxes)) {
                blacklist.push(channel_name)

                comments.push(comment)
                comment_boxes.push(comment_box)

                for (let comment_box of comment_boxes) 
                    comment_box.style = "display: none !important"
                delete comment_data[channel_name]
                continue
            } 
        } 

        // Check if comment contains url
        let comment_html = comment_box.querySelector('ytd-expander yt-formatted-string').innerHTML
        if (comment_contains_url(comment_html)) {
            blacklist.push(channel_name)
            comment_box.style="display: none !important"
        }
    }
}

function main() {
    if (!state)  
        return

    const render_comments = new MutationObserver(entries => {
        // Iterates through all mutations recorded
        entries.forEach(entry => {
            // Check if user clicked off
            if (!state) {
                render_comments.disconnect()
                return
            }

            // Add intersection observer to screen loader
            let comment_box = entry.addedNodes[0]
            if (comment_box && comment_box.nodeName === screen_loader) { 
                end_page.observe(comment_box)
                return
            }
        })
        initialize_reply_observers(reply_comments)
    })

    setTimeout(intialize_comment_observer(render_comments), 1000)

    const reply_comments = new MutationObserver(reply_callback)
    
    const end_page = new IntersectionObserver(end_page_callback)
}