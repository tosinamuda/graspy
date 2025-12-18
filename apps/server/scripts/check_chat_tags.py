import requests
import json
import sys

def check():
    url = "http://localhost:8081/api/curriculum/tutor-chat"
    payload = {
        "subject": "Mathematics",
        "language": "en",
        "history": [],
        "message": "What is the quadratic formula?"
    }
    
    print(f"Sending message: {payload['message']}...")
    try:
        r = requests.post(url, json=payload)
        r.raise_for_status()
        data = r.json()
        
        answer = data.get("answer", "")
        print("\n--- Tutor Response ---")
        print(answer)
        print("----------------------")
        
        if "<latex-inline>" in answer or "<latex-block>" in answer:
             print("✅ SUCCESS: Found custom LaTeX tags in tutor response.")
        else:
             print("❌ FAILURE: Did not find custom LaTeX tags. Check if the model is ignoring instructions.")

    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response:
             print(e.response.text)

if __name__ == "__main__":
    check()
