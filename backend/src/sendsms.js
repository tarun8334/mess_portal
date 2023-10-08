import plivo from 'plivo';

import dotenv from 'dotenv';
dotenv.config();

async function sendSMS(phone, message) {
    let client = new plivo.Client(
        process.env.AUTH_USERNAME,
        process.env.AUTH_PASSWORD);
    const message_created = await client.messages.create({
        src: "1234567890",
        dst: phone,
        text: message
    });
    console.log(message_created);
    console.log("sent sms to", phone);
}

export { sendSMS }