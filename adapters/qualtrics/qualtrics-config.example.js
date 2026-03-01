/*
  Qualtrics page-level configuration for voxflow adapter.

  IMPORTANT:
  - Never place provider API keys in this file.
  - `chatEndpoint` must point to your own server-side proxy.
*/
window.VOXFLOW_QUALTRICS_CONFIG = {
  conversationField: "convo_history",
  apiErrorField: "API_Error",
  maxTurns: 6,
  typingDelayMs: 1200,
  errorDelayMs: 5000,

  // Your secure backend endpoint, not OpenAI directly.
  chatEndpoint: "https://your-backend.example.com/qualtrics/chat",
  endpointHeaders: {
    "X-Study-Id": "replace-me"
  },

  initialAssistantMessage: "Hi there! Thanks for taking this survey.",

  getSystemPrompt: function () {
    return "You are a concise, respectful assistant for a survey conversation.";
  },

  buildUserProfile: function () {
    return [
      "Participant Profile",
      "Age: ${q://QID31/ChoiceGroup/SelectedChoices}",
      "Political ideology: ${q://QID1718057541/ChoiceNumericEntryValue/1}"
    ].join("\n");
  },

  getMetadata: function () {
    return {
      responseId: "${e://Field/ResponseID}",
      surveyId: "${e://Field/SurveyID}",
      condition: "${e://Field/condition}"
    };
  }
};
