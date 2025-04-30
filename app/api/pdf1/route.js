import { NextRequest, NextResponse } from "next/server";
import pdfParse from "./pdf";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const uploadedFile = formData.get("file");

    if (!uploadedFile || !(uploadedFile instanceof File)) {
      return NextResponse.json({ error: "No valid file uploaded." }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());

    const pdfData = await pdfParse(fileBuffer); // Important: fileBuffer, not path
    const rawText = pdfData.text?.trim(); // .trim() to remove whitespace

    if (!rawText) {
      return NextResponse.json({ error: "No text extracted from PDF." }, { status: 400 });
    }

    return NextResponse.json({ text: rawText }); // Important: { text: ... }
    
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
