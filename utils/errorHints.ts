
export interface ErrorHint {
  matcher: RegExp;
  hint: string;
  suggestion: string;
}

export const errorHints: ErrorHint[] = [
  {
    matcher: /Cannot read properties of (null|undefined)/i,
    hint: "This error occurs when you try to access a property (e.g., '.name') on a variable that is currently `null` or `undefined`.",
    suggestion: "Check why the variable is not being assigned a value. You might need to add a conditional check (e.g., `if (variable) { ... }`) before accessing its properties."
  },
  {
    matcher: /is not defined/i,
    hint: "This usually means you've tried to use a variable or function that hasn't been declared or is out of scope.",
    suggestion: "Check for typos in the variable name. Ensure it's declared with `let`, `const`, or `var` before use, or that it has been imported correctly."
  },
  {
    matcher: /Failed to fetch/i,
    hint: "This indicates a network request failed. It could be a problem with your internet connection, the server being down, or a CORS policy issue.",
    suggestion: "Check your network connection. Look at the Network tab in your browser's developer tools for more details on the failed request. If it's a CORS error, the server needs to be configured to allow requests from your origin."
  },
  {
    matcher: /invalid api key/i,
    hint: "The API key you are using is either incorrect, expired, or doesn't have the necessary permissions for the request.",
    suggestion: "Verify your API key is correct and has not been revoked. Check the API documentation for the correct way to provide the key."
  },
  {
    matcher: /Unexpected token '<' .* is not valid JSON/i,
    hint: "This often happens when the server returns an HTML error page (like a 404 or 500 error) instead of the expected JSON data.",
    suggestion: "Check the Network tab in your browser's developer tools to inspect the actual response from the server. The HTML content will likely tell you what went wrong."
  }
];
