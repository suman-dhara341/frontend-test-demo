export const handleError = async (
  message: string,
  details: Record<string, any> = {}
) => {
  console.error(
    JSON.stringify({
      level: "error",
      timestamp: new Date().toISOString(),
      message,
      ...details,
    })
  );
};
