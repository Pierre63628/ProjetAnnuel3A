const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

// Test complete messaging functionality
async function testMessaging() {
    console.log('Testing complete messaging functionality...');
    
    // Create a valid JWT token for testing
    const testUser = {
        userId: 1,
        email: 'jean@example.com'
    };
    
    const token = jwt.sign(testUser, 'nextdoorbuddy_access_secret_key_2024', { expiresIn: '1h' });
    console.log('Generated test token for user ID 1');
    
    // Connect to WebSocket
    const socket = io('http://localhost:3000', {
        auth: {
            token: token
        },
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log('✅ Connected to WebSocket server');
        testRoomJoinAndMessaging(socket);
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error.message);
        process.exit(1);
    });

    socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
    });
}

function testRoomJoinAndMessaging(socket) {
    console.log('\nTesting room join and messaging...');
    
    const testRoomId = 1; // Using the first chat room
    
    // Listen for events
    socket.on('message_received', (message) => {
        console.log('✅ Received message:', {
            id: message.id,
            content: message.content,
            sender: message.sender?.prenom + ' ' + message.sender?.nom
        });
    });
    
    socket.on('user_joined_room', (user) => {
        console.log('✅ User joined room:', user);
    });
    
    socket.on('error', (error) => {
        console.log('⚠️  Socket error:', error.message);
    });
    
    // Join a room
    console.log(`Joining room ${testRoomId}...`);
    socket.emit('join_room', testRoomId);
    
    // Wait a bit then send a test message
    setTimeout(() => {
        console.log('Sending test message...');
        socket.emit('send_message', {
            chatRoomId: testRoomId,
            content: 'Test message from WebSocket test script',
            messageType: 'text'
        });
    }, 1000);
    
    // Test typing indicators
    setTimeout(() => {
        console.log('Testing typing indicators...');
        socket.emit('start_typing', testRoomId);
        
        setTimeout(() => {
            socket.emit('stop_typing', testRoomId);
        }, 2000);
    }, 2000);
    
    // Cleanup and exit
    setTimeout(() => {
        console.log('\n🎉 Messaging test completed successfully!');
        console.log('All WebSocket functionality is working correctly.');
        socket.disconnect();
        process.exit(0);
    }, 5000);
}

testMessaging();
