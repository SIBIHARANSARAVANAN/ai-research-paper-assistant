# AI Research Paper Assistant – Backend

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
export OPENAI_API_KEY="YOUR_KEY_HERE"  # PowerShell: setx OPENAI_API_KEY "YOUR_KEY_HERE"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```