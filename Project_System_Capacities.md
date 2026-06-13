# Unilorin Automated Grading System - Application Capacity & Documentation

## 1. System Capabilities & Features

### Core Assessment Capabilities
- **Multi-Format Question Support**: The application supports Multiple Choice Questions (MCQ), Fill-in-the-gap, and Essay questions.
- **Automated Grading Engine**: 
  - *MCQ & Fill-in-the-gap*: Rule-based exact matching and variation matching for instantaneous automated grading.
  - *Essay Questions*: AI-driven semantic evaluation using Sentence-BERT (SBERT) to grade theoretical answers based on meaning rather than mere keyword extraction.

### Resilience & Power Outage Management
- **Continuous Auto-Save & State Recovery**: Designed specifically to combat power and internet outages common in the region.
  - The system periodically captures the student's state (answers chosen, current time remaining, and current question pointer).
  - This state is saved in two places: locally on the device (LocalStorage/IndexedDB) and remotely on the server in the `assessment_attempts` table via background API requests.
  - Upon a sudden disruption (power outage), the student can log back in. The application fetches the saved `current_state` from the database or local cache, allowing the student to resume from the exact second they left off, with zero data loss.

### Academic Administration
- **Course & Session Management**: Organizes courses by academic sessions efficiently linked through relational databases.
- **Secure Role & Access**: Manages student enrollments, controls test durations, restricts unauthorized external access, and handles attempts securely.

---

## 2. Educational Backing: SBERT for Automated Essay Grading

### Traditional vs. Semantic Grading
Traditional automated grading systems rely heavily on exact keyword matching. This approach penalizes intelligent students who understand the core concept but use synonyms or different sentence structures from the marking guide.

### The SBERT Approach
Sentence-BERT (SBERT) is a modification of the pre-trained BERT network that uses siamese and triplet network structures to derive semantically meaningful sentence embeddings.
- **How it Works**: The lecturer provides a reference answer (marking guide). When a student submits a typed essay, both the student's answer and the reference answer are passed through the SBERT model to generate high-dimensional vectors. The system then calculates the cosine similarity between these two vectors.
- **Educational & Pedagogical Value**: 
  - **Fairness & Construct Validity**: Grades are based on the conceptual semantic similarity of the text, rewarding true comprehension over rote memorization.
  - **Immediate Feedback**: It drastically accelerates the grading process for large-scale classes (e.g., General Studies courses), ensuring students receive feedback rapidly.
  - **Scalability**: Allows educational institutions to increase the frequency of formative assessments without overburdening the academic staff.

---

## 3. Chapter 3: Methodology Tips for Your Project Documentation

When writing Chapter 3 (usually "System Analysis and Design" or "Research Methodology") for your Final Year Project, consider structuring it logically to highlight both the standard software development processes and your unique AI/Resilience additions.

Here are sections you should definitively include:

### 3.1. Research Methodology
*Tip*: State the specific software engineering methodology you adopted (e.g., Agile, Iterative, or Object-Oriented Analysis and Design - OOAD). Justify your choice—for instance, Agile allows for iterative testing and fine-tuning of the SBERT model accuracy alongside UI development.

### 3.2. System Architecture (The "Bird's-Eye View")
*Tip*: Describe your application using a 3-tier architecture model:
- **Presentation Layer (Frontend)**: Where students interact with the CBT interface. Mention how it handles the local auto-save cache.
- **Application Logic Layer (Backend)**: Your Python backend that routes API requests, manages exam timers securely, and hosts the SBERT model inference.
- **Data Layer**: The MySQL database hosting tables like `sessions`, `courses`, `assessments`, and tracking states via `assessment_attempts`.

### 3.3. The AI Grading Mechanism (Crucial for Innovation Points)
*Tip*: Dedicate a section specifically to how the Automated Essay Grading works. Mention:
- The base pre-trained model (e.g., `all-MiniLM-L6-v2` because it is lightweight and performs fast inference).
- The text sanitization/preprocessing step (removing noise before vectorization).
- The Cosine Similarity formula used to match vectors and calculate a percentage score out of the allotted question marks.

### 3.4. Outage Resilience & Auto-Save Design
*Tip*: Clearly outline the workflow for your resilience feature. You can create a simple flowchart in your project:
1. *Trigger*: Student selects an answer or time ticks down.
2. *Local Action*: Frontend saves current state to browser local storage.
3. *Network Action*: Frontend triggers asynchronous API call (debounced, e.g., every 5-10 seconds) to update `assessment_attempts.current_state`.
4. *Recovery Action*: On reconnection, the backend syncs the time elapsed to prevent cheating, and resumes the session.
Explain that this directly addresses a major problem statement: infrastructure instability in developing nations.

### 3.5. Database Design
*Tip*: Include an Entity Relationship Diagram (ERD) mapping the tables exactly as you have them in your `schema.sql`. Explain the core constraints (e.g., how `submissions` link back to `assessment_attempts` and `questions` to ensure strict auditing).

### 3.6. Development Tools and Technologies
*Tip*: List them out professionally and state *why* you chose them:
- **Frontend**: E.g., HTML5, CSS3, JavaScript/React (for responsive, dynamic interfaces).
- **Backend & AI Engine**: Python, FastApi/Flask/Django (great for ML integration), `Sentence-Transformers` library, `scikit-learn` (for cosine similarity).
- **Database**: MySQL.
