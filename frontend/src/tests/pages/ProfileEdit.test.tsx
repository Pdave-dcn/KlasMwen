import { BrowserRouter, useNavigate } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ProfileEdit from "@/pages/ProfileEdit";
import { useAvatars } from "@/queries/avatar.query";
import { useProfileUser } from "@/queries/profile.query";
import { useUpdateUserInfo } from "@/queries/user.query";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock("@/queries/profile.query", () => ({
  useProfileUser: vi.fn(),
}));

vi.mock("@/queries/user.query", () => ({
  useUpdateUserInfo: vi.fn(),
}));

vi.mock("@/queries/avatar.query", () => ({
  useAvatars: vi.fn(),
}));

vi.mock("@/components/ui/spinner", () => ({
  Spinner: () => <div data-testid="spinner">Loading...</div>,
}));

const mockNavigate = vi.mocked(useNavigate);
const mockUseProfileUser = vi.mocked(useProfileUser);
const mockUseUpdateUserInfo = vi.mocked(useUpdateUserInfo);
const mockUseAvatars = vi.mocked(useAvatars);

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

const mockUser = {
  id: "a8e4fabb-429e-4532-bec5-e0e2c41abef5",
  username: "testUser",
  email: "testemail@gmail.com",
  bio: "Test bio",
  role: "STUDENT" as const,
  createdAt: "2025-09-17 01:27:27.827",
  avatar: {
    id: 1,
    url: "https://example.com/avatar1.jpg",
  },
};

const mockAvatarData = {
  pages: [
    {
      data: [
        {
          id: 1,
          url: "https://example.com/avatars/avatar-1.jpg",
        },
        {
          id: 2,
          url: "https://example.com/avatars/avatar-2.png",
        },
        {
          id: 3,
          url: "https://example.com/avatars/avatar-3.webp",
        },
      ],
      pagination: {
        hasMore: true,
        nextCursor: 4,
      },
    },
    {
      data: [
        {
          id: 4,
          url: "https://example.com/avatars/avatar-4.jpg",
        },
        {
          id: 5,
          url: "https://example.com/avatars/avatar-5.png",
        },
      ],
      pagination: {
        hasMore: false,
        nextCursor: null,
      },
    },
  ],
};

describe("ProfileEdit Component", () => {
  const mockNavigateFn = vi.fn();
  const mockMutate = vi.fn();

  beforeEach(() => {
    mockNavigate.mockReturnValue(mockNavigateFn);
    mockUseUpdateUserInfo.mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useUpdateUserInfo>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading States", () => {
    it("should show loading spinner when data is being fetched", () => {
      mockUseProfileUser.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useProfileUser>);

      render(
        <TestWrapper>
          <ProfileEdit />
        </TestWrapper>
      );

      expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });

    it("should show error message when data fetch fails", () => {
      mockUseProfileUser.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch"),
      } as unknown as ReturnType<typeof useProfileUser>);

      render(
        <TestWrapper>
          <ProfileEdit />
        </TestWrapper>
      );

      expect(
        screen.getByText("Failed to load user. Please try again later.")
      ).toBeInTheDocument();
    });
  });

  describe("Form Rendering and Initial Data", () => {
    beforeEach(() => {
      mockUseProfileUser.mockReturnValue({
        data: mockUser,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProfileUser>);
    });

    it("should render the profile edit form with user data", async () => {
      render(
        <TestWrapper>
          <ProfileEdit />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test bio")).toBeInTheDocument();
        expect(screen.getByText("@testUser")).toBeInTheDocument();
        expect(
          screen.getByText(/member since september 2025/i)
        ).toBeInTheDocument();
      });
    });

    it("should populate form fields with existing user data", async () => {
      render(
        <TestWrapper>
          <ProfileEdit />
        </TestWrapper>
      );

      await waitFor(() => {
        const bioTextarea = screen.getByLabelText("Bio");

        expect(bioTextarea).toHaveValue("Test bio");
      });
    });

    it("should display current avatar image", async () => {
      render(
        <TestWrapper>
          <ProfileEdit />
        </TestWrapper>
      );

      await waitFor(() => {
        const avatarImage = screen.queryByRole("img");

        if (avatarImage) {
          expect(avatarImage).toHaveAttribute(
            "src",
            "https://example.com/avatar1.jpg"
          );
        } else {
          expect(screen.getByText("TE")).toBeInTheDocument();
        }
      });
    });
  });

  describe("Avatar Modal Functionality", () => {
    beforeEach(() => {
      mockUseProfileUser.mockReturnValue({
        data: mockUser,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProfileUser>);

      mockUseAvatars.mockReturnValue({
        data: mockAvatarData,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useAvatars>);
    });

    it("should open avatar modal when change avatar button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProfileEdit />
        </TestWrapper>
      );

      await waitFor(() => {
        const changeAvatarButton = screen.getByText("Change Avatar");
        expect(changeAvatarButton).toBeInTheDocument();
      });

      await user.click(screen.getByText("Change Avatar"));
      expect(screen.getByText("Choose your new avatar")).toBeInTheDocument();
    });

    it("should close avatar modal when cancel button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProfileEdit />
        </TestWrapper>
      );

      await waitFor(() => {
        const changeAvatarButton = screen.getByText("Change Avatar");
        expect(changeAvatarButton).toBeInTheDocument();
      });

      await user.click(screen.getByText("Change Avatar"));
      expect(screen.getByText("Choose your new avatar")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(
        screen.queryByText("Choose your new avatar")
      ).not.toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    beforeEach(() => {
      mockUseProfileUser.mockReturnValue({
        data: mockUser,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProfileUser>);
    });

    it("should submit form with updated data", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProfileEdit />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test bio")).toBeInTheDocument();
      });

      const bioTextarea = screen.getByLabelText("Bio");
      await user.clear(bioTextarea);
      await user.type(bioTextarea, "Updated bio");

      await user.click(screen.getByText("Save Changes"));

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          bio: "Updated bio",
          avatarId: 1,
        })
      );

      expect(mockNavigateFn).toHaveBeenCalledWith("/profile/me");
    });

    it("should handle form submission with empty optional fields", async () => {
      const user = userEvent.setup();
      const userWithEmptyFields = {
        ...mockUser,
        bio: "",
      };

      mockUseProfileUser.mockReturnValue({
        data: userWithEmptyFields,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProfileUser>);

      render(
        <TestWrapper>
          <ProfileEdit />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText("Bio")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Save Changes"));

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          bio: "",
          avatarId: 1,
        })
      );
    });
  });

  describe("Navigation", () => {
    beforeEach(() => {
      mockUseProfileUser.mockReturnValue({
        data: mockUser,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProfileUser>);
    });

    it("should navigate to profile page when cancel button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProfileEdit />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Cancel")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Cancel"));

      expect(mockNavigateFn).toHaveBeenCalledWith("/profile/me", {
        replace: true,
      });
    });

    it("should navigate to profile page after successful form submission", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProfileEdit />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test bio")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Save Changes"));

      expect(mockNavigateFn).toHaveBeenCalledWith("/profile/me");
    });
  });
});
