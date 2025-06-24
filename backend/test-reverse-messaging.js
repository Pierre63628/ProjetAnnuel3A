import { io } from 'socket.io-client';

// Test tokens
const token1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImlhdCI6MTc1MDcxNjg0OSwiZXhwIjoxNzUwNzE3NzQ5fQ.vulVHx_hh0jk598PrRVmQyqzjZ9o8v-g33qtf6pfoAA'; // Lucas
const token2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjM0LCJpYXQiOjE3NTA3MTY2OTgsImV4cCI6MTc1MDcxNzU5OH0.e22nJv_Ifta64_rL4keGgQVRRcdeq-WWW7DyyOxSMiU'; // Pierre

const roomId = 94; // The direct message room we created

async function testReverseMessaging() {
    console.log('🚀 Starting reverse WebSocket messaging test (Pierre → Lucas)...');
    
    // Create WebSocket connections
    const socket1 = io('http://localhost:3000', { 
        auth: { token: token1 },
        transports: ['websocket']
    });
    
    const socket2 = io('http://localhost:3000', { 
        auth: { token: token2 },
        transports: ['websocket']
    });
    
    // Wait for both connections
    await new Promise((resolve) => {
        let connected = 0;
        
        socket1.on('connect', () => {
            console.log('✅ Lucas (User 3) connected to WebSocket');
            connected++;
            if (connected === 2) resolve();
        });
        
        socket2.on('connect', () => {
            console.log('✅ Pierre (User 34) connected to WebSocket');
            connected++;
            if (connected === 2) resolve();
        });
    });
    
    // Join the room
    console.log(`🏠 Both users joining room ${roomId}...`);
    socket1.emit('join_room', roomId);
    socket2.emit('join_room', roomId);
    
    // Set up message listener for Lucas (User 3)
    socket1.on('message_received', (message) => {
        console.log('📨 Lucas received message:', {
            id: message.id,
            content: message.content,
            sender: message.sender?.prenom,
            room: message.chat_room_id
        });
        console.log('✅ REVERSE MESSAGING TEST PASSED! 🎉');
        
        // Clean up
        socket1.disconnect();
        socket2.disconnect();
        process.exit(0);
    });
    
    // Send message from Pierre to Lucas after a short delay
    setTimeout(() => {
        console.log('📤 Pierre sending message to Lucas...');
        socket2.emit('send_message', {
            chatRoomId: roomId,
            content: 'Hi Lucas! This is Pierre responding. Bidirectional messaging works!',
            messageType: 'text'
        });
    }, 2000);
    
    // Timeout after 15 seconds
    setTimeout(() => {
        console.log('❌ Reverse test timed out');
        socket1.disconnect();
        socket2.disconnect();
        process.exit(1);
    }, 15000);
}

testReverseMessaging().catch(error => {
    console.error('❌ Reverse test failed:', error);
    process.exit(1);
});
