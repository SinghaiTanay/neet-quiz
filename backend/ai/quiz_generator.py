import os
import json
from typing import List
from dotenv import load_dotenv

# Load environment variables FIRST
load_dotenv()

import groq

class QuizGenerator:
    def __init__(self):
        self.groq_client = None
        self._init_groq()

    def _init_groq(self):
        api_key = os.getenv("GROQ_API_KEY", "")
        if api_key:
            try:
                self.groq_client = groq.Groq(api_key=api_key)
            except Exception as e:
                print(f"Groq initialization failed: {e}")

    async def generate_questions(
        self,
        chapters: List[str],
        difficulty: str,
        count: int
    ) -> List[dict]:
        """Generate NEET-style questions using AI"""

        if not self.groq_client:
            return self._generate_fallback_questions(chapters, difficulty, count)

        chapters_text = ", ".join(chapters)

        prompt = f"""Generate {count} NEET MCQs from: {chapters_text}. Difficulty: {difficulty.upper()}.

Include actual NEET PYQ years when possible. NEET exam is held every year (2024, 2023, 2022, 2021, 2020, 2019, etc). If a question is from a PYQ, add the year at the end like "(PYQ 2023)" or "(PYQ 2022)". If you don't know the year, set pyq_year to null.

Return JSON only with {count} questions. Format:
{{"questions": [{{"question": "Question text", "options": ["A","B","C","D"], "correct_answer": 0-3, "explanation": "text", "subject": "physics/chemistry/botany/zoology", "chapter": "id", "chapter_name": "name", "difficulty": "{difficulty}", "type": "conceptual", "pyq_year": "2024/2023/2022/2021/2020/2019 or null"}}]}}"""

        try:
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "NEET question setter. Return ONLY valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=8000
            )

            content = response.choices[0].message.content.strip()

            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()

            result = json.loads(content)

            if "questions" in result and len(result["questions"]) > 0:
                validated = self._validate_questions(result["questions"], count)
                return validated

        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            return await self._extract_and_retry(content, count, difficulty)

        except Exception as e:
            print(f"Groq API error: {e}")

        return self._generate_fallback_questions(chapters, difficulty, count)

    def _validate_questions(self, questions: List[dict], expected_count: int) -> List[dict]:
        """Validate and fix question format"""
        validated = []
        seen_questions = set()

        for q in questions:
            if not all(k in q for k in ["question", "options", "correct_answer", "explanation", "subject"]):
                continue

            if len(q["options"]) != 4:
                continue

            if q["correct_answer"] not in [0, 1, 2, 3]:
                continue

            q_hash = q["question"][:100].lower()
            if q_hash in seen_questions:
                continue
            seen_questions.add(q_hash)

            subject = q["subject"].lower()
            if "botany" in subject:
                subject = "botany"
            elif "zoology" in subject:
                subject = "zoology"
            elif "physics" in subject:
                subject = "physics"
            elif "chemistry" in subject:
                subject = "chemistry"

            validated.append({
                "question": q["question"],
                "options": q["options"],
                "correct_answer": q["correct_answer"],
                "explanation": q["explanation"],
                "subject": subject,
                "chapter": q.get("chapter", ""),
                "chapter_name": q.get("chapter_name", q.get("chapter", "")),
                "difficulty": q.get("difficulty", "medium"),
                "type": q.get("type", "conceptual"),
                "pyq_year": q.get("pyq_year", None)
            })

            if len(validated) >= expected_count:
                break

        return validated

    async def _extract_and_retry(self, content: str, count: int, difficulty: str) -> List[dict]:
        try:
            start = content.find("{")
            end = content.rfind("}") + 1
            if start != -1 and end != -1:
                json_str = content[start:end]
                result = json.loads(json_str)
                if "questions" in result:
                    return self._validate_questions(result["questions"], count)
        except:
            pass
        return self._generate_fallback_questions([], difficulty, count)

    def _generate_fallback_questions(self, chapters: List[str], difficulty: str, count: int) -> List[dict]:
        """Generate basic questions when API is unavailable"""
        fallback_questions = [
            {"question": "The acceleration due to gravity on Earth's surface is approximately: (PYQ 2022)", "options": ["7.8 m/s2", "9.8 m/s2", "11.2 m/s2", "13.6 m/s2"], "correct_answer": 1, "explanation": "g = 9.8 m/s2 on Earth's surface", "subject": "physics", "chapter": "gravitation", "chapter_name": "Gravitation", "difficulty": "easy", "type": "numerical", "pyq_year": "2022"},
            {"question": "A wire of resistance 20 ohm connected to 10V battery draws current:", "options": ["0.2 A", "0.5 A", "2 A", "5 A"], "correct_answer": 1, "explanation": "I = V/R = 10/20 = 0.5 A", "subject": "physics", "chapter": "current_electricity", "chapter_name": "Current Electricity", "difficulty": "easy", "type": "numerical", "pyq_year": "2023"},
            {"question": "SI unit of electric current:", "options": ["Volt", "Ampere", "Ohm", "Coulomb"], "correct_answer": 1, "explanation": "Ampere is SI unit of current", "subject": "physics", "chapter": "current_electricity", "chapter_name": "Current Electricity", "difficulty": "easy", "type": "conceptual", "pyq_year": None},
            {"question": "Resistance is inversely proportional to:", "options": ["Length", "Area", "Temperature", "Material"], "correct_answer": 1, "explanation": "R = pL/A", "subject": "physics", "chapter": "current_electricity", "chapter_name": "Current Electricity", "difficulty": "easy", "type": "conceptual", "pyq_year": None},
            {"question": "Total resistance of 2 + 4 ohm in series:", "options": ["6 ohm", "2 ohm", "4 ohm", "8 ohm"], "correct_answer": 0, "explanation": "R = 2 + 4 = 6 ohm", "subject": "physics", "chapter": "current_electricity", "chapter_name": "Current Electricity", "difficulty": "medium", "type": "numerical", "pyq_year": "2021"},
            {"question": "pH of [H+] = 1 x 10^-4 M:", "options": ["2", "4", "6", "10"], "correct_answer": 1, "explanation": "pH = -log(10^-4) = 4", "subject": "chemistry", "chapter": "basic_concepts", "chapter_name": "Some Basic Concepts", "difficulty": "easy", "type": "numerical", "pyq_year": "2022"},
            {"question": "Mn2+ has maximum unpaired electrons:", "options": ["Ti3+", "V3+", "Mn2+", "Fe2+"], "correct_answer": 2, "explanation": "Mn2+ has 5 unpaired electrons", "subject": "chemistry", "chapter": "atomic_structure", "chapter_name": "Atomic Structure", "difficulty": "medium", "type": "conceptual", "pyq_year": "2023"},
            {"question": "Powerhouse of cell:", "options": ["Nucleus", "Mitochondria", "Golgi", "ER"], "correct_answer": 1, "explanation": "Mitochondria produce ATP", "subject": "botany", "chapter": "cell_theory", "chapter_name": "Cell: The Unit of Life", "difficulty": "easy", "type": "conceptual", "pyq_year": "2021"},
            {"question": "Longest bone in human:", "options": ["Humerus", "Tibia", "Femur", "Fibula"], "correct_answer": 2, "explanation": "Femur is longest", "subject": "zoology", "chapter": "structural_organisation", "chapter_name": "Structural Organisation", "difficulty": "easy", "type": "conceptual", "pyq_year": "2020"},
            {"question": "Highest frequency EM wave:", "options": ["Infrared", "UV", "X-rays", "Gamma rays"], "correct_answer": 3, "explanation": "Gamma rays have highest frequency", "subject": "physics", "chapter": "electromagnetic_waves", "chapter_name": "Electromagnetic Waves", "difficulty": "easy", "type": "conceptual", "pyq_year": None},
            {"question": "Site of photosynthesis:", "options": ["Mitochondria", "Chloroplast", "Ribosome", "Nucleus"], "correct_answer": 1, "explanation": "Chloroplasts are site of photosynthesis", "subject": "botany", "chapter": "cell_theory", "chapter_name": "Cell: The Unit of Life", "difficulty": "easy", "type": "conceptual", "pyq_year": "2022"},
            {"question": "Functional unit of kidney:", "options": ["Neuron", "Nephron", "Alveoli", "Glomerulus"], "correct_answer": 1, "explanation": "Nephron is the functional unit", "subject": "zoology", "chapter": "excretory_products", "chapter_name": "Excretory Products", "difficulty": "easy", "type": "conceptual", "pyq_year": "2023"},
            {"question": "KE of 5kg body at 10m/s:", "options": ["50 J", "100 J", "250 J", "500 J"], "correct_answer": 2, "explanation": "KE = 0.5 x 5 x 100 = 250 J", "subject": "physics", "chapter": "work_energy_power", "chapter_name": "Work, Energy and Power", "difficulty": "easy", "type": "numerical", "pyq_year": None},
            {"question": "Highest electronegativity:", "options": ["O", "N", "F", "Cl"], "correct_answer": 2, "explanation": "Fluorine has EN = 4.0", "subject": "chemistry", "chapter": "periodic_table", "chapter_name": "Periodic Table", "difficulty": "easy", "type": "conceptual", "pyq_year": "2021"},
            {"question": "Universal donor:", "options": ["A", "B", "AB", "O"], "correct_answer": 3, "explanation": "O- is universal donor", "subject": "zoology", "chapter": "body_fluids_circulation", "chapter_name": "Body Fluids", "difficulty": "easy", "type": "conceptual", "pyq_year": "2022"},
            {"question": "Force between parallel currents:", "options": ["Attractive if same direction", "Repulsive if same", "Always attractive", "Always zero"], "correct_answer": 0, "explanation": "Attractive when currents in same direction", "subject": "physics", "chapter": "magnetic_effects", "chapter_name": "Magnetic Effects", "difficulty": "medium", "type": "conceptual", "pyq_year": None},
            {"question": "IUPAC name of CH3-CH=CH-CHO:", "options": ["But-2-enal", "But-3-enal", "But-2-en-1-al", "But-3-en-1-al"], "correct_answer": 0, "explanation": "But-2-enal", "subject": "chemistry", "chapter": "aldehydes_ketones", "chapter_name": "Aldehydes, Ketones", "difficulty": "medium", "type": "conceptual", "pyq_year": "2023"},
            {"question": "Dark reaction site:", "options": ["Grana", "Stroma", "Thylakoid", "Lamella"], "correct_answer": 1, "explanation": "Calvin cycle occurs in stroma", "subject": "botany", "chapter": "morphology", "chapter_name": "Morphology", "difficulty": "medium", "type": "conceptual", "pyq_year": "2020"},
            {"question": "Longest small intestine part:", "options": ["Duodenum", "Jejunum", "Ileum", "Cecum"], "correct_answer": 2, "explanation": "Ileum is the longest (3.5m)", "subject": "zoology", "chapter": "digestion_absorption", "chapter_name": "Digestion", "difficulty": "easy", "type": "conceptual", "pyq_year": None},
            {"question": "Sigma bonds in benzene:", "options": ["6", "9", "12", "15"], "correct_answer": 2, "explanation": "Benzene has 12 sigma bonds", "subject": "chemistry", "chapter": "p_block_11", "chapter_name": "p-Block Elements", "difficulty": "medium", "type": "conceptual", "pyq_year": "2021"}
        ]

        filtered = fallback_questions
        if chapters:
            keywords = [c.lower().split()[0] for c in chapters]
            filtered = [q for q in fallback_questions
                       if any(kw in q['chapter'].lower() or kw in q['chapter_name'].lower() for kw in keywords)]
            if len(filtered) < count:
                filtered = fallback_questions

        return filtered[:min(count, len(filtered))]