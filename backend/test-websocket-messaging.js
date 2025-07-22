import { io } from 'socket.io-client';

// Test tokens
const token1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImlhdCI6MTc1MDcxNjg0OSwiZXhwIjoxNzUwNzE3NzQ5fQ.vulVHx_hh0jk598PrRVmQyqzjZ9o8v-g33qtf6pfoAA'; // Lucas
const token2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjM0LCJpYXQiOjE3NTA3MTY2OTgsImV4cCI6MTc1MDcxNzU5OH0.e22nJv_Ifta64_rL4keGgQVRRcdeq-WWW7DyyOxSMiU'; // Pierre

const roomId = 94; // The direct message room we created

async function testDirectMessaging() {
    console.log('🚀 Starting WebSocket direct messaging test...');
    
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
        
        socket1.on('connect_error', (error) => {
            console.error('❌ Lucas connection error:', error);
        });
        
        socket2.on('connect_error', (error) => {
            console.error('❌ Pierre connection error:', error);
        });
    });
    
    // Join the room
    console.log(`🏠 Both users joining room ${roomId}...`);
    socket1.emit('join_room', roomId);
    socket2.emit('join_room', roomId);
    
    // Set up message listener for Pierre (User 34)
    socket2.on('message_received', (message) => {
        console.log('📨 Pierre received message:', {
            id: message.id,
            content: message.content,
            sender: message.sender?.prenom,
            room: message.chat_room_id
        });
        console.log('✅ DIRECT MESSAGING TEST PASSED! 🎉');
        
        // Clean up
        socket1.disconnect();
        socket2.disconnect();
        process.exit(0);
    });
    
    // Set up error listeners
    socket1.on('error', (error) => {
        console.error('❌ Lucas socket error:', error);
    });
    
    socket2.on('error', (error) => {
        console.error('❌ Pierre socket error:', error);
    });
    
    // Send message from Lucas to Pierre after a short delay
    setTimeout(() => {
        console.log('📤 Lucas sending message to Pierre...');
        socket1.emit('send_message', {
            chatRoomId: roomId,
            content: 'Hello Pierre! This is a test message from Lucas. Can you receive this?',
            messageType: 'text'
        });
    }, 2000);
    
    // Timeout after 15 seconds
    setTimeout(() => {
        console.log('❌ Test timed out - message not received within 15 seconds');
        console.log('This could indicate an issue with:');
        console.log('- WebSocket room joining');
        console.log('- Message broadcasting');
        console.log('- Database message storage');
        console.log('- User authentication in WebSocket');
        
        socket1.disconnect();
        socket2.disconnect();
        process.exit(1);
    }, 15000);
}

testDirectMessaging().catch(error => {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
});
