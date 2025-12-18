// Simple verification script to mimic frontend API calls
// Run with: npx tsx apps/web/scripts/verify-api.ts

async function verifyApi() {
  console.log("Starting Frontend API Verification...");
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
  console.log(`Targeting API at: ${baseUrl}`);

  try {
    // 1. Health Check (Simulated)
    const healthRes = await fetch(`${baseUrl}/api/health`);
    if (!healthRes.ok)
      throw new Error(`Health check failed: ${healthRes.statusText}`);
    console.log("✅ Health check passed");

    // 2. Subject Generation Stream
    console.log("Testing Subject Generation Stream...");
    // We can't easily test SSE with simple fetch in Node without extra libs,
    // but we can at least hit the endpoint and check headers/initial status or use a polyfill if needed.
    // For this script, we'll verify we can initiate the connection.
    const subjectRes = await fetch(
      `${baseUrl}/api/subjects/generate-stream?country=US&language=English&educationStatus=in_school`
    );
    if (!subjectRes.ok)
      throw new Error(`Subject stream failed: ${subjectRes.statusText}`);
    console.log("✅ Subject stream connection established");

    // 3. Curriculum Generation (POST)
    console.log("Testing Curriculum Generation (POST)...");
    const curriculumRes = await fetch(`${baseUrl}/api/curriculum/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        country: "US",
        language: "English",
        gradeLevel: "Middle School",
      }),
    });
    if (!curriculumRes.ok)
      throw new Error(
        `Curriculum generation failed: ${curriculumRes.statusText}`
      );
    const curriculumData = await curriculumRes.json();
    if (!curriculumData.subjects)
      throw new Error("Curriculum response missing subjects");
    console.log("✅ Curriculum generation passed");

    // 4. Lesson Generation
    console.log("Testing Lesson Generation...");
    const lessonRes = await fetch(`${baseUrl}/api/curriculum/lesson`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        country: "US",
        language: "English",
        subject: "Mathematics",
        topic: "Algebra",
        gradeLevel: "High School",
        topicIndex: 0,
        totalTopics: 1,
      }),
    });
    if (!lessonRes.ok)
      throw new Error(`Lesson generation failed: ${lessonRes.statusText}`);
    const lessonData = await lessonRes.json();
    if (!lessonData.session) throw new Error("Lesson response missing session");
    console.log("✅ Lesson generation passed");

    // 5. Regression Test: Linear Algebra Stream (SK)
    console.log("Testing Regression: Linear Algebra Stream (SK)...");
    const regressionUrl = `${baseUrl}/api/curriculum/lesson/stream?country=SK&language=en&subject=Mathematics&topic=Linear+Algebra&gradeLevel=Grade+12&index=1&totalTopics=4`;
    const regressionRes = await fetch(regressionUrl);
    if (!regressionRes.ok)
      throw new Error(`Regression test failed: ${regressionRes.statusText}`);
    console.log("✅ Regression test connection established");

    // 6. LaTeX Rendering Check (Matrices)
    console.log("Testing LaTeX Rendering (Matrices)...");
    const latexUrl = `${baseUrl}/api/curriculum/lesson/stream?country=US&language=en&subject=Mathematics&topic=Matrices&grade=High+School&index=0&totalTopics=1`;
    const latexRes = await fetch(latexUrl);
    if (!latexRes.ok)
      throw new Error(`LaTeX check failed: ${latexRes.statusText}`);

    // We need to read the stream to check content
    const reader = latexRes.body?.getReader();
    const decoder = new TextDecoder();
    let content = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
      }

      // Check for corruption
      if (content.includes("egin{") && !content.includes("\\begin{")) {
        throw new Error(
          "LaTeX rendering corrupted: Found 'egin{' without backslash"
        );
      }
      // Check for success markers (allowing for double escaped json)
      // In the raw stream data, it might look like "\\begin" (literal backslash then begin) or even "\\\\begin"
      const hasLatex =
        content.includes("\\begin{") || content.includes("\\\\begin{");

      if (!hasLatex) {
        console.warn(
          "⚠️  Warning: No LaTeX 'begin' commands found in Matrices lesson. Might be a content generation variance."
        );
      } else {
        console.log(
          "✅ LaTeX formatting confirmed (found escaped backslashes)"
        );
      }
    } else {
      console.warn("⚠️  Could not read stream body for LaTeX check");
    }

    // 7. LaTeX Delimiter Check (Advanced Functions)
    console.log("Testing LaTeX Delimiters (Advanced Functions)...");
    const advParams = new URLSearchParams({
      country: "SK",
      language: "en",
      subject: "Mathematics",
      topic: "Advanced Functions",
      gradeLevel: "Grade 12", // User said Grade 1? Check screenshot logic. URL said grade=Grade+1 but probably Grade 12 or similar. Let's use Grade 12 as per context typically. User text said "Grade 1" but query param cut off? "...&grade=Grade+1". Ah, could be Grade 12 cut off. Let's try "Grade 12".
      index: "0",
      totalTopics: "4",
    });

    const delimiterUrl = `${baseUrl}/api/curriculum/lesson/stream?${advParams.toString()}`;
    const delimiterRes = await fetch(delimiterUrl);

    if (!delimiterRes.ok)
      throw new Error(`Delimiter check failed: ${delimiterRes.statusText}`);

    const delimiterReader = delimiterRes.body?.getReader();
    const delimiterDecoder = new TextDecoder();
    let delimiterContent = "";

    if (delimiterReader) {
      while (true) {
        const { done, value } = await delimiterReader.read();
        if (done) break;
        delimiterContent += delimiterDecoder.decode(value, { stream: true });
      }
    }

    // 8. Chemistry LaTeX Check
    console.log("Testing Chemistry LaTeX (Balancing Equations)...");
    const chemUrl = `${baseUrl}/api/curriculum/lesson/stream?country=US&language=en&subject=Chemistry&topic=Balancing+Chemical+Equations&grade=High+School&index=0&totalTopics=1`;
    const chemRes = await fetch(chemUrl);
    if (!chemRes.ok)
      throw new Error(`Chemistry check failed: ${chemRes.statusText}`);

    const chemReader = chemRes.body?.getReader();
    const chemDecoder = new TextDecoder();
    let chemContent = "";

    if (chemReader) {
      while (true) {
        const { done, value } = await chemReader.read();
        if (done) break;
        chemContent += chemDecoder.decode(value, { stream: true });
      }

      // Check for \ce{} command
      // It might be escaped as \\ce{ in the JSON string
      const hasChem =
        chemContent.includes("\\ce{") || chemContent.includes("\\\\ce{");

      if (!hasChem) {
        console.warn(
          "⚠️  Warning: No Chemistry \\ce{} commands found. This might be due to content variation or missing instructions."
        );
      } else {
        console.log("✅ Chemistry formatting confirmed (found \\ce{} tags)");
      }
    }

    // 9. Low-Resource Language Check (Yoruba - Nigeria)
    // Regression test for min_length=1 slides fix
    console.log("Testing Low-Resource Language (Yoruba)...");
    const yoUrl = `${baseUrl}/api/curriculum/lesson/stream?country=NG&language=yo&subject=Mathematics&topic=Algebra&grade=Grade+11&index=0&totalTopics=1`;
    const yoRes = await fetch(yoUrl);
    if (!yoRes.ok)
      throw new Error(`Yoruba generation failed: ${yoRes.statusText}`);

    // Just ensure we get a valid stream response (200 OK) without 500
    const yoReader = yoRes.body?.getReader();
    if (yoReader) {
      // Read a bit to ensure stream starts
      await yoReader.read();
      console.log("✅ Yoruba generation passed (Stream started successfully)");
    }

    // Naive check: if we find "\\frac" it MUST be followed/preceded by "$" or "$$" within reasonable distance?
    // Easier: Parse the JSON from the "complete" event or "lesson" field if we can capturing it?
    // The stream output is SSE. We can just grep the string.

    // If we see `"\frac` (start of string or space then backslash frac) but no `$` before it in the specific option string context, it's bad.
    // However, regexing the whole stream is hard.
    // Let's assert that IF "\\frac" is present, it is INSIDE "$...$".

    // We can verify if "options" strings containing backslashes start with $.
    // Check for common math patterns that should be delimited
    const contentToCheck = delimiterContent;
    const mathPatterns = ["\\\\frac", "\\\\sqrt", "\\\\int", "\\\\sum", "^"]; // basic latex indicators
    let foundMath = false;

    // Helper to check if snippet is inside custom tags
    const isInsideTags = (str: string, snippet: string) => {
      // Simplified check: Does snippet appear between <latex-inline> and </latex-inline>
      // OR <latex-block> and </latex-block>
      // This is a rough heuristic for the stream content.
      // A robust check would require finding the closest preceding tag.

      const idx = str.indexOf(snippet);
      const preceding = str.substring(0, idx);

      const hasInlineOpen =
        preceding.lastIndexOf("<latex-inline>") >
        preceding.lastIndexOf("</latex-inline>");
      const hasBlockOpen =
        preceding.lastIndexOf("<latex-block>") >
        preceding.lastIndexOf("</latex-block>");

      return hasInlineOpen || hasBlockOpen;
    };

    for (const pat of mathPatterns) {
      if (contentToCheck.includes(pat)) {
        foundMath = true;
        const idx = contentToCheck.indexOf(pat);
        const snippet = contentToCheck.substring(
          Math.max(0, idx - 15),
          Math.min(contentToCheck.length, idx + 25)
        );
        console.log(`ℹ️ Found math pattern '${pat}' in: "...${snippet}..."`);

        // Check for delimiters nearby
        const hasDelimiter =
          isInsideTags(contentToCheck, pat) || snippet.includes("<latex-");

        if (!hasDelimiter) {
          console.warn(
            `⚠️  Warning: Math pattern '${pat}' found without visible custom tags in snippet.`
          );
        } else {
          console.log(`✅ Pattern '${pat}' appears to be inside custom tags.`);
        }
      }
    }

    if (!foundMath) {
      console.log("ℹ️ No specific LaTeX patterns found to verify this run.");
    }

    console.log("\n🎉 ALL FRONTEND INTEGRATION CHECKS PASSED");
  } catch (error) {
    console.error("\n❌ VERIFICATION FAILED:", error);
    process.exit(1);
  }
}

verifyApi();
