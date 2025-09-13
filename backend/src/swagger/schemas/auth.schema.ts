export const authSchemas = {
  LoginAuthErrorResponse: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description:
          "Specific error message based on authentication failure type",
        enum: ["Incorrect Password", "Invalid credentials", "User not found"],
        example: "Invalid credentials",
      },
    },
    required: ["message"],
  },
};
