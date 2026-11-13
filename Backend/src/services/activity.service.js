const activityEventModel = require("../models/activity-event-model");

async function recordActivity(input, model = activityEventModel) {
    const activity = {
        user: input.userId,
        eventId: input.eventId,
        type: input.type,
    };

    if (input.productId) activity.product = input.productId;
    if (input.query) activity.query = input.query.trim();

    try {
        const event = await model.create(activity);
        return { event, duplicate: false };
    } catch (error) {
        if (error.code !== 11000) throw error;

        const existingEvent = await model.findOne({
            user: input.userId,
            eventId: input.eventId,
        });
        if (!existingEvent) throw error;

        return { event: existingEvent, duplicate: true };
    }
}

module.exports = { recordActivity };
