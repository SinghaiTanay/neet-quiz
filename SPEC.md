# NEET Quiz Platform - Specification Document

## 1. Project Overview

**Project Name:** NEET Quiz Generator
**Type:** Full-stack web application
**Core Functionality:** AI-powered NEET-style quiz generation and examination platform
**Target Users:** NEET aspirants (Class 11, 12, and droppers)

## 2. Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** TailwindCSS + ShadCN UI
- **Charts:** Recharts
- **Math Rendering:** KaTeX
- **State Management:** React Context + Zustand

### Backend
- **Framework:** FastAPI (Python)
- **Database:** SQLite with SQLAlchemy
- **AI Integration:** Groq API (primary), MiniMax API (fallback)

### Deployment
- Frontend: Vercel
- Backend: Render/Railway

## 3. Visual & Design Specification

### Color Palette
```css
--primary: #1e40af (Dark Blue - NTA theme)
--primary-light: #3b82f6
--secondary: #64748b (Slate gray)
--accent: #10b981 (Green - correct/answered)
--warning: #f59e0b (Amber - marked for review)
--error: #ef4444 (Red - unanswered)
--background: #ffffff
--surface: #f8fafc
--border: #e2e8f0
--text-primary: #1e293b
--text-secondary: #64748b
```

### Typography
- **Font Family:** Inter (primary), system-ui fallback
- **Headings:** 600-700 weight
- **Body:** 400-500 weight
- **Monospace:** JetBrains Mono (for formulas)

### Layout Specifications
- Container max-width: 1400px
- Question card max-width: 900px
- Palette width: 280px (desktop)
- Spacing unit: 4px base (0.25rem)

### NTA-Style Question Palette Colors
- Unvisited: `#94a3b8` (Gray)
- Answered: `#22c55e` (Green)
- Marked for Review: `#a855f7` (Purple)
- Unanswered: `#ef4444` (Red)

## 4. Feature Specifications

### 4.1 Home Page
- Hero section with animated gradient background
- "Generate NEET-style quizzes instantly" tagline
- Feature highlights (AI-powered, NTA-style, etc.)
- Subject preview cards (Physics, Chemistry, Biology)
- "Start Quiz" CTA button

### 4.2 Quiz Configuration Flow

#### Step 1: Class Selection
- Options: Class 11, Class 12, Both, Dropper
- Display: Compact cards with icons
- Visual feedback on selection

#### Step 2: Subject Selection
- Options: Physics, Chemistry, Botany, Zoology
- Multi-select enabled
- Subject icons and color coding

#### Step 3: Chapter Selection
- Dynamic chapters based on selected subjects
- Searchable list with checkboxes
- "Select All" option
- Chapter count display
- Category grouping (Physics/Chemistry/Biology)

#### Step 4: Quiz Configuration
- Difficulty: Easy, Medium, Hard, Mixed
- Question count: 10, 20, 30, 50, Custom (1-100)
- Timer: Auto-calculated (45s/question) or custom
- Mode: Practice (instant explanations) / Exam (post-submit only)
- Negative marking display (+4 / -1)

### 4.3 Quiz Interface

#### Top Bar
- Timer (countdown, sticky)
- Question progress (X of Y)
- Quiz title
- Fullscreen toggle

#### Left Panel - Question Area
- Question number badge
- Subject/Chapter tags
- Question text with KaTeX support
- 4 options (A, B, C, D)
- Navigation buttons

#### Right Panel - Question Palette
- Grid of question numbers
- Color-coded status
- Click to navigate
- Collapsible on mobile
- Legend with status colors

#### Bottom Navigation
- Previous (disabled on Q1)
- Save & Next
- Mark for Review (toggle)
- Submit Test (with confirmation)

#### Keyboard Shortcuts
- Arrow keys: Navigate options
- 1-4: Select option
- R: Mark for review
- S: Save and next
- P: Previous
- Enter: Submit (on last question)

### 4.4 AI Quiz Generation

#### Prompt Engineering
- NEET PYQ style questions
- NCERT-aligned content
- Balanced conceptual/numerical mix
- Realistic distractors
- Detailed explanations

#### Generation Process
1. Send structured prompt to AI
2. Validate JSON response
3. Retry on malformed data (max 3)
4. Cache quiz in database
5. Return quiz to frontend

#### Loading States
- Animated progress indicator
- "Generating NEET-level questions..."
- Chapter analysis status
- Exam environment preparation

### 4.5 Result Page

