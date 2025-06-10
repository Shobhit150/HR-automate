"use client"
import { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { IoClose } from "react-icons/io5";
export default function Home() {
  const [extractedText, setExtractedText] = useState('');
  const [atsScore, setAtsScore] = useState(null);
  const [customKeywords, setCustomKeywords] = useState([]);
  const [inputKeyword, setInputKeyword] = useState('');
  const [semanticScore, setSemanticScore] = useState(null);
  const [tfidfScore, setTfidfScore] = useState(null);
  const [entityScore, setEntityScore] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const jobRoles = {
    "Frontend Developer": ["JavaScript", "React", "CSS", "HTML", "Redux", "Next.js", "TypeScript"],
    "Backend Developer": ["Node.js", "Express.js", "MongoDB", "PostgreSQL", "Docker", "AWS"],
    "Fullstack Developer": ["JavaScript", "React", "Node.js", "MongoDB", "Express.js", "Docker"],
    "Data Scientist": ["Python", "Pandas", "NumPy", "TensorFlow", "Scikit-Learn", "Deep Learning"],
    "DevOps Engineer": ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Jenkins", "Linux"]
  };



  const feedBack = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: extractedText,  // Fixed parameter name to match API
          selectedRole,
          customKeywords
        })
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const runSemanticMatch = async (text, keywords) => {
    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeText: text, keywords }),
      });

      const data = await response.json();

      if (!data.matches || !Array.isArray(data.matches)) {
        console.error("Invalid response from /api/match:", data);
        return { matches: [], score: 0 };
      }

      const matchedKeywords = data.matches
        .filter(m => m.isMatch)
        .map(m => m.keyword);

      const score = Math.round((matchedKeywords.length / keywords.length) * 100);

      return { matches: matchedKeywords, score };

    } catch (error) {
      console.error("Error running semantic match:", error);
      return { matches: [], score: 0 };
    }
  };





  const suggestedKeywords = [
    // Programming Languages
    "C", "C++", "C#", "Java", "JavaScript", "Python", "Ruby", "Go", "Rust", "TypeScript", "Swift", "Kotlin", "PHP", "Perl", "Scala", "Dart",

    // Frontend Frameworks
    "React", "Vue.js", "Angular", "Next.js", "Svelte", "Remix", "Astro",

    // Backend Frameworks
    "Node.js", "Express.js", "Django", "Flask", "Spring Boot", "Ruby on Rails", "Laravel", "NestJS", "FastAPI",

    // Databases
    "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Oracle Database", "Firebase", "Cassandra", "DynamoDB",

    // DevOps / Cloud
    "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Terraform", "Jenkins", "GitHub Actions", "CircleCI", "Ansible",

    // Data Science / AI
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-Learn", "Keras", "OpenCV", "Natural Language Processing",

    // Other Skills
    "Git", "Linux", "Agile", "Scrum", "REST API", "GraphQL", "Microservices", "Web Security", "System Design", "Problem Solving", "Communication", "Leadership", "Teamwork"
  ];

  const handleTextExtracted = async (text) => {
    setExtractedText(text);

    const { score: score1 } = await runSemanticMatch(text, customKeywords);
    const score2 = tfidf(text, customKeywords).score2;
    const score3 = entityRecognition(text).score3;



    setSemanticScore(Math.round(score1));
    setTfidfScore(Math.round(score2));
    setEntityScore(Math.round(score3));
    const finalScore = score1 * 0.3 + score2 * 0.3 + score3 * 0.4;
    setAtsScore(Math.round(finalScore));
    feedBack();
  };

  const tfidf = (text, keywords) => {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);

    let score = 0;
    let totalKeywordsFound = 0;

    keywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      const count = words.filter(word => word.includes(lowerKeyword)).length;

      if (count > 0) {
        totalKeywordsFound += 1;
        let tf = count / words.length; // basic tf

        // Custom IDF: assume resume collection, set manually
        let idf = 2.0; // boost idf because resumes are short

        score += (tf * idf * 100) + 20; // base 20 points for presence + tf-idf influence
      }
    });

    if (score > 100) score = 100;
    return { score2: score }
    //setAtsScore(Math.round(score));
  };

  const calculateATSFromEntities = (skills, universities, companies) => {
    let score = 0;
    const totalPossible = 10; // you can change this based on your expected matching strictness

    if (skills.length > 0) score += (skills.length / customKeywords.length) * 5;
    if (universities.length > 0) score += 2.5;
    if (companies.length > 0) score += 2.5;

    let finalScore = (score / totalPossible) * 100;
    if (finalScore > 100) finalScore = 100;

    //setAtsScore(Math.round(finalScore));
    return Math.round(finalScore);
  };


  const [entities, setEntities] = useState({ skills: [], companies: [], universities: [] });

  const entityRecognition = (text) => {
    const skillsList = customKeywords; // from suggestedKeywords
    const universitiesList = ["MIT", "Stanford", "Harvard", "IIT", "IIM", "Oxford", "Cambridge"];
    const companiesList = ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Infosys", "TCS", "Wipro"];


    const words = text.split(/\s+/);

    const foundSkills = [];
    const foundUniversities = [];
    const foundCompanies = [];

    words.forEach(word => {
      const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();


      if (skillsList.map(s => s.toLowerCase()).includes(cleanWord) && !foundSkills.includes(cleanWord)) {
        foundSkills.push(cleanWord);
      }

      if (universitiesList.map(u => u.toLowerCase()).includes(cleanWord) && !foundUniversities.includes(cleanWord)) {
        foundUniversities.push(cleanWord);
      }
      if (companiesList.map(c => c.toLowerCase()).includes(cleanWord) && !foundCompanies.includes(cleanWord)) {
        foundCompanies.push(cleanWord);
      }
    });

    setEntities({
      skills: foundSkills,
      universities: foundUniversities,
      companies: foundCompanies,
    });

    const score3 = calculateATSFromEntities(foundSkills, foundUniversities, foundCompanies);
    return { score3 };
  };






  const handleSuggestionClick = (word) => {
    if (!customKeywords.includes(word)) {
      setCustomKeywords([...customKeywords, word]);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 space-y-6 ">
      <h1 className="text-4xl font-bold text-center">📄 Resume Scanner</h1>


      <select
        value={selectedRole}
        onChange={(e) => {
          const role = e.target.value;
          setSelectedRole(role);
          if (jobRoles[role]) {
            setCustomKeywords([...new Set([...customKeywords, ...jobRoles[role]])]);
          }
        }}
        className="border p-2 rounded w-full mb-4"
      >
        <option value="">Select a Job Role (optional)</option>
        {Object.keys(jobRoles).map((role, idx) => (
          <option key={idx} value={role}>{role}</option>
        ))}
      </select>

      <div className="space-y-4">
        <input
          type="text"
          value={inputKeyword}
          onChange={(e) => setInputKeyword(e.target.value)}
          placeholder="Enter keyword"
          className="border p-2 rounded w-full"
        />






        {inputKeyword.trim() !== "" && (
          <div className="flex flex-wrap gap-2">
            {[...suggestedKeywords]
              .filter(word =>
                word.toLowerCase().includes(inputKeyword.toLowerCase())
              )
              .sort((a, b) => {
                const input = inputKeyword.toLowerCase();
                const aStarts = a.toLowerCase().startsWith(input);
                const bStarts = b.toLowerCase().startsWith(input);

                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return a.localeCompare(b); // optional: sort alphabetically if same
              })
              .slice(0, 5)
              .map((word, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(word)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-4xl"
                >
                  {word}
                </button>
              ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-2">
          {customKeywords.map((word, index) => {
            const colors = [
              "text-pink-700 bg-pink-200",
              "text-blue-700 bg-blue-200",
              "text-green-700 bg-green-200",
              "text-yellow-700 bg-yellow-200",
              "text-purple-700 bg-purple-200",
              "text-red-700 bg-red-200",
              "text-indigo-700 bg-indigo-200",
            ];
            const colorClass = colors[index % colors.length];
            const textColor = colorClass.split(' ')[0]; // extract text color for ❌ button

            return (
              <span
                key={index}
                className={`${colorClass} flex items-center gap-2 px-2 py-1 rounded-2xl`}
              >
                {word}
                <button
                  onClick={() => {
                    const newKeywords = [...customKeywords];
                    newKeywords.splice(index, 1);
                    setCustomKeywords(newKeywords);
                  }}
                  className={`${textColor} text-xs hover:scale-125 transition-transform`}
                >
                  <IoClose size={20} />
                </button>
              </span>
            );
          })}
        </div>


      </div>

      <FileUploader onTextExtracted={handleTextExtracted} />



      {atsScore !== null && (
        <div className="bg-white p-6 rounded-lg mt-6 space-y-3">
          <h2 className="text-2xl font-bold text-black">🎯 Final ATS Score: {atsScore}/100</h2>
          <div className="text-black space-x-5 flex flex-row my-5">
            <p className='flex-1 border p-3 rounded-2xl text-pink-700 bg-pink-200'>🔍 Semantic Score: <strong>{semanticScore}</strong></p>
            <p className='flex-1 border p-3 rounded-2xl text-blue-700 bg-blue-200'>📊 TF-IDF Score: <strong>{tfidfScore}</strong></p>
            <p className='flex-1 border p-3 rounded-2xl text-green-700 bg-green-200'>🏢 ER Score: <strong>{entityScore}</strong></p>
          </div>
          {/* <h3 className="font-bold mt-4 text-black">📄 Extracted Text:</h3> */}
          {/* <p className="text-gray-700 text-sm whitespace-pre-line">{extractedText}</p> */}
          {result && (
            <div className="mt-6 rounded text-black">
              <h2 className="text-xl font-bold mb-4">Resume Analysis</h2>

              <div className="mb-4">
                <h3 className="font-bold text-green-700">Key Strengths:</h3>
                <ul className="list-disc pl-5">
                  {result.strengths?.map((strength, idx) => (
                    <li key={idx}>{strength}</li>
                  ))}
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="font-bold text-red-700">Areas for Improvement:</h3>
                <ul className="list-disc pl-5">
                  {result.weaknesses?.map((weakness, idx) => (
                    <li key={idx}>{weakness}</li>
                  ))}
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="font-bold text-blue-700">Suggestions:</h3>
                <ul className="list-disc pl-5">
                  {result.suggestions?.map((suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold">Best Role Fit:</h3>
                <p className="font-semibold text-purple-700">{result.bestFitRole}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>

  );
}
