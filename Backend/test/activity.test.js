const assert = require("node:assert/strict");
const test = require("node:test");
const { validationResult } = require("express-validator");
const activityValidators = require("../src/validators/activity.validators");
const { recordActivity } = require("../src/services/activity.service");

async function validateActivity(payload) {
    const req = { body: payload };
    await Promise.all(activityValidators.map((validator) => validator.run(req)));
    return validationResult(req).array();
}

test("valid product and search events pass validation", async () => {
    const productErrors = await validateActivity({
        eventId: "event_123",
        type: "product_view",
        productId: "507f1f77bcf86cd799439011",
    });
    const searchErrors = await validateActivity({
        eventId: "event_456",
        type: "search",
        query: "leather bag",
    });

    assert.deepEqual(productErrors, []);
    assert.deepEqual(searchErrors, []);
});

test("invalid or ambiguous activity payloads fail validation", async () => {
    const errors = await validateActivity({
        eventId: "short",
        type: "search",
        productId: "not-an-id",
        query: " ",
        userId: "507f1f77bcf86cd799439011",
    });

    assert.ok(errors.length >= 3);
});

test("recordActivity persists only supported fields and reports a new event", async () => {
    let created;
    const model = {
        async create(event) {
            created = event;
            return { _id: "event-id", ...event, createdAt: new Date(0) };
        },
    };

    const result = await recordActivity({
        userId: "user-id",
        eventId: "event_123",
        type: "search",
        query: "  leather bag  ",
        ignored: "not persisted",
    }, model);

    assert.deepEqual(created, {
        user: "user-id",
        eventId: "event_123",
        type: "search",
        query: "leather bag",
    });
    assert.equal(result.duplicate, false);
});

test("recordActivity treats a repeated per-user event id as a duplicate", async () => {
    const existing = { _id: "event-id", eventId: "event_123" };
    let lookup;
    const model = {
        async create() {
            const error = new Error("duplicate key");
            error.code = 11000;
            throw error;
        },
        async findOne(filter) {
            lookup = filter;
            return existing;
        },
    };

    const result = await recordActivity({
        userId: "user-id",
        eventId: "event_123",
        type: "product_view",
        productId: "507f1f77bcf86cd799439011",
    }, model);

    assert.deepEqual(lookup, { user: "user-id", eventId: "event_123" });
    assert.equal(result.event, existing);
    assert.equal(result.duplicate, true);
});

test("recordActivity propagates non-duplicate database errors", async () => {
    const databaseError = new Error("database unavailable");
    const model = {
        async create() {
            throw databaseError;
        },
    };

    await assert.rejects(
        recordActivity({
            userId: "user-id",
            eventId: "event_123",
            type: "product_view",
            productId: "507f1f77bcf86cd799439011",
        }, model),
        databaseError
    );
});