#### Score Summary
- Total score display
- Percentage calculation
- Time taken
- Correct/Incorrect/Unanswered counts

#### Performance Charts
- Pie chart: Question distribution
- Bar chart: Subject-wise performance
- Line graph: Accuracy over time

#### Detailed Analysis
- Chapter-wise breakdown
- Subject-wise breakdown
- Time per question analysis
- Difficulty distribution

#### Answer Review
- All questions with solutions
- Correct answer highlight
- Student's answer comparison
- Explanation display

### 4.6 Data Persistence
- LocalStorage for quiz state
- Auto-save answers
- Resume on page refresh
- Clear on quiz submit

## 5. Data Models

### Subjects
```json
{
  "id": "physics",
  "name": "Physics",
  "icon": "atom",
  "chapters": ["motion", "thermodynamics", ...]
}
```

### Chapters
```json
{
  "id": "motion_one_dimension",
  "name": "Motion in One Dimension",
  "subject": "physics",
  "class": ["11"],
  "topics": ["kinematics", "vectors", ...]
}
```

### Quiz Question
```json
{
  "id": "uuid",
  "question": "string",
  "options": ["A", "B", "C", "D"],
  "correct_answer": 0,
  "explanation": "string",
  "subject": "string",
  "chapter": "string",
  "topic": "string",
  "difficulty": "easy|medium|hard",
  "type": "conceptual|numerical"
}
```

### Quiz Session
```json
{
  "id": "uuid",
  "questions": [...],
  "config": {
    "subjects": [...],
    "chapters": [...],
    "difficulty": "string",
    "question_count": 20,
    "mode": "practice|exam",
    "time_limit": 900
  },
  "answers": {...},
  "marks": {...},
  "started_at": "timestamp",
  "submitted_at": "timestamp"
}
```

## 6. API Endpoints

### GET /api/subjects
Returns list of available subjects

### GET /api/chapters?subjects=physics,chemistry
Returns chapters for selected subjects

### POST /api/generate-quiz
```json
Request:
{
  "subjects": ["physics", "chemistry"],
  "chapters": ["motion_one_dimension", "current_electricity"],
  "difficulty": "medium",
  "question_count": 20,
  "class": "12"
}

Response:
{
  "quiz_id": "uuid",
  "questions": [...],
  "time_limit": 900,
  "generated_at": "timestamp"
}
```

### POST /api/submit-quiz
```json
Request:
{
  "quiz_id": "uuid",
  "answers": {"q1": 0, "q2": 2, ...},
  "time_taken": 850
}

Response:
{
  "score": 72,
  "correct": 18,
  "incorrect": 2,
  "unanswered": 0,
  "analysis": {...}
}
```

## 7. Backend Configuration

### Environment Variables
```
GROQ_API_KEY=your_groq_key
MINIMAX_API_KEY=your_minimax_key
DATABASE_URL=sqlite:///neet_quiz.db
```

### AI Response Validation
- Validate JSON structure
- Check for exactly 4 options
- Verify valid answer index (0-3)
- Ensure no duplicate questions
- Retry up to 3 times on failure

## 8. Mobile Specifications

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Layout
- Single column layout
- Collapsible question palette (drawer)
- Sticky timer bar
- Bottom sheet for navigation
- Swipe gestures for question navigation

### Touch Optimizations
- Tap targets: min 44px
- Swipe to navigate
- Pull to expand palette

## 9. Performance Requirements

### Loading Targets
- Initial page load: < 2s
- AI quiz generation: < 10s
- Question navigation: < 100ms
- Answer submission: < 200ms

### Optimization
- Code splitting per route
- Image lazy loading
- KaTeX on-demand loading
- Debounced saves to localStorage

## 10. Error Handling

### Network Errors
- Retry with exponential backoff
- Offline mode indication
- Cached quiz recovery

### AI Errors
- Fallback to MiniMax if Groq fails
- Manual retry option
- Clear error messages

### Validation Errors
- Form validation with clear feedback
- Prevent submission with missing fields
- Reset option available

## 11. Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support
- Focus indicators

## 12. File Structure

```
neet-quiz-platform/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx
│   │   │   ├── quiz/
│   │   │   │   ├── configure/
│   │   │   │   ├── [id]/
│   │   │   │   └── results/
│   │   │   └── api/
│   │   ├── components/
│   │   ├── lib/
│   │   └── styles/
│   └── package.json
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── routes/
│   ├── ai/
│   └── requirements.txt
└── SPEC.md
```