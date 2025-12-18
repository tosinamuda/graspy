import requests
import json
import sys

def check():
    url = "http://localhost:8081/api/curriculum/lesson/stream"
    params = {
        "country": "SK",
        "language": "en",
        "subject": "Mathematics",
        "topic": "Advanced Functions",
        "gradeLevel": "Grade 12",
        "index": "0",
        "totalTopics": "4"
    }
    
    print(f"Fetching {params['topic']}...")
    try:
        with requests.get(url, params=params, stream=True) as r:
            r.raise_for_status()
            content = ""
            for chunk in r.iter_content(chunk_size=None):
                if chunk:
                    content += chunk.decode('utf-8')
            
            # The stream sends SSE events. We need to find the final payload or just grep valid JSON lines.
            # Simplified: just looking at the raw text for the patterns.
            
            print("\n--- Content Snippet ---")
            # Look for options or assessment
            # We want to find strings that look like math but miss $.
            
            # Check specifically for the snippet we saw failing before or generally options
            if "options" in content:
                print("Found 'options'. Checking delimiters...")
                # It's hard to parse SSE stream as single JSON. But let's dump it.
                print(content[:2000] + "...") # Print first 2k chars to see structure
                
                if "\\frac" in content:
                    idx = content.find("\\frac")
                    snippet = content[max(0, idx-30):idx+30]
                    print(f"\n\\frac context: ...{snippet}...")
                    if "<latex-inline>" not in snippet and "<latex-block>" not in snippet:
                        print("❌ FAILURE: \\frac found without custom tags")
                    else:
                         print("✅ SUCCESS: \\frac found with custom tags")
                         
                if "^" in content:
                    idx = content.find("^")
                    snippet = content[max(0, idx-30):idx+30]
                    print(f"\n^ context: ...{snippet}...")
                    # Basic check for tag or at least part of tag nearby
                    if "latex-" not in snippet:
                        print("❌ FAILURE: ^ found without custom tags nearby")
                    else:
                        print("✅ SUCCESS: ^ found with custom tags nearby")
                     
            else:
                 print("Warning: No 'options' found in output (maybe streaming format issue).")
                 print(content[:1000])

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
