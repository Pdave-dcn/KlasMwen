const formatMemberSince = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
  };
  const formattedDate = date.toLocaleDateString("en-US", options);
  return `Member since ${formattedDate}`;
};

export default formatMemberSince;
