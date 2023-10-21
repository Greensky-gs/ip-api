import axios from "axios"

export const sendWebhook = (content: string) => {
    if (!process.env.webhook) return

    axios.request({
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        data: {
            content: content
        }
    }).catch(console.log)
}