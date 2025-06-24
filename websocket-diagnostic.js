const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

// Comprehensive WebSocket diagnostic
async function runDiagnostic() {
    console.log('🔍 Starting comprehensive WebSocket diagnostic...\n');
    
    // Step 1: Test basic connectivity
    console.log('1. Testing basic server connectivity...');
    try {
        const response = await fetch('http://localhost:3000/health');
        if (response.ok) {
            console.log('✅ Backend server is reachable');
        } else {
            console.log('⚠️  Backend server responded with status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend server is not reachable:', error.message);
        return;
    }
    
    // Step 2: Test WebSocket connection without auth
    console.log('\n2. Testing WebSocket connection without authentication...');
    await testConnectionWithoutAuth();
    
    // Step 3: Test WebSocket connection with invalid auth
    console.log('\n3. Testing WebSocket connection with invalid authentication...');
    await testConnectionWithInvalidAuth();
    
    // Step 4: Test WebSocket connection with valid auth
    console.log('\n4. Testing WebSocket connection with valid authentication...');
    await testConnectionWithValidAuth();
    
    console.log('\n🎉 Diagnostic completed!');
}

function testConnectionWithoutAuth() {
    return new Promise((resolve) => {
        console.log('Attempting connection without auth token...');
        
        const socket = io('http://localhost:3000', {
            transports: ['websocket', 'polling'],
            timeout: 5000
        });
        
        const timeout = setTimeout(() => {
            console.log('❌ Connection timeout (no auth)');
            socket.disconnect();
            resolve();
        }, 5000);
        
        socket.on('connect', () => {
            console.log('✅ Connected without auth (unexpected)');
            clearTimeout(timeout);
            socket.disconnect();
            resolve();
        });
        
        socket.on('connect_error', (error) => {
            console.log('✅ Connection rejected without auth (expected):', error.message);
            clearTimeout(timeout);
            socket.disconnect();
            resolve();
        });
        
        socket.on('disconnect', (reason) => {
            console.log('Connection disconnected:', reason);
        });
    });
}

function testConnectionWithInvalidAuth() {
    return new Promise((resolve) => {
        console.log('Attempting connection with invalid auth token...');
        
        const socket = io('http://localhost:3000', {
            auth: {
                token: 'invalid-token-12345'
            },
            transports: ['websocket', 'polling'],
            timeout: 5000
        });
        
        const timeout = setTimeout(() => {
            console.log('❌ Connection timeout (invalid auth)');
            socket.disconnect();
            resolve();
        }, 5000);
        
        socket.on('connect', () => {
            console.log('❌ Connected with invalid auth (unexpected)');
            clearTimeout(timeout);
            socket.disconnect();
            resolve();
        });
        
        socket.on('connect_error', (error) => {
            console.log('✅ Connection rejected with invalid auth (expected):', error.message);
            clearTimeout(timeout);
            socket.disconnect();
            resolve();
        });
    });
}

function testConnectionWithValidAuth() {
    return new Promise((resolve) => {
        console.log('Attempting connection with valid auth token...');
        
        // Create valid JWT token
        const testUser = {
            userId: 1,
            email: 'jean@example.com'
        };
        
        const token = jwt.sign(testUser, 'nextdoorbuddy_access_secret_key_2024', { expiresIn: '1h' });
        
        const socket = io('http://localhost:3000', {
            auth: {
                token: token
            },
            transports: ['websocket', 'polling'],
            timeout: 10000
        });
        
        const timeout = setTimeout(() => {
            console.log('❌ Connection timeout (valid auth)');
            socket.disconnect();
            resolve();
        }, 10000);
        
        socket.on('connect', () => {
            console.log('✅ Connected with valid auth!');
            console.log('Socket ID:', socket.id);
            console.log('Transport:', socket.io.engine.transport.name);
            
            // Test basic functionality
            testBasicFunctionality(socket, () => {
                clearTimeout(timeout);
                socket.disconnect();
                resolve();
            });
        });
        
        socket.on('connect_error', (error) => {
            console.log('❌ Connection failed with valid auth:', error.message);
            clearTimeout(timeout);
            socket.disconnect();
            resolve();
        });
        
        socket.on('error', (error) => {
            console.log('❌ Socket error:', error);
        });
        
        socket.on('disconnect', (reason) => {
            console.log('Disconnected:', reason);
        });
    });
}

function testBasicFunctionality(socket, callback) {
    console.log('Testing basic WebSocket functionality...');
    
    let testsCompleted = 0;
    const totalTests = 3;
    
    function checkCompletion() {
        testsCompleted++;
        if (testsCompleted >= totalTests) {
            callback();
        }
    }
    
    // Test 1: Presence update
    socket.emit('update_presence', 'online');
    console.log('✅ Sent presence update');
    setTimeout(checkCompletion, 500);
    
    // Test 2: Join room (should fail for non-existent room)
    socket.emit('join_room', 99999);
    console.log('✅ Attempted to join non-existent room');
    setTimeout(checkCompletion, 500);
    
    // Test 3: Listen for events
    socket.on('user_presence_updated', (presence) => {
        console.log('✅ Received presence update');
    });
    
    socket.on('error', (error) => {
        console.log('✅ Received error event (expected for invalid room)');
    });
    
    setTimeout(checkCompletion, 1000);
}

runDiagnostic().catch(console.error);
