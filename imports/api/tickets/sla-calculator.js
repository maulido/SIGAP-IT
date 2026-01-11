import { SLAConfigs } from '../sla-configs/sla-configs';

// Get SLA config based on priority
export async function getSLAConfigAsync(priority) {
    const config = await SLAConfigs.findOneAsync({ priority });
    if (config) {
        return {
            _id: config._id,
            response: config.responseTime,
            resolution: config.resolutionTime,
            businessHoursOnly: config.businessHoursOnly
        };
    }

    // Fallback defaults if DB is empty or config missing
    const defaults = {
        'Critical': { _id: null, response: 1, resolution: 4 },
        'High': { _id: null, response: 2, resolution: 8 },
        'Medium': { _id: null, response: 4, resolution: 24 },
        'Low': { _id: null, response: 8, resolution: 48 },
    };
    return defaults[priority] || defaults['Medium'];
}

// Calculate SLA deadlines
export async function calculateSLADeadlinesAsync(createdAt, priority) {
    const config = await getSLAConfigAsync(priority);
    // TODO: Implement business hours logic if config.businessHoursOnly is true
    // For now, we use simple 24/7 calculation
    const responseDeadline = new Date(createdAt.getTime() + config.response * 60 * 60 * 1000);
    const resolutionDeadline = new Date(createdAt.getTime() + config.resolution * 60 * 60 * 1000);

    return {
        slaConfigId: config._id, // Might need to fetch full doc to get ID if needed
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

