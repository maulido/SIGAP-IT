// SLA Calculator Helper Functions

// Get SLA config based on priority
export function getSLAConfig(priority) {
    const configs = {
        'Critical': { response: 1, resolution: 4 },
        'High': { response: 2, resolution: 8 },
        'Medium': { response: 4, resolution: 24 },
        'Low': { response: 8, resolution: 48 },
    };
    return configs[priority] || configs['Medium'];
}

// Calculate SLA deadlines
export function calculateSLADeadlines(createdAt, priority) {
    const config = getSLAConfig(priority);
    const responseDeadline = new Date(createdAt.getTime() + config.response * 60 * 60 * 1000);
    const resolutionDeadline = new Date(createdAt.getTime() + config.resolution * 60 * 60 * 1000);

    return {
        slaResponseDeadline: responseDeadline,
        slaResolutionDeadline: resolutionDeadline,
    };
}

// Calculate actual time with pause consideration
export function calculateActualTime(startTime, endTime, pausedDuration = 0) {
    const totalMs = endTime - startTime;
    const totalHours = totalMs / (1000 * 60 * 60);
    return totalHours - pausedDuration;
}

// Get SLA status
export function getSLAStatus(deadline, currentTime = new Date()) {
    const timeLeft = deadline - currentTime;
    const hoursLeft = timeLeft / (1000 * 60 * 60);

    if (hoursLeft < 0) return 'breached';
    if (hoursLeft < 1) return 'at-risk';
    return 'on-track';
}
