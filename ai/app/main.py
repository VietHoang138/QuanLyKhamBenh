import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Clinic AI Assistant Service")

# Enable CORS for communication with frontend and backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/")
def read_root():
    return {"message": "Welcome to the Clinic AI Assistant Mock API!"}

@app.post("/api/ai/analyze-symptoms", response_model=SymptomAnalysisResponse)
async def analyze_symptoms(request: SymptomRequest):
    symptom_text = request.symptoms.lower()
    
    # Simple rule-based mock logic
    if "ho" in symptom_text or "họng" in symptom_text or "sốt" in symptom_text:
        return SymptomAnalysisResponse(
            symptoms=["Ho", "Đau họng", "Sốt nhẹ"],
            analysis="Mô tả của bạn có dấu hiệu của viêm đường hô hấp trên hoặc viêm họng cấp. Hãy uống nhiều nước ấm, súc miệng nước muối và nghỉ ngơi.",
            severity="Trung bình",
            suggested_specialty="Tai Mũi Họng"
        )
    elif "tim" in symptom_text or "ngực" in symptom_text or "khó thở" in symptom_text:
        return SymptomAnalysisResponse(
            symptoms=["Đau ngực", "Khó thở"],
            analysis="Triệu chứng đau ngực hoặc khó thở có thể liên quan đến hệ tim mạch hoặc hô hấp. Đây là những triệu chứng cần lưu ý đặc biệt.",
            severity="Cao (Cần khám ngay)",
            suggested_specialty="Tim Mạch"
        )
    elif "dạ dày" in symptom_text or "bụng" in symptom_text or "nôn" in symptom_text:
        return SymptomAnalysisResponse(
            symptoms=["Đau bụng", "Buồn nôn"],
            analysis="Có thể bạn gặp vấn đề về tiêu hóa như viêm dạ dày cấp hoặc ngộ độc thực phẩm nhẹ. Hãy ăn đồ ăn loãng, dễ tiêu hóa.",
            severity="Trung bình",
            suggested_specialty="Tiêu Hóa"
        )
    elif "xương" in symptom_text or "khớp" in symptom_text or "đau lưng" in symptom_text:
        return SymptomAnalysisResponse(
            symptoms=["Đau khớp", "Đau lưng"],
            analysis="Có thể là triệu chứng thoái hóa khớp hoặc đau cơ do hoạt động sai tư thế. Bạn nên tránh mang vác nặng và nghỉ ngơi hợp lý.",
            severity="Thấp",
            suggested_specialty="Cơ Xương Khớp"
        )
    else:
        return SymptomAnalysisResponse(
            symptoms=["Triệu chứng chung"],
            analysis="Triệu chứng chưa rõ ràng để chẩn đoán sơ bộ. Bạn nên gặp bác sĩ đa khoa để được kiểm tra toàn diện hơn.",
            severity="Thấp",
            suggested_specialty="Nội Tổng Quát"
        )

@app.post("/api/ai/suggest-specialty", response_model=SpecialtyResponse)
async def suggest_specialty(request: SpecialtyRequest):
    symptom_text = request.symptoms.lower()
    if "ho" in symptom_text or "họng" in symptom_text or "tai" in symptom_text or "mũi" in symptom_text:
        return SpecialtyResponse(
            suggested_specialty="Tai Mũi Họng",
            reason="Bạn đang gặp các triệu chứng liên quan đến đường hô hấp trên, tai hoặc vùng họng."
        )
    elif "tim" in symptom_text or "ngực" in symptom_text:
        return SpecialtyResponse(
            suggested_specialty="Tim Mạch",
            reason="Triệu chứng liên quan đến vùng ngực và nhịp tim cần kiểm tra chuyên khoa tim mạch để tầm soát các bệnh lý nguy hiểm."
        )
    elif "bụng" in symptom_text or "dạ dày" in symptom_text or "tiêu hóa" in symptom_text:
        return SpecialtyResponse(
            suggested_specialty="Tiêu Hóa",
            reason="Triệu chứng đau bụng hoặc rối loạn tiêu hóa thuộc chuyên khoa Nội tiêu hóa để nội soi hoặc siêu âm bụng."
        )
    elif "xương" in symptom_text or "khớp" in symptom_text or "đau lưng" in symptom_text:
        return SpecialtyResponse(
            suggested_specialty="Cơ Xương Khớp",
            reason="Các cơn đau cơ xương khớp cần chụp X-quang hoặc MRI để bác sĩ chuyên khoa cơ xương khớp đưa ra chẩn đoán chính xác."
        )
    else:
        return SpecialtyResponse(
            suggested_specialty="Nội Tổng Quát",
            reason="Triệu chứng chung chưa định hình rõ chuyên khoa cụ thể. Nên bắt đầu từ phòng khám Nội tổng quát."
        )

@app.post("/api/ai/summarize-record", response_model=RecordSummaryResponse)
async def summarize_record(request: RecordSummaryRequest):
    summary_text = (
        f"Bệnh nhân đến khám với triệu chứng: {request.symptoms}. "
        f"Bác sĩ chẩn đoán mắc bệnh: {request.diagnosis}. "
        f"Lời khuyên của bác sĩ: {request.doctor_notes}. "
    )
    if request.prescription:
        summary_text += f"Đơn thuốc kèm theo bao gồm: {request.prescription}. Bệnh nhân cần tuân thủ uống thuốc đúng liều lượng."
        
    return RecordSummaryResponse(
        summary=f"[Tóm tắt từ Trợ lý AI]: Bệnh nhân được chẩn đoán '{request.diagnosis}' dựa trên triệu chứng '{request.symptoms}'. Cần tuân thủ dặn dò: '{request.doctor_notes}' và sử dụng thuốc đầy đủ theo đơn."
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
