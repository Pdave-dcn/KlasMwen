import { useAuthStore } from "@/stores/auth.store";
import type { User } from "@/types/auth.type";

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("useAuthStore", () => {
  const mockUser: User = {
    id: "1",
    email: "test@example.com",
    username: "testuser",
    role: "STUDENT",
  };

  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(typeof state.login).toBe("function");
      expect(typeof state.logout).toBe("function");
    });
  });

  describe("login action", () => {
    it("should set user and authenticate when login is called", () => {
      const { login } = useAuthStore.getState();

      login(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it("should handle login with different user objects", () => {
      const { login } = useAuthStore.getState();

      const anotherUser: User = {
        id: "2",
        email: "another@example.com",
        username: "anotheruser",
        role: "STUDENT",
      };

      login(anotherUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(anotherUser);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe("logout action", () => {
    beforeEach(() => {
      // Set up authenticated state before logout tests
      const { login } = useAuthStore.getState();
      login(mockUser);
    });

    it("should clear user and set isAuthenticated to false when logout is called", () => {
      const { logout } = useAuthStore.getState();

      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("state transitions", () => {
    it("should correctly transition from unauthenticated to authenticated", () => {
      let state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);

      state.login(mockUser);

      state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
    });

    it("should correctly transition from authenticated to unauthenticated", () => {
      const { login, logout } = useAuthStore.getState();

      login(mockUser);
      let state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);

      logout();
      state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it("should handle rapid login/logout cycles", () => {
      const { login, logout } = useAuthStore.getState();

      login(mockUser);
      logout();
      login(mockUser);
      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("store subscription", () => {
    it("should notify subscribers when state changes", () => {
      const mockSubscriber = vi.fn();
      const unsubscribe = useAuthStore.subscribe(mockSubscriber);

      const { login, logout } = useAuthStore.getState();

      login(mockUser);
      expect(mockSubscriber).toHaveBeenCalledTimes(1);

      logout();
      expect(mockSubscriber).toHaveBeenCalledTimes(2);

      unsubscribe();
    });

    it("should not notify unsubscribed listeners", () => {
      const mockSubscriber = vi.fn();
      const unsubscribe = useAuthStore.subscribe(mockSubscriber);

      const { login } = useAuthStore.getState();

      unsubscribe();
      login(mockUser);

      expect(mockSubscriber).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle login with partial user data", () => {
      const partialUser = {
        id: "1",
        email: "test@example.com",
      } as User;

      const { login } = useAuthStore.getState();
      login(partialUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(partialUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it("should maintain referential equality for unchanged state", () => {
      const initialState = useAuthStore.getState();
      const { login, logout } = useAuthStore.getState();

      login(mockUser);
      logout();

      const finalState = useAuthStore.getState();

      expect(finalState.user).toBe(initialState.user);
      expect(finalState.isAuthenticated).toBe(initialState.isAuthenticated);
    });
  });
});
