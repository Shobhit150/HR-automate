import { NextResponse } from "next/server";

export async function POST(request) {
  // Parse the request body
  const body = await request.json();
  
  // Process the data (this is just an example)
  const processedData = {
    message: "Data received",
    yourData: body,
    timestamp: new Date().toISOString()
  };
  
  // Return a response
  return NextResponse.json(processedData);
}

// You can keep your GET method as well
export async function GET(request) {
  return NextResponse.json({ hello: "World" });
}