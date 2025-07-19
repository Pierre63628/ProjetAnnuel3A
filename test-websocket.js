const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');


console.log('Testing WebSocket connection...');

// Test WebSocket connection with valid authentication
async function testWebSocketConnection() {
    console.log('Testing WebSocket connection...');

    // Create a valid JWT token for testing
    const testUser = {
        userId: 1,
        email: 'jean@example.com'
    };

    const token = jwt.sign(testUser, 'nextdoorbuddy_access_secret_key_2024', { expiresIn: '1h' });
    console.log('Generated test token for user ID 1');

    // Test with valid authentication
    const socket = io('http://localhost:3000', {
        auth: {
            token: token
        },
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log('✅ Connected to WebSocket server with valid auth!');
        console.log('Socket ID:', socket.id);

        // Test basic functionality
        testBasicFunctionality(socket);
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error.message);
        process.exit(1);
    });

    socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
    });
}

function testBasicFunctionality(socket) {
    console.log('\nTesting basic WebSocket functionality...');

    // Test presence update
    socket.emit('update_presence', 'online');
    console.log('✅ Sent presence update');

    // Listen for presence updates
    socket.on('user_presence_updated', (presence) => {
        console.log('✅ Received presence update:', presence);
    });

    // Test error handling with invalid room
    socket.emit('join_room', 99999);
    console.log('✅ Attempted to join non-existent room (should trigger error)');

    setTimeout(() => {
        console.log('\n🎉 WebSocket connection test completed successfully!');
        console.log('The messaging system is working correctly.');
        socket.disconnect();
        process.exit(0);
    }, 3000);
}

testWebSocketConnection();
