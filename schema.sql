-- --------------------------------------------------------
-- Database Structure for Unilorin Automated Grading System
-- Author: Antigravity
-- DBMS: MySQL / MariaDB
-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--
CREATE TABLE IF NOT EXISTS `sessions` (
    `id` VARCHAR(36) PRIMARY KEY,
    `label` VARCHAR(255) NOT NULL COMMENT 'e.g. 2024/2025',
    `is_current` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--
-- Table structure for table `courses`
-- Note: A course explicitly belongs to a session. 
--
CREATE TABLE IF NOT EXISTS `courses` (
    `id` VARCHAR(36) PRIMARY KEY,
    `session_id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `status` ENUM('Active', 'Draft') DEFAULT 'Draft',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE
);

--
-- Table structure for table `students`
--
CREATE TABLE IF NOT EXISTS `students` (
    `id` VARCHAR(36) PRIMARY KEY,
    `matric_no` VARCHAR(50) UNIQUE NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--
-- Table structure for table `enrollments`
-- Links students to courses (and implicitly the session of that course).
--
CREATE TABLE IF NOT EXISTS `enrollments` (
    `id` VARCHAR(36) PRIMARY KEY,
    `student_id` VARCHAR(36) NOT NULL,
    `course_id` VARCHAR(36) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
    UNIQUE(`student_id`, `course_id`)
);

--
-- Table structure for table `assessments`
--
CREATE TABLE IF NOT EXISTS `assessments` (
    `id` VARCHAR(36) PRIMARY KEY,
    `course_id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL COMMENT 'e.g., CA 1, Midterm Exam',
    `status` ENUM('Active', 'Draft') DEFAULT 'Draft',
    `calculator_type` ENUM('None', 'Basic', 'Scientific') DEFAULT 'None',
    `duration_minutes` INT NOT NULL,
    `default_mark` DECIMAL(5,2),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE
);

--
-- Table structure for table `questions`
--
CREATE TABLE IF NOT EXISTS `questions` (
    `id` VARCHAR(36) PRIMARY KEY,
    `course_id` VARCHAR(36) NOT NULL,
    `assessment_id` VARCHAR(36) NOT NULL,
    `type` ENUM('MCQ', 'Fill-in-gap', 'Essay') NOT NULL,
    `question_text` TEXT NOT NULL,
    `mark` DECIMAL(5,2),
    `content` JSON COMMENT 'Stores type-specific data like options, answers, etc.',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON DELETE CASCADE
);

--
-- Table structure for table `assessment_attempts`
-- Tracks a student's session taking an entire exam.
--
CREATE TABLE IF NOT EXISTS `assessment_attempts` (
    `id` VARCHAR(36) PRIMARY KEY,
    `student_id` VARCHAR(36) NOT NULL,
    `assessment_id` VARCHAR(36) NOT NULL,
    `start_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `end_time` TIMESTAMP NULL,
    `status` ENUM('In_Progress', 'Submitted', 'Graded') DEFAULT 'In_Progress',
    `total_score` DECIMAL(5,2) DEFAULT 0.00,
    `time_left_seconds` INT DEFAULT NULL,
    `current_state` JSON DEFAULT NULL COMMENT 'Stores auto-saved student answers and question pointer',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON DELETE CASCADE,
    UNIQUE(`student_id`, `assessment_id`)
);

--
-- Table structure for table `submissions`
-- The specific answers to individual questions.
--
CREATE TABLE IF NOT EXISTS `submissions` (
    `id` VARCHAR(36) PRIMARY KEY,
    `attempt_id` VARCHAR(36) NOT NULL,
    `student_id` VARCHAR(36) NOT NULL,
    `course_id` VARCHAR(36) NOT NULL,
    `assessment_id` VARCHAR(36) NOT NULL,
    `question_id` VARCHAR(36) NOT NULL,
    `student_answer` TEXT,
    `score` DECIMAL(5,2) DEFAULT 0.00,
    `status` ENUM('Pending', 'Graded') DEFAULT 'Pending',
    `ai_feedback` TEXT,
    `similarity_score` DECIMAL(5,2),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`attempt_id`) REFERENCES `assessment_attempts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE,
    UNIQUE(`attempt_id`, `question_id`)
);
