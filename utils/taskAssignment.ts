import type { User, Task } from "./types";

/**
 * matches: A list of the matching skills found.
 * score: A crude match percentage (0-100).
 * worker: The worker object.
 * activeTasks: Number of current tasks this worker has.
 */
export interface WorkerMatchResult {
    worker: User;
    matches: string[];
    score: number;
    activeTasks: number;
}

export interface AssignmentLogDetail {
    workerName: string;
    matchPercentage: number;
    matchCount: number;
    totalRequired: number;
    activeTasks: number;
    status: string; // "Eligible", "BUSY", "LOW SKILL"
}

export interface AssignmentExplanation {
    requirements: string;
    taskSkills: string[];
    candidates: AssignmentLogDetail[];
    outcome: string;
}

export interface AssignmentResult {
    candidates: User[];
    bestWorker?: User | null; // Keep for backward compatibility or highlighting
    log: string;
    analysis: AssignmentExplanation;
}

/**
 * Finds valid workers for a given task based on:
 * 1. Account Status (Must be "active").
 * 2. Skill Match (> 40% required).
 * 3. Workload Limit (< 2 active tasks).
 * 
 * Returns ALL eligible candidates so the task can be broadcasted.
 */
export function findWorkerForTask(
    newTask: Partial<Task>,
    allWorkers: User[],
    allTasks: Task[]
): AssignmentResult {
    // 1. Requirement: Max 2 active tasks
    const WORKLOAD_LIMIT = 2;
    // 2. Requirement: At least 40% skill match
    const SKILL_THRESHOLD_PERCENT = 0;

    const requirementStr = `Account Active AND Match >= ${SKILL_THRESHOLD_PERCENT}% skills AND Active Tasks < ${WORKLOAD_LIMIT}`;

    // Start log
    let log = `Auto-Assignment Debug Log:\n- Requirement: ${requirementStr}\n`;

    const analysis: AssignmentExplanation = {
        requirements: requirementStr,
        taskSkills: newTask.skills || [],
        candidates: [],
        outcome: ""
    };

    if (!newTask.skills || newTask.skills.length === 0) {
        log += "- No skills required by task. Skipping auto-assign.\n";
        analysis.outcome = "No skills required by task. Skipping auto-assign.";
        return { candidates: [], bestWorker: null, log, analysis };
    }

    const rawTaskSkills = Array.isArray(newTask.skills) ? newTask.skills : [];
    const requiredSkills = rawTaskSkills.map((s) => String(s).toLowerCase());
    log += `- Task Skills: ${requiredSkills.join(", ")}\n`;

    // Helper to count active tasks per worker
    const workerTaskCounts: Record<string, number> = {};
    allWorkers.forEach((w) => (workerTaskCounts[w.id] = 0));

    allTasks.forEach((t) => {
        if (
            t.assignedTo &&
            (t.status === "assigned" || t.status === "in-progress")
        ) {
            if (workerTaskCounts[t.assignedTo] !== undefined) {
                workerTaskCounts[t.assignedTo]++;
            }
        }
    });

    const eligibleCandidates: WorkerMatchResult[] = [];

    // Evaluate all workers
    for (const worker of allWorkers) {
        const currentLoad = workerTaskCounts[worker.id] || 0;
        const rawSkills = Array.isArray(worker.skills) ? worker.skills : [];
        const workerSkills = rawSkills.map((s) => String(s).toLowerCase());
        const matchingSkills = requiredSkills.filter((req) => workerSkills.includes(req.toLowerCase()));
        const matchCount = matchingSkills.length;
        const totalRequired = requiredSkills.length;
        const matchPercentage = totalRequired > 0 ? (matchCount / totalRequired) * 100 : 0;

        // Log detail for each worker
        let status = "Eligible";

        // Check Active Status
        if (worker.accountStatus !== "active") {
            status = `INACTIVE (Status: ${worker.accountStatus})`;
        }
        else if (currentLoad >= WORKLOAD_LIMIT) {
            status = "BUSY (Too many tasks)";
        }
        else if (matchPercentage < SKILL_THRESHOLD_PERCENT) {
            status = `LOW SKILL (${matchPercentage.toFixed(0)}%)`;
        }

        log += `  - [${worker.fullName}]: Match ${matchPercentage.toFixed(0)}% (${matchCount}/${totalRequired}), Active: ${currentLoad}, Account: ${worker.accountStatus}. Status: ${status}\n`;

        analysis.candidates.push({
            workerName: worker.fullName,
            matchPercentage,
            matchCount,
            totalRequired,
            activeTasks: currentLoad,
            status
        });

        if (status === "Eligible") {
            eligibleCandidates.push({
                worker,
                matches: matchingSkills,
                score: matchPercentage,
                activeTasks: currentLoad,
            });
        }
    }

    if (eligibleCandidates.length === 0) {
        log += "=> Result: No suitable candidates found.\n";
        analysis.outcome = "No suitable candidates found.";
        return { candidates: [], bestWorker: null, log, analysis };
    }

    // Sort candidates by score (desc) then workload (asc)
    eligibleCandidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.activeTasks - b.activeTasks;
    });

    const candidateUsers = eligibleCandidates.map(c => c.worker);
    const bestOne = candidateUsers[0];

    log += `=> Result: Found ${eligibleCandidates.length} candidates. Best match: ${bestOne.fullName}\n`;
    analysis.outcome = `Found ${eligibleCandidates.length} candidates. Top match: ${bestOne.fullName}`;

    return { candidates: candidateUsers, bestWorker: bestOne, log, analysis };
}
