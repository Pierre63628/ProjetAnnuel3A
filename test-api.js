const jwt = require('jsonwebtoken');

// Test REST API endpoints
async function testAPI() {
    console.log('Testing REST API endpoints...');
    
    // Create a valid JWT token for testing
    const testUser = {
        userId: 1,
        email: 'jean@example.com'
    };
    
    const token = jwt.sign(testUser, 'nextdoorbuddy_access_secret_key_2024', { expiresIn: '1h' });
    console.log('Generated test token for user ID 1');
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
    
    try {
        // Test getting chat rooms
        console.log('\nTesting GET /api/messaging/rooms...');
        const roomsResponse = await fetch('http://localhost:3000/api/messaging/rooms', {
            headers
        });
        
        if (roomsResponse.ok) {
            const roomsData = await roomsResponse.json();
            console.log('✅ Chat rooms API working:', roomsData.data.length, 'rooms found');
            
            if (roomsData.data.length > 0) {
                const firstRoom = roomsData.data[0];
                console.log('First room:', firstRoom.name, '(ID:', firstRoom.id + ')');
                
                // Test getting messages for the first room
                console.log('\nTesting GET /api/messaging/rooms/' + firstRoom.id + '/messages...');
                const messagesResponse = await fetch(`http://localhost:3000/api/messaging/rooms/${firstRoom.id}/messages`, {
                    headers
                });
                
                if (messagesResponse.ok) {
                    const messagesData = await messagesResponse.json();
                    console.log('✅ Messages API working:', messagesData.data.length, 'messages found');
                } else {
                    console.error('❌ Messages API failed:', messagesResponse.status, messagesResponse.statusText);
                }
            }
        } else {
            console.error('❌ Chat rooms API failed:', roomsResponse.status, roomsResponse.statusText);
        }
        
        // Test getting online users
        console.log('\nTesting GET /api/messaging/users/online...');
        const onlineResponse = await fetch('http://localhost:3000/api/messaging/users/online', {
            headers
        });
        
        if (onlineResponse.ok) {
            const onlineData = await onlineResponse.json();
            console.log('✅ Online users API working:', onlineData.data.length, 'users online');
        } else {
            console.error('❌ Online users API failed:', onlineResponse.status, onlineResponse.statusText);
        }
        
        console.log('\n🎉 REST API test completed!');
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
    }
}

testAPI();
