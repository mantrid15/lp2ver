// https://github.com/Ajaykumbhare/chatgpt-free-api
import { chat } from 'chatgpt-free-api';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

async function startChat(message) {
    try {
        const response = await chat.startConversation(message);
        if (response && response.error) {
            console.error('API Error:', response.error);
        } else {
            console.log(response);
        }
    } catch (error) {
        console.error('Error starting conversation:', error);
    }
}

async function chainChatMessages() {
    try {
        const firstResponse = await chat.startConversation('What is the output of 10 + 20?');
        if (firstResponse && firstResponse.error) {
            console.error('API Error:', firstResponse.error);
            return;
        }
        console.log(firstResponse);

        const secondResponse = await chat.startConversation('Multiply by 5', firstResponse.conversation_id);
        if (secondResponse && secondResponse.error) {
            console.error('API Error:', secondResponse.error);
            return;
        }
        console.log(secondResponse);
    } catch (error) {
        console.error('Error in chained conversation:', error);
    }
}

// Start a conversation with a single message
startChat('What is the output of 10 + 20?');
