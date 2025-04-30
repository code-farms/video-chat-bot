// src/app/api/fastapi-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Ensure the FastAPI backend URL is configured, default to localhost if not set
const FASTAPI_BACKEND_URL = process.env.FASTAPI_BACKEND_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // Get the request body from the Next.js client

    // Forward the request to the FastAPI backend
    const fastapiResponse = await fetch(`${FASTAPI_BACKEND_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any other headers you need to forward, like authentication tokens
      },
      body: JSON.stringify(body), // Send the original body
    });

    // Check if the FastAPI request was successful
    if (!fastapiResponse.ok) {
      // Attempt to parse error details from FastAPI response
      let errorBody;
      try {
        errorBody = await fastapiResponse.json();
      } catch (e) {
        // If parsing fails, use the status text
        errorBody = { detail: fastapiResponse.statusText };
      }
      console.error(`FastAPI error: ${fastapiResponse.status}`, errorBody);
      // Return an error response mirroring FastAPI's status and message
      return NextResponse.json({ error: errorBody?.detail || 'Error communicating with backend service' }, { status: fastapiResponse.status });
    }

    // Parse the JSON response from FastAPI
    const data = await fastapiResponse.json();

    // Return the response from FastAPI back to the Next.js client
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in Next.js proxy route:', error);
     // Handle potential fetch errors (e.g., network issues)
     if (error instanceof TypeError && error.message.includes('fetch failed')) {
        return NextResponse.json({ error: 'Could not connect to the backend service.' }, { status: 503 }); // Service Unavailable
     }
    // Generic internal server error for other issues
    return NextResponse.json({ error: 'Internal Server Error in proxy' }, { status: 500 });
  }
}

// Optional: Add GET or other methods if needed, proxying them similarly
export async function GET(req: NextRequest) {
    // Example for GET if you had a /chat GET endpoint in FastAPI
    try {
        const fastapiResponse = await fetch(`${FASTAPI_BACKEND_URL}/chat`, {
            method: 'GET',
            headers: req.headers, // Forward headers
        });

        if (!fastapiResponse.ok) {
            let errorBody;
            try {
                errorBody = await fastapiResponse.json();
            } catch (e) {
                errorBody = { detail: fastapiResponse.statusText };
            }
            return NextResponse.json({ error: errorBody?.detail || 'Backend error' }, { status: fastapiResponse.status });
        }

        const data = await fastapiResponse.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error in Next.js proxy GET route:', error);
        if (error instanceof TypeError && error.message.includes('fetch failed')) {
           return NextResponse.json({ error: 'Could not connect to the backend service.' }, { status: 503 });
        }
        return NextResponse.json({ error: 'Internal Server Error in proxy' }, { status: 500 });
    }
}
