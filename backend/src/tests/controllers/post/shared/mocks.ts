import { Request, Response } from "express";

const createMockRequest = (overrides = {}) =>
  ({
    params: {},
    body: {},
    query: {},
    user: undefined,
    on: vi.fn(),
    ...overrides,
  } as unknown as Request);

const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    headersSent: false,
    writableEnded: false,
  } as unknown as Response;
  return res;
};

export { createMockRequest, createMockResponse };
