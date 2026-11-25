import asyncio
import httpx
from app.database import Base, SessionLocal, engine
from app.main import app
from app.seed import seed_database


async def _run_workflow():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver", timeout=15.0) as client:
        # 1. Health check
        r = await client.get("/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"

        # 2. Patient login
        r = await client.post("/api/auth/login", json={"email": "patient@demo.com", "password": "Demo@123", "role": "patient"})
        assert r.status_code == 200
        p_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

        # 3. Patient dashboard
        r = await client.get("/api/patient/dashboard", headers=p_headers)
        assert r.status_code == 200
        assert r.json()["stats"]["comparisons_count"] >= 2

        # 4. Submit symptom with AI assessment
        r = await client.post(
            "/api/patient/symptoms",
            headers=p_headers,
            json={
                "main_symptom": "Cough",
                "additional_symptoms": ["Fever", "Chills"],
                "duration": "3 days",
                "severity": "moderate",
                "run_ai_assessment": True,
            },
        )
        assert r.status_code == 201
        sym_data = r.json()
        assert sym_data["ai_assessment"] is not None
        ai_id = sym_data["ai_assessment"]["id"]

        # 5. AI chat follow-up
        r = await client.post(
            "/api/patient/ai-assessments/chat",
            headers=p_headers,
            json={"assessment_id": ai_id, "message": "What investigations might a doctor check?"},
        )
        assert r.status_code == 200
        assert len(r.json()["chat_history"]) >= 2

        # 6. Book appointment with verified doctor
        docs_res = await client.get("/api/patient/doctors", headers=p_headers)
        assert docs_res.status_code == 200
        doc_id = docs_res.json()[0]["doctor_id"]

        r = await client.post(
            "/api/patient/appointments",
            headers=p_headers,
            json={
                "doctor_id": doc_id,
                "scheduled_at": "2026-12-01T10:30:00Z",
                "consultation_type": "online",
                "symptom_record_id": sym_data["symptom_record_id"],
                "ai_assessment_id": ai_id,
                "reason": "Evaluate persistent cough and compare with AI summary",
            },
        )
        assert r.status_code == 201
        consult_id = r.json()["consultation_id"]

        # 7. Doctor logs in and submits clinical assessment -> triggers Comparison Engine
        r = await client.post("/api/auth/login", json={"email": "doctor@demo.com", "password": "Demo@123", "role": "doctor"})
        assert r.status_code == 200
        d_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

        r = await client.post(
            "/api/doctor/assessments",
            headers=d_headers,
            json={
                "consultation_id": consult_id,
                "clinical_observations": "Mild fever, right basal crackles.",
                "symptoms_identified": ["cough", "fever"],
                "clinical_assessment": "Lower respiratory infection requiring imaging.",
                "confirmed_diagnosis": "Community-Acquired Pneumonia",
                "recommended_investigations": ["Chest X-Ray (PA/Lateral)", "Complete Blood Count (CBC)"],
                "risk_classification": "moderate",
                "treatment_plan": "Supportive hydration and imaging confirmation.",
            },
        )
        assert r.status_code == 201
        cmp_id = r.json()["comparison_id"]
        assert cmp_id is not None

        # 8. Comparison detail & PDF export
        r = await client.get(f"/api/comparisons/{cmp_id}", headers=p_headers)
        assert r.status_code == 200
        assert "authoritative" in r.json()["authoritative_statement"].lower()

        r = await client.get(f"/api/comparisons/{cmp_id}/pdf", headers=p_headers)
        assert r.status_code == 200
        assert r.headers["content-type"] == "application/pdf"

        # 9. Researcher analytics & RBAC check
        r = await client.post("/api/auth/login", json={"email": "researcher@demo.com", "password": "Demo@123", "role": "researcher"})
        assert r.status_code == 200
        r_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
        r = await client.get("/api/research/accuracy", headers=r_headers)
        assert r.status_code == 200
        assert r.json()["is_sample_data"] is True
        assert r.json()["metrics"]["total_cases"] >= 10

        # Patient forbidden from admin endpoint
        r = await client.get("/api/admin/dashboard", headers=p_headers)
        assert r.status_code == 403

        # 10. Admin dashboard
        r = await client.post("/api/auth/login", json={"email": "admin@demo.com", "password": "Demo@123", "role": "admin"})
        assert r.status_code == 200
        a_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
        r = await client.get("/api/admin/dashboard", headers=a_headers)
        assert r.status_code == 200
        assert r.json()["stats"]["total_patients"] >= 2


def test_full_healthcare_workflow():
    asyncio.run(_run_workflow())
