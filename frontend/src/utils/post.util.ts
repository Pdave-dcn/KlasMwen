const getTypeDisplayName = (type: string) => {
  switch (type) {
    case "NOTE":
      return "Note";
    case "QUESTION":
      return "Question";
    case "RESOURCE":
      return "Resource";
    default:
      return type;
  }
};

export { getTypeDisplayName };
