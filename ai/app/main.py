import os
import json
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from google import genai

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set in .env file")

client = genai.Client(api_key=GEMINI_API_KEY)
MODEL = "gemini-2.0-flash"

app = FastAPI(title="Clinic AI Assistant Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response models ──────────────────────────────────────────────────

class SymptomRequest(BaseModel):
    symptoms: str

class SymptomAnalysisResponse(BaseModel):
    symptoms: List[str]
    analysis: str
    severity: str
    suggested_specialty: str

class SpecialtyRequest(BaseModel):
    symptoms: str

class SpecialtyResponse(BaseModel):
    suggested_specialty: str
    reason: str

class RecordSummaryRequest(BaseModel):
    diagnosis: str
    symptoms: str
    doctor_notes: str
    prescription: Optional[str] = None

class RecordSummaryResponse(BaseModel):
    summary: str


# ── Helper ─────────────────────────────────────────────────────────────────────

def ask_gemini(prompt: str) -> str:
    """Send a prompt to Gemini and return the text response."""
    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)}")


def parse_json_response(raw: str) -> dict:
    """Strip markdown fences and parse JSON."""
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        # parts[1] is the content inside the first fence
        raw = parts[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    return json.loads(raw)


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"message": "Clinic AI Assistant powered by Google Gemini"}


@app.post("/api/ai/analyze-symptoms", response_model=SymptomAnalysisResponse)
async def analyze_symptoms(request: SymptomRequest):
    prompt = f"""Bạn là trợ lý y tế AI cho phòng khám. Người dùng mô tả triệu chứng sau:
"{request.symptoms}"

Hãy phân tích và trả lời theo đúng định dạng JSON sau (không thêm markdown, chỉ JSON thuần):
{{
  "symptoms": ["triệu chứng 1", "triệu chứng 2"],
  "analysis": "Nhận định chi tiết về tình trạng sức khỏe",
  "severity": "Thấp | Trung bình | Cao (Cần khám ngay)",
  "suggested_specialty": "Tên chuyên khoa"
}}

Quy tắc:
- Trả lời hoàn toàn bằng tiếng Việt
- Chỉ trả về JSON, không giải thích thêm
- suggested_specialty chỉ được là một trong: Nội Tổng Quát, Tai Mũi Họng, Tim Mạch, Tiêu Hóa, Cơ Xương Khớp, Thần Kinh, Da Liễu, Nhi Khoa, Sản Phụ Khoa, Mắt, Nội Tiết
"""
    raw = ask_gemini(prompt)
    try:
        data = parse_json_response(raw)
        return SymptomAnalysisResponse(**data)
    except Exception:
        return SymptomAnalysisResponse(
            symptoms=["Không xác định"],
            analysis=raw,
            severity="Chưa xác định",
            suggested_specialty="Nội Tổng Quát"
        )


@app.post("/api/ai/suggest-specialty", response_model=SpecialtyResponse)
async def suggest_specialty(request: SpecialtyRequest):
    prompt = f"""Bạn là trợ lý y tế AI. Dựa trên triệu chứng: "{request.symptoms}"

Gợi ý chuyên khoa phù hợp. Trả lời bằng JSON thuần (không markdown):
{{
  "suggested_specialty": "Tên chuyên khoa",
  "reason": "Lý do cụ thể bằng tiếng Việt"
}}

suggested_specialty chỉ được là một trong: Nội Tổng Quát, Tai Mũi Họng, Tim Mạch, Tiêu Hóa, Cơ Xương Khớp, Thần Kinh, Da Liễu, Nhi Khoa, Sản Phụ Khoa, Mắt, Nội Tiết
"""
    raw = ask_gemini(prompt)
    try:
        data = parse_json_response(raw)
        return SpecialtyResponse(**data)
    except Exception:
        return SpecialtyResponse(suggested_specialty="Nội Tổng Quát", reason=raw)


@app.post("/api/ai/summarize-record", response_model=RecordSummaryResponse)
async def summarize_record(request: RecordSummaryRequest):
    prescription_part = f"\nĐơn thuốc: {request.prescription}" if request.prescription else ""
    prompt = f"""Bạn là trợ lý y tế AI. Tóm tắt hồ sơ bệnh án sau bằng tiếng Việt, ngắn gọn, dễ hiểu cho bệnh nhân:

Chẩn đoán: {request.diagnosis}
Triệu chứng: {request.symptoms}
Dặn dò của bác sĩ: {request.doctor_notes}{prescription_part}

Trả lời bằng JSON thuần (không markdown):
{{
  "summary": "Nội dung tóm tắt"
}}
"""
    raw = ask_gemini(prompt)
    try:
        data = parse_json_response(raw)
        return RecordSummaryResponse(**data)
    except Exception:
        return RecordSummaryResponse(summary=raw)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
