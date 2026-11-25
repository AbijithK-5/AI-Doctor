"""
AI vs Human Doctor Comparison Engine.
Compares independent AI decision-support assessments against a licensed Human Doctor's
clinical assessment across 8 structured clinical parameters.
"""

from typing import Any, Dict, List


AUTHORITATIVE_STATEMENT = (
    "The human doctor's clinical assessment remains authoritative. "
    "AI-generated information is provided only for decision support."
)


def _normalize_token(text: str) -> str:
    return " ".join(text.lower().replace("-", " ").split())


def _fuzzy_match(a: str, b: str) -> bool:
    na, nb = _normalize_token(a), _normalize_token(b)
    if na == nb or na in nb or nb in na:
        return True
    wa = set(na.split()) - {"acute", "chronic", "mild", "moderate", "severe", "evaluation", "screen", "suspected"}
    wb = set(nb.split()) - {"acute", "chronic", "mild", "moderate", "severe", "evaluation", "screen", "suspected"}
    if not wa or not wb:
        return False
    overlap = len(wa & wb) / max(min(len(wa), len(wb)), 1)
    return overlap >= 0.5


def compute_comparison(ai_assessment: Any, doctor_assessment: Any) -> Dict[str, Any]:
    ai_conditions: List[str] = [
        c.get("condition_name", "") for c in (ai_assessment.possible_conditions or []) if c.get("condition_name")
    ]
    doc_confirmed = doctor_assessment.confirmed_diagnosis or ""
    doc_differentials: List[str] = doctor_assessment.differential_diagnoses or []
    doc_all_conditions = [doc_confirmed] + [d for d in doc_differentials if d]

    # 1. Condition Matching
    matching_conditions = []
    different_conditions = []
    primary_match = any(_fuzzy_match(ai_c, doc_confirmed) for ai_c in ai_conditions[:1])
    any_top3_match = any(_fuzzy_match(ai_c, doc_c) for ai_c in ai_conditions for doc_c in doc_all_conditions)

    for ai_c in ai_conditions:
        if any(_fuzzy_match(ai_c, doc_c) for doc_c in doc_all_conditions):
            matching_conditions.append(ai_c)
        else:
            different_conditions.append(f"AI suggested: {ai_c}")

    for doc_c in doc_all_conditions:
        if doc_c and not any(_fuzzy_match(doc_c, ai_c) for ai_c in ai_conditions):
            different_conditions.append(f"Doctor identified: {doc_c}")

    # 2. Symptoms Comparison
    ai_symptoms = list(ai_assessment.supporting_symptoms or [])
    doc_symptoms = list(doctor_assessment.symptoms_identified or [])
    shared_symptoms = []
    missing_symptoms = []

    for ds in doc_symptoms:
        if any(_fuzzy_match(ds, ais) for ais in ai_symptoms):
            shared_symptoms.append(ds)
        else:
            missing_symptoms.append(f"Captured by Doctor, missed by AI: {ds}")

    for ais in ai_symptoms:
        if not any(_fuzzy_match(ais, ds) for ds in doc_symptoms):
            missing_symptoms.append(f"Noted by AI, not prioritized by Doctor: {ais}")

    # 3. Investigations Comparison
    ai_invs = list(ai_assessment.suggested_investigations or [])
    doc_invs = list(doctor_assessment.recommended_investigations or [])
    similar_investigations = []
    different_investigations = []

    for di in doc_invs:
        if any(_fuzzy_match(di, aii) for aii in ai_invs):
            similar_investigations.append(di)
        else:
            different_investigations.append(f"Doctor ordered: {di}")

    for aii in ai_invs:
        if not any(_fuzzy_match(aii, di) for di in doc_invs):
            different_investigations.append(f"AI suggested: {aii}")

    # 4. Risk Classification Comparison
    risk_order = {"low": 1, "moderate": 2, "high": 3, "urgent": 4}
    ai_risk = ai_assessment.risk_classification or "moderate"
    doc_risk = doctor_assessment.risk_classification or "moderate"
    risk_diff = abs(risk_order.get(ai_risk, 2) - risk_order.get(doc_risk, 2))
    risk_comparison = {
        "ai_risk": ai_risk,
        "doctor_risk": doc_risk,
        "risk_match": ai_risk == doc_risk,
        "variance_note": (
            "Exact risk tier match"
            if ai_risk == doc_risk
            else f"Doctor classified risk as '{doc_risk}' vs AI '{ai_risk}'"
        ),
    }

    # 5. Agreement & Disagreement Analysis
    areas_of_agreement = []
    areas_of_disagreement = []

    if matching_conditions:
        areas_of_agreement.append(
            f"Condition overlap on: {', '.join(matching_conditions)} (Doctor confirmed: {doc_confirmed})."
        )
    else:
        areas_of_disagreement.append(
            f"Diagnostic divergence: Doctor confirmed '{doc_confirmed}', whereas AI prioritized '{', '.join(ai_conditions[:2])}'."
        )

    if shared_symptoms:
        areas_of_agreement.append(f"Both identified key symptoms: {', '.join(shared_symptoms)}.")
    if missing_symptoms:
        areas_of_disagreement.append(
            f"Symptom weighting differences ({len(missing_symptoms)} item(s)) between patient self-report and clinical exam."
        )

    if similar_investigations:
        areas_of_agreement.append(f"Aligned diagnostic workup: {', '.join(similar_investigations)}.")
    if different_investigations:
        areas_of_disagreement.append(
            f"Investigation plan variance: {len(different_investigations)} test(s) differed based on physical exam findings."
        )

    if ai_risk == doc_risk:
        areas_of_agreement.append(f"Consensus on {doc_risk.upper()} clinical risk classification.")
    else:
        areas_of_disagreement.append(
            f"Risk stratification difference: Doctor assessed {doc_risk.upper()} vs AI {ai_risk.upper()}."
        )

    if doctor_assessment.disagreement_notes:
        areas_of_disagreement.append(f"Physician review note: {doctor_assessment.disagreement_notes}")

    # 6. Treatment comparison
    treatment_comparison = (
        "AI provides general educational guidance only and never prescribes treatments. "
        f"Doctor's authoritative clinical plan: {doctor_assessment.treatment_plan or 'Provided during consultation.'}"
    )

    # 7. Overall agreement score & status
    cond_score = 45.0 if primary_match else (28.0 if any_top3_match else 8.0)
    sym_denom = max(len(shared_symptoms) + len(missing_symptoms), 1)
    sym_score = 20.0 * (len(shared_symptoms) / sym_denom)
    inv_denom = max(len(similar_investigations) + len(different_investigations), 1)
    inv_score = 15.0 * (len(similar_investigations) / inv_denom)
    risk_score = 20.0 if risk_diff == 0 else (10.0 if risk_diff == 1 else 0.0)

    agreement_score = round(min(100.0, cond_score + sym_score + inv_score + risk_score), 1)

    if agreement_score >= 70.0 and (primary_match or any_top3_match):
        agreement_status = "agree"
    elif agreement_score >= 40.0 or any_top3_match or risk_diff <= 1:
        agreement_status = "partial_agree"
    else:
        agreement_status = "disagree"

    return {
        "agreement_status": agreement_status,
        "agreement_score": agreement_score,
        "matching_conditions": matching_conditions,
        "different_conditions": different_conditions,
        "shared_symptoms": shared_symptoms,
        "missing_symptoms": missing_symptoms,
        "similar_investigations": similar_investigations,
        "different_investigations": different_investigations,
        "areas_of_agreement": areas_of_agreement,
        "areas_of_disagreement": areas_of_disagreement,
        "risk_comparison": risk_comparison,
        "treatment_comparison": treatment_comparison,
        "authoritative_statement": AUTHORITATIVE_STATEMENT,
    }
