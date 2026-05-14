import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import uuid
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

from ai.quiz_generator import QuizGenerator

app = FastAPI(title="NEET Quiz API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

generator = QuizGenerator()

# In-memory quiz sessions and cache storage
quiz_sessions: Dict[str, dict] = {}
quiz_cache: Dict[str, list] = {}

class QuizRequest(BaseModel):
    subjects: List[str]
    chapters: List[str]
    difficulty: str
    question_count: int
    class_level: str
    mode: str = "practice"

class AnswerRequest(BaseModel):
    quiz_id: str
    answers: Dict[str, int]
    time_taken: int

# NEET Chapters Data
CHAPTERS = {
    "physics": {
        "class_11": [
            {"id": "units_and_dimensions", "name": "Units and Measurements", "topics": ["SI Units", "Dimensional Analysis", "Errors"]},
            {"id": "motion_one_dimension", "name": "Motion in One Dimension", "topics": ["Kinematics", "Vectors", "Equations of Motion"]},
            {"id": "motion_two_dimension", "name": "Motion in Two Dimensions", "topics": ["Projectile Motion", "Circular Motion"]},
            {"id": "laws_of_motion", "name": "Laws of Motion", "topics": ["Newton's Laws", "Friction", "Pulley"]},
            {"id": "work_energy_power", "name": "Work, Energy and Power", "topics": ["Work", "Kinetic Energy", "Potential Energy"]},
            {"id": "rotational_motion", "name": "Rotational Motion", "topics": ["Torque", "Angular Momentum", "Moment of Inertia"]},
            {"id": "gravitation", "name": "Gravitation", "topics": ["Kepler's Laws", "Universal Law", "Satellites"]},
            {"id": "properties_of_matter", "name": "Properties of Matter", "topics": ["Elasticity", "Surface Tension", "Viscosity"]},
            {"id": "thermodynamics", "name": "Thermodynamics", "topics": ["Laws of Thermodynamics", "Heat Transfer", "Carnot Engine"]},
            {"id": "kinetic_theory", "name": "Kinetic Theory of Gases", "topics": ["Ideal Gas", "Real Gas", "Brownian Motion"]},
            {"id": "oscillations", "name": "Oscillations", "topics": ["SHM", "Spring", "Pendulum"]},
            {"id": "waves", "name": "Waves", "topics": ["Wave Properties", "Doppler Effect", "Standing Waves"]},
        ],
        "class_12": [
            {"id": "electrostatics", "name": "Electrostatics", "topics": ["Coulomb's Law", "Electric Field", "Capacitors"]},
            {"id": "current_electricity", "name": "Current Electricity", "topics": ["Ohm's Law", "Circuits", "Kirchhoff's Laws"]},
            {"id": "magnetic_effects", "name": "Magnetic Effects of Current", "topics": ["Biot-Savart Law", "Force on Wire", "Torque"]},
            {"id": "magnetism", "name": "Magnetism and Matter", "topics": ["Magnetic Materials", "Earth's Magnetism"]},
            {"id": "electromagnetic_induction", "name": "Electromagnetic Induction", "topics": ["Faraday's Law", "Lenz's Law", "AC Generator"]},
            {"id": "alternating_current", "name": "Alternating Current", "topics": ["AC Circuits", "LC Circuits", "Transformers"]},
            {"id": "electromagnetic_waves", "name": "Electromagnetic Waves", "topics": ["EM Spectrum", "Propagation"]},
            {"id": "ray_optics", "name": "Ray Optics", "topics": ["Reflection", "Refraction", "Lenses", "Mirrors"]},
            {"id": "wave_optics", "name": "Wave Optics", "topics": ["Interference", "Diffraction", "Polarization"]},
            {"id": "dual_nature", "name": "Dual Nature of Radiation", "topics": ["Photoelectric Effect", "Matter Waves"]},
            {"id": "atoms_nuclei", "name": "Atoms and Nuclei", "topics": ["Atomic Models", "Radioactivity", "Nuclear Reactions"]},
            {"id": "electronic_devices", "name": "Electronic Devices", "topics": ["Semiconductors", "Diodes", "Transistors"]},
        ]
    },
    "chemistry": {
        "class_11": [
            {"id": "basic_concepts", "name": "Some Basic Concepts of Chemistry", "topics": ["Mole Concept", "Stoichiometry", "Concentration"]},
            {"id": "atomic_structure", "name": "Atomic Structure", "topics": ["Bohr Model", "Quantum Numbers", "Electronic Configuration"]},
            {"id": "periodic_table", "name": "Periodic Table and Properties", "topics": ["Periodic Trends", "Elements"]},
            {"id": "chemical_bonding", "name": "Chemical Bonding and Molecular Structure", "topics": ["Ionic Bond", "Covalent Bond", "VSEPR"]},
            {"id": "states_of_matter", "name": "States of Matter", "topics": ["Gaseous State", "Liquid State", "Solid State"]},
            {"id": "thermodynamics_chem", "name": "Thermodynamics", "topics": ["Enthalpy", "Entropy", "Gibbs Free Energy"]},
            {"id": "equilibrium", "name": "Equilibrium", "topics": ["Chemical Equilibrium", "Ionic Equilibrium", "Le Chatelier"]},
            {"id": "redox_reactions", "name": "Redox Reactions", "topics": ["Oxidation-Reduction", "Balancing"]},
            {"id": "hydrogen", "name": "Hydrogen", "topics": ["Properties", "Compounds", "Isotopes"]},
            {"id": "s_block", "name": "s-Block Elements", "topics": ["Alkali Metals", "Alkaline Earth Metals"]},
            {"id": "p_block_11", "name": "p-Block Elements (Group 13-18)", "topics": ["Boron Family", "Carbon Family", "Nitrogen Family", "Oxygen Family", "Halogens", "Noble Gases"]},
            {"id": "environmental_chemistry", "name": "Environmental Chemistry", "topics": ["Pollution", "Green Chemistry"]},
        ],
        "class_12": [
            {"id": "solid_state", "name": "Solid State", "topics": ["Crystalline Solids", "Unit Cell", "Defects"]},
            {"id": "solutions", "name": "Solutions", "topics": ["Types of Solutions", "Raoult's Law", "Colligative Properties"]},
            {"id": "electrochemistry", "name": "Electrochemistry", "topics": ["Galvanic Cell", "Electrolytic Cell", "Nernst Equation"]},
            {"id": "chemical_kinetics", "name": "Chemical Kinetics", "topics": ["Rate of Reaction", "Order", "Activation Energy"]},
            {"id": "surface_chemistry", "name": "Surface Chemistry", "topics": ["Adsorption", "Catalysis", "Colloids"]},
            {"id": "p_block_12", "name": "p-Block Elements (Group 15-18)", "topics": ["Nitrogen", "Oxygen", "Halogens", "Noble Gases"]},
            {"id": "d_f_block", "name": "d and f-Block Elements", "topics": ["Transition Metals", "Lanthanides", "Actinides"]},
            {"id": "coordination_compounds", "name": "Coordination Compounds", "topics": ["Nomenclature", "Isomerism", "Bonding"]},
            {"id": "haloalkanes_arenes", "name": "Haloalkanes and Haloarenes", "topics": ["Classification", "Reactions"]},
            {"id": "alcohols_phenols_ethers", "name": "Alcohols, Phenols and Ethers", "topics": ["Properties", "Reactions"]},
            {"id": "aldehydes_ketones", "name": "Aldehydes, Ketones and Carboxylic Acids", "topics": ["Nomenclature", "Reactions"]},
            {"id": "amines", "name": "Amines", "topics": ["Classification", "Reactions"]},
            {"id": "biomolecules", "name": "Biomolecules", "topics": ["Carbohydrates", "Proteins", "Nucleic Acids"]},
        ]
    },
    "botany": {
        "class_11": [
            {"id": "living_world", "name": "The Living World", "topics": ["Taxonomy", "Classification"]},
            {"id": "biological_classification", "name": "Biological Classification", "topics": ["Five Kingdoms", "Viruses", "Bacteria"]},
            {"id": "plant_kingdom", "name": "Plant Kingdom", "topics": ["Algae", "Bryophytes", "Pteridophytes", "Gymnosperms", "Angiosperms"]},
            {"id": "morphology", "name": "Morphology of Flowering Plants", "topics": ["Root", "Stem", "Leaf", "Flower"]},
            {"id": "anatomy", "name": "Anatomy of Flowering Plants", "topics": ["Tissues", "Primary Structure", "Secondary Growth"]},
            {"id": "cell_theory", "name": "Cell: The Unit of Life", "topics": ["Cell Theory", "Cell Organelles"]},
            {"id": "biomolecules", "name": "Biomolecules", "topics": ["Carbohydrates", "Proteins", "Lipids", "Nucleic Acids"]},
            {"id": "cell_cycle", "name": "Cell Cycle and Cell Division", "topics": ["Mitosis", "Meiosis"]},
        ],
        "class_12": [
            {"id": "reproduction_organisms", "name": "Reproduction in Organisms", "topics": ["Asexual", "Sexual Reproduction"]},
            {"id": "sexual_reproduction_flowering", "name": "Sexual Reproduction in Flowering Plants", "topics": ["Flower", "Pollination", "Fertilization"]},
            {"id": "plant_reproduction", "name": "Principles of Inheritance and Variation", "topics": ["Mendel's Laws", "Genetics", "Mutation"]},
            {"id": "molecular_genetics", "name": "Molecular Genetics", "topics": ["DNA", "RNA", "Protein Synthesis"]},
            {"id": "biotechnology", "name": "Biotechnology and Its Applications", "topics": ["Recombinant DNA", "Biotech Applications"]},
            {"id": "ecology_intro", "name": "Organisms and Environment", "topics": ["Ecosystem", "Ecological Factors"]},
            {"id": "ecosystem", "name": "Ecosystem", "topics": ["Components", "Energy Flow", "Ecological Pyramids"]},
            {"id": "biodiversity", "name": "Biodiversity and Conservation", "topics": ["Patterns", "Conservation"]},
            {"id": "environmental_issues_bot", "name": "Environmental Issues", "topics": ["Pollution", "Global Warming"]},
        ]
    },
    "zoology": {
        "class_11": [
            {"id": "animal_kingdom", "name": "Animal Kingdom", "topics": ["Classification", "Phyla"]},
            {"id": "structural_organisation", "name": "Structural Organisation in Animals", "topics": ["Tissues", "Organs"]},
            {"id": "biomolecules_zoo", "name": "Biomolecules", "topics": ["Enzymes", "Metabolism"]},
            {"id": "cell_zoo", "name": "Cell: The Unit of Life", "topics": ["Cell Organelles", "Transport"]},
            {"id": "cell_cycle_zoo", "name": "Cell Cycle and Cell Division", "topics": ["Mitosis", "Meiosis"]},
            {"id": "digestion_absorption", "name": "Digestion and Absorption", "topics": ["Human Digestive System"]},
            {"id": "breathing_exchange", "name": "Breathing and Exchange of Gases", "topics": ["Respiratory System"]},
            {"id": "body_fluids_circulation", "name": "Body Fluids and Circulation", "topics": ["Heart", "Blood", "Lymph"]},
            {"id": "excretory_products", "name": "Excretory Products and Their Elimination", "topics": ["Nephron", "Urine Formation"]},
            {"id": "locomotion_movement", "name": "Locomotion and Movement", "topics": ["Skeletal System", "Muscles"]},
            {"id": "neural_control", "name": "Neural Control and Coordination", "topics": ["Neuron", "Nervous System"]},
            {"id": "chemical_coordination", "name": "Chemical Coordination and Integration", "topics": ["Hormones", "Endocrine System"]},
        ],
        "class_12": [
            {"id": "reproduction_human", "name": "Human Reproduction", "topics": ["Reproductive System", "Gametogenesis"]},
            {"id": "reproductive_health", "name": "Reproductive Health", "topics": ["STIs", "Contraception"]},
            {"id": "principles_inheritance", "name": "Principles of Inheritance and Variation", "topics": ["Mendel", "Chromosomal Theory"]},
            {"id": "mendelian_genetics", "name": "Mendelian Genetics", "topics": ["Monohybrid", "Dihybrid Cross"]},
            {"id": "molecular_genetics_zoo", "name": "Molecular Genetics", "topics": ["Gene Expression", "Regulation"]},
            {"id": "evolution", "name": "Evolution", "topics": ["Theories", "Natural Selection", "Speciation"]},
            {"id": "human_health_disease", "name": "Human Health and Disease", "topics": ["Pathogens", "Immunity", "Cancer"]},
            {"id": "immunity", "name": "Immune System", "topics": ["Innite", "Adaptive Immunity"]},
            {"id": "applied_biology", "name": "Applied Biology", "topics": ["Biotechnology", "Biomedical"]},
        ]
    }
}

SUBJECTS = {
    "physics": {"name": "Physics", "icon": "atom"},
    "chemistry": {"name": "Chemistry", "icon": "flask"},
    "botany": {"name": "Botany", "icon": "leaf"},
    "zoology": {"name": "Zoology", "icon": "dna"}
}

@app.get("/")
async def root():
    return {"message": "NEET Quiz API", "version": "1.0.0"}

@app.get("/api/subjects")
async def get_subjects():
    return SUBJECTS

@app.get("/api/chapters")
async def get_chapters(subjects: str = "", class_level: str = ""):
    if not subjects:
        return {}

    subject_list = subjects.split(",")
    result = {}

    for subject in subject_list:
        subject = subject.strip().lower()
        if subject in CHAPTERS:
            result[subject] = []

            # Get chapters based on class level
            if class_level in ["11", "12"]:
                chapters = CHAPTERS[subject].get(f"class_{class_level}", [])
                result[subject] = chapters
            elif class_level == "both":
                chapters_11 = CHAPTERS[subject].get("class_11", [])
                chapters_12 = CHAPTERS[subject].get("class_12", [])
                result[subject] = chapters_11 + chapters_12
            else:
                # Return all chapters
                chapters_11 = CHAPTERS[subject].get("class_11", [])
                chapters_12 = CHAPTERS[subject].get("class_12", [])
                result[subject] = chapters_11 + chapters_12

    return result

@app.post("/api/generate-quiz")
async def generate_quiz(request: QuizRequest):
    try:
        # Generate chapter names for AI
        chapter_names = []
        for subject in request.subjects:
            if subject in CHAPTERS:
                for chapter in CHAPTERS[subject].get("class_11", []) + CHAPTERS[subject].get("class_12", []):
                    if chapter["id"] in request.chapters:
                        chapter_names.append(f"{chapter['name']}")

        # Generate new quiz using AI
        questions = await generator.generate_questions(
            chapters=chapter_names,
            difficulty=request.difficulty,
            count=request.question_count
        )

        # Create quiz session
        quiz_id = str(uuid.uuid4())
        quiz_sessions[quiz_id] = {
            "questions": questions,
            "config": request.dict(),
            "answers": {},
            "started_at": datetime.now().isoformat()
        }

        return {
            "quiz_id": quiz_id,
            "questions": questions,
            "time_limit": request.question_count * 45,
            "mode": request.mode
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/submit-quiz")
async def submit_quiz(request: AnswerRequest):
    if request.quiz_id not in quiz_sessions:
        raise HTTPException(status_code=404, detail="Quiz not found")

    session = quiz_sessions[request.quiz_id]
    questions = session["questions"]

    total_score = 0
    correct = 0
    incorrect = 0
    unanswered = 0
    detailed_analysis = []

    subject_stats = {"physics": {"correct": 0, "total": 0}, "chemistry": {"correct": 0, "total": 0}, "botany": {"correct": 0, "total": 0}, "zoology": {"correct": 0, "total": 0}}
    chapter_stats = {}

    for i, q in enumerate(questions):
        q_id = str(i)
        answer = request.answers.get(q_id)

        is_correct = answer == q["correct_answer"]

        if answer is None:
            unanswered += 1
            score_change = 0
        elif is_correct:
            correct += 1
            total_score += 4
            score_change = 4
        else:
            incorrect += 1
            total_score -= 1
            score_change = -1

        subject = q.get("subject", "unknown").lower()
        chapter = q.get("chapter", "unknown")

        if subject in subject_stats:
            subject_stats[subject]["total"] += 1
            if is_correct and answer is not None:
                subject_stats[subject]["correct"] += 1

        if chapter not in chapter_stats:
            chapter_stats[chapter] = {"correct": 0, "total": 0, "name": q.get("chapter_name", chapter)}
        chapter_stats[chapter]["total"] += 1
        if is_correct and answer is not None:
            chapter_stats[chapter]["correct"] += 1

        detailed_analysis.append({
            "question_number": i + 1,
            "question": q["question"],
            "options": q["options"],
            "correct_answer": q["correct_answer"],
            "user_answer": answer,
            "is_correct": is_correct,
            "score": score_change,
            "explanation": q.get("explanation", ""),
            "subject": q.get("subject", ""),
            "chapter": q.get("chapter", ""),
            "chapter_name": q.get("chapter_name", q.get("chapter", "")),
            "difficulty": q.get("difficulty", "medium")
        })

    return {
        "score": total_score,
        "correct": correct,
        "incorrect": incorrect,
        "unanswered": unanswered,
        "total_questions": len(questions),
        "percentage": round((correct / len(questions)) * 100, 1) if len(questions) > 0 else 0,
        "time_taken": request.time_taken,
        "subject_analysis": subject_stats,
        "chapter_analysis": chapter_stats,
        "detailed_review": detailed_analysis,
        "mode": session["config"].get("mode", "practice")
    }

@app.get("/api/quiz/{quiz_id}")
async def get_quiz(quiz_id: str):
    if quiz_id not in quiz_sessions:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz_sessions[quiz_id]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)