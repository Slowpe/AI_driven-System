// Simple test to debug frontend API connection
const API_BASE_URL = "http://localhost:8000/api/v1";

async function testRegistration() {
    console.log("Testing registration...");
    
    const userData = {
        email: "test@example.com",
        password: "testpass123",
        full_name: "Test User",
        company_name: "Test Company"
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData)
        });
        
        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);
        
        if (response.ok) {
            const data = await response.json();
            console.log("Success:", data);
        } else {
            const errorText = await response.text();
            console.log("Error response:", errorText);
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

async function testHealth() {
    console.log("Testing health endpoint...");
    
    try {
        const response = await fetch("http://localhost:8000/health");
        console.log("Health status:", response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log("Health data:", data);
        }
    } catch (error) {
        console.error("Health check error:", error);
    }
}

// Run tests
testHealth().then(() => {
    setTimeout(testRegistration, 1000);
}); 