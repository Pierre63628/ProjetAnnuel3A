const { io } = require('socket.io-client');

// Test WebSocket connection
async function testWebSocketConnection() {
    console.log('Testing WebSocket connection...');
    
    // First, let's test without authentication to see if the server responds
    const socket = io('http://localhost:3000', {
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log('✅ Connected to WebSocket server (without auth)');
        socket.disconnect();
        testWithAuth();
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error.message);
        process.exit(1);
    });
}

async function testWithAuth() {
    console.log('\nTesting with authentication...');
    
    // Test with a fake token to see authentication error
    const socket = io('http://localhost:3000', {
        auth: {
            token: 'fake-token'
        },
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log('✅ Connected with auth (unexpected)');
        socket.disconnect();
    });

    socket.on('connect_error', (error) => {
        console.log('✅ Authentication error (expected):', error.message);
        console.log('\n🎉 WebSocket server is working correctly!');
        console.log('The server properly rejects invalid tokens.');
        process.exit(0);
    });
}

testWebSocketConnection();
