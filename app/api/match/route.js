// File: app/api/match/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { resumeText, keywords } = body;

    if (!resumeText || !keywords || !Array.isArray(keywords)) {
      return NextResponse.json({
        error: 'Invalid input',
        details: 'Both resumeText and keywords array are required'
      }, { status: 400 });
    }

    const allTexts = [resumeText, ...keywords];

    // Call Cohere API
    const cohereRes = await fetch('https://api.cohere.ai/v1/embed', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
        'Content-Type': 'application/json',
        'Cohere-Version': '2022-12-06' // latest stable as of now
      },
      body: JSON.stringify({
        model: 'embed-english-v3.0',
        texts: allTexts,
        input_type: 'search_document'
      })
    });

    const json = await cohereRes.json();

    if (!cohereRes.ok) {
      return NextResponse.json({
        error: 'Cohere API error',
        details: json.message || 'Unknown error from Cohere API'
      }, { status: cohereRes.status });
    }

    if (!json.embeddings || !Array.isArray(json.embeddings)) {
      return NextResponse.json({
        error: 'Invalid API response',
        details: 'Cohere API response missing embeddings array'
      }, { status: 500 });
    }

    const vectors = json.embeddings;
    const resumeVector = vectors[0];
    const keywordVectors = vectors.slice(1);

    const cosineSimilarity = (a, b) => {
      const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
      const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
      const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
      return dotProduct / (magnitudeA * magnitudeB);
    };

    const similarityThreshold = 0.75;
    const matches = [];

    keywordVectors.forEach((vec, i) => {
      const keyword = keywords[i];
      const similarity = cosineSimilarity(resumeVector, vec);
      const textMatch = resumeText.toLowerCase().includes(keyword.toLowerCase());
      const semanticMatch = similarity >= similarityThreshold;
    
      matches.push({
        keyword,
        similarity: parseFloat(similarity.toFixed(4)),
        isMatch: textMatch || semanticMatch, // Hybrid logic
        reason: textMatch ? "text" : (semanticMatch ? "semantic" : "none")
      });
    });

    matches.sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json({
      success: true,
      matches,
      matchedKeywords: matches.filter(m => m.isMatch).map(m => m.keyword)
    });

  } catch (error) {
    console.error('Semantic matching error:', error);
    return NextResponse.json({
      error: 'Matching failed',
      details: error.message
    }, { status: 500 });
  }
}
