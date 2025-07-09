// Test script to debug upload issues
const API_BASE_URL = "http://localhost:8000/api/v1";

// Test authentication first
async function testAuth() {
    console.log("Testing authentication...");
    
    // Check if we have a token
    const token = localStorage.getItem("access_token");
    console.log("Token exists:", !!token);
    
    if (token) {
        console.log("Token:", token.substring(0, 20) + "...");
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const user = await response.json();
                console.log("✅ Authentication successful:", user);
                return true;
            } else {
                console.log("❌ Authentication failed:", response.status, response.statusText);
                return false;
            }
        } catch (error) {
            console.log("❌ Authentication error:", error);
            return false;
        }
    } else {
        console.log("❌ No token found");
        return false;
    }
}

// Test upload endpoint
async function testUpload() {
    console.log("Testing upload endpoint...");
    
    const token = localStorage.getItem("access_token");
    if (!token) {
        console.log("❌ No authentication token");
        return;
    }
    
    // Create a test file
    const testContent = "This is a test log file for debugging upload issues.\nTimestamp: " + new Date().toISOString();
    const testFile = new File([testContent], "test.log", { type: "text/plain" });
    
    const formData = new FormData();
    formData.append('file', testFile);
    formData.append('upload_type', 'text');
    
    try {
        const response = await fetch(`${API_BASE_URL}/logs/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        console.log("Response status:", response.status);
        console.log("Response headers:", Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const result = await response.json();
            console.log("✅ Upload successful:", result);
        } else {
            const errorText = await response.text();
            console.log("❌ Upload failed:", response.status, response.statusText);
            console.log("Error details:", errorText);
            
            try {
                const errorJson = JSON.parse(errorText);
                console.log("Error JSON:", errorJson);
            } catch (e) {
                console.log("Error is not JSON");
            }
        }
    } catch (error) {
        console.log("❌ Upload error:", error);
    }
}

// Test CORS
async function testCORS() {
    console.log("Testing CORS...");
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'OPTIONS'
        });
        
        console.log("CORS preflight response:", response.status);
        console.log("CORS headers:", Object.fromEntries(response.headers.entries()));
    } catch (error) {
        console.log("CORS error:", error);
    }
}

// Run all tests
async function runTests() {
    console.log("=== VISTA Upload Debug Tests ===");
    
    await testCORS();
    const isAuth = await testAuth();
    
    if (isAuth) {
        await testUpload();
    } else {
        console.log("Skipping upload test due to authentication failure");
    }
    
    console.log("=== Tests Complete ===");
}

// Run tests when script is loaded
runTests(); 