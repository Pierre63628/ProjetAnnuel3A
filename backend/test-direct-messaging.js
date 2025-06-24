// Simple test script to verify direct messaging functionality
import fetch from 'node-fetch';
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:3000';

// Test credentials (you'll need to replace these with actual user credentials)
const user1 = {
    email: 'user1@example.com',
    password: 'password123'
};

const user2 = {
    email: 'user2@example.com', 
    password: 'password123'
};

async function login(credentials) {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.token;
}

async function createDirectMessage(token, targetUserId) {
    const response = await fetch(`${API_BASE}/api/messaging/direct-message`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ target_user_id: targetUserId })
    });
    
    if (!response.ok) {
        throw new Error(`Create DM failed: ${response.statusText}`);
    }
    
    return await response.json();
}

async function testDirectMessaging() {
    try {
        console.log('🔐 Logging in users...');
        
        // Login both users
        const token1 = await login(user1);
        const token2 = await login(user2);
        
        console.log('✅ Both users logged in successfully');
        
        // Create WebSocket connections
        const socket1 = io(API_BASE, { auth: { token: token1 } });
        const socket2 = io(API_BASE, { auth: { token: token2 } });
        
        // Wait for connections
        await new Promise((resolve) => {
            let connected = 0;
            socket1.on('connect', () => {
                console.log('✅ User 1 connected to WebSocket');
                connected++;
                if (connected === 2) resolve();
            });
            socket2.on('connect', () => {
                console.log('✅ User 2 connected to WebSocket');
                connected++;
                if (connected === 2) resolve();
            });
        });
        
        // Create direct message room (assuming user IDs 1 and 2)
        console.log('💬 Creating direct message room...');
        const dmRoom = await createDirectMessage(token1, 2);
        console.log('✅ Direct message room created:', dmRoom.data.name);
        
        // Join the room
        socket1.emit('join_room', dmRoom.data.id);
        socket2.emit('join_room', dmRoom.data.id);
        
        console.log('🏠 Both users joined the room');
        
        // Set up message listener for user 2
        socket2.on('message_received', (message) => {
            console.log('📨 User 2 received message:', message.content);
            console.log('✅ Direct messaging test PASSED!');
            process.exit(0);
        });
        
        // Send message from user 1
        setTimeout(() => {
            console.log('📤 User 1 sending message...');
            socket1.emit('send_message', {
                chatRoomId: dmRoom.data.id,
                content: 'Hello from User 1! This is a test message.',
                messageType: 'text'
            });
        }, 1000);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            console.log('❌ Test timed out - message not received');
            process.exit(1);
        }, 10000);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testDirectMessaging();
