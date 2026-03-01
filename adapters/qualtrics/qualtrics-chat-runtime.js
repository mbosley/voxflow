(function () {
  "use strict";

  function mergeConfig(defaults, overrides) {
    return Object.assign({}, defaults, overrides || {});
  }

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function buildStyles() {
    return `
      <style>
        .voxflow-chatbot-container {
          max-width: 820px;
          margin: 0 auto;
          padding: 18px;
          background: #f7f7f7;
          border-radius: 8px;
          border: 1px solid #e2e2e2;
          font-family: Arial, sans-serif;
        }
        .voxflow-chat-messages {
          height: 380px;
          overflow-y: auto;
          border: 1px solid #d8d8d8;
          border-radius: 6px;
          background: #fff;
          padding: 12px;
          margin-bottom: 12px;
        }
        .voxflow-message {
          max-width: 82%;
          padding: 10px 14px;
          margin-bottom: 10px;
          border-radius: 16px;
          clear: both;
          white-space: pre-wrap;
          word-wrap: break-word;
          line-height: 1.35;
        }
        .voxflow-assistant-message {
          float: left;
          background: #ececec;
          border-bottom-left-radius: 6px;
        }
        .voxflow-user-message {
          float: right;
          background: #dcf8c6;
          border-bottom-right-radius: 6px;
        }
        .voxflow-input {
          width: 100%;
          min-height: 96px;
          resize: vertical;
          border: 1px solid #d8d8d8;
          border-radius: 6px;
          padding: 10px;
          box-sizing: border-box;
          font-size: 16px;
          background: #fbfbfb;
        }
        .voxflow-controls {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
        }
        .voxflow-submit {
          background: #bdbbbb;
          border: none;
          border-radius: 4px;
          color: #222;
          padding: 10px 18px;
          font-size: 15px;
          cursor: pointer;
        }
        .voxflow-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .voxflow-error {
          display: none;
          margin-bottom: 10px;
          color: #b71c1c;
          background: #ffebee;
          border: 1px solid #ffcdd2;
          border-radius: 4px;
          padding: 10px;
        }
        .voxflow-typing {
          float: left;
          clear: both;
          margin-bottom: 10px;
          padding: 10px 14px;
          border-radius: 16px;
          border-bottom-left-radius: 6px;
          background: #ececec;
        }
        .voxflow-typing span {
          height: 8px;
          width: 8px;
          float: left;
          margin: 0 2px;
          background: #9e9ea1;
          border-radius: 50%;
          opacity: 0.4;
        }
        .voxflow-typing span:nth-of-type(1) { animation: voxflowBlink 1s infinite .2s; }
        .voxflow-typing span:nth-of-type(2) { animation: voxflowBlink 1s infinite .4s; }
        .voxflow-typing span:nth-of-type(3) { animation: voxflowBlink 1s infinite .6s; }
        @keyframes voxflowBlink { 50% { opacity: 1; } }
      </style>
    `;
  }

  Qualtrics.SurveyEngine.addOnload(function () {
    var question = this;
    var questionId = String(question.questionId || "unknown");

    var defaults = {
      conversationField: "convo_history",
      apiErrorField: "API_Error",
      maxTurns: 6,
      typingDelayMs: 1200,
      errorDelayMs: 5000,
      chatEndpoint: null,
      endpointHeaders: {},
      localDraftKeyPrefix: "voxflow_qualtrics_draft_",
      initialAssistantMessage: "Hi there! Thanks for taking this survey.",
      getSystemPrompt: function () {
        return "";
      },
      buildUserProfile: function () {
        return "";
      },
      getMetadata: function () {
        return {};
      }
    };

    var config = mergeConfig(defaults, window.VOXFLOW_QUALTRICS_CONFIG || {});
    var draftKey = config.localDraftKeyPrefix + questionId;
    var state = {
      messages: [],
      isBusy: false,
      completed: false
    };

    function getEmbeddedDataSafe(fieldName) {
      try {
        return Qualtrics.SurveyEngine.getEmbeddedData(fieldName) || null;
      } catch (error) {
        console.warn("[voxflow] failed getEmbeddedData:", fieldName, error);
        return null;
      }
    }

    function setEmbeddedDataSafe(fieldName, value) {
      try {
        Qualtrics.SurveyEngine.setEmbeddedData(fieldName, value);
      } catch (error) {
        console.warn("[voxflow] failed setEmbeddedData:", fieldName, error);
      }
    }

    function turnsUsed() {
      return Math.floor(
        state.messages.filter(function (msg) {
          return msg.role === "user";
        }).length
      );
    }

    function persistConversation() {
      setEmbeddedDataSafe(config.conversationField, JSON.stringify(state.messages));
    }

    function restoreOrInitializeConversation() {
      var existing = getEmbeddedDataSafe(config.conversationField);
      var restored = existing ? safeJsonParse(existing, null) : null;
      if (Array.isArray(restored) && restored.length > 0) {
        state.messages = restored;
        return;
      }

      state.messages = [
        { role: "system", content: String(config.getSystemPrompt() || "") },
        { role: "user", content: String(config.buildUserProfile() || "") },
        { role: "assistant", content: String(config.initialAssistantMessage || "") }
      ];
      persistConversation();
    }

    function buildPayload(userText, isFinalTurn) {
      return {
        messages: state.messages.slice(),
        userMessage: userText,
        isFinalTurn: !!isFinalTurn,
        maxTurns: config.maxTurns,
        metadata: config.getMetadata ? config.getMetadata() : {}
      };
    }

    function requestAssistantReply(userText, isFinalTurn) {
      return fetch(config.chatEndpoint, {
        method: "POST",
        headers: mergeConfig(
          {
            "Content-Type": "application/json"
          },
          config.endpointHeaders || {}
        ),
        body: JSON.stringify(buildPayload(userText, isFinalTurn))
      }).then(function (response) {
        if (!response.ok) {
          throw new Error("chat endpoint failed with status " + response.status);
        }
        return response.json();
      }).then(function (json) {
        var message = json.assistantMessage || json.message || "";
        if (!message) {
          throw new Error("chat endpoint returned empty assistant message");
        }
        return String(message);
      });
    }

    jQuery("head").append(buildStyles());
    question.disableNextButton();
    jQuery(".QuestionBody").empty();

    var container = jQuery("<div>").addClass("voxflow-chatbot-container").appendTo(jQuery(".QuestionBody"));
    var errorBox = jQuery("<div>").addClass("voxflow-error").appendTo(container);
    var messagesBox = jQuery("<div>").addClass("voxflow-chat-messages").attr("aria-live", "polite").appendTo(container);
    var input = jQuery("<textarea>")
      .addClass("voxflow-input")
      .attr({ placeholder: "Type your response here...", "aria-label": "Your response" })
      .appendTo(container);
    var controls = jQuery("<div>").addClass("voxflow-controls").appendTo(container);
    var submit = jQuery("<button>").addClass("voxflow-submit").attr({ type: "button" }).text("Submit").appendTo(controls);
    var typing = jQuery("<div>").addClass("voxflow-typing").html("<span></span><span></span><span></span>").hide();

    function addMessage(content, isUser) {
      jQuery("<div>")
        .addClass("voxflow-message")
        .addClass(isUser ? "voxflow-user-message" : "voxflow-assistant-message")
        .text(String(content || ""))
        .appendTo(messagesBox);
      messagesBox.scrollTop(messagesBox[0].scrollHeight);
    }

    function showTyping() {
      typing.appendTo(messagesBox).show();
      messagesBox.scrollTop(messagesBox[0].scrollHeight);
    }

    function hideTyping() {
      typing.detach();
    }

    function showError(text) {
      errorBox.text(String(text || "An error occurred.")).stop(true, true).fadeIn();
      setTimeout(function () {
        errorBox.fadeOut();
      }, config.errorDelayMs);
    }

    function setBusy(value) {
      state.isBusy = !!value;
      submit.prop("disabled", state.isBusy || state.completed);
      input.prop("disabled", state.isBusy || state.completed);
      submit.text(state.isBusy ? "Submitting..." : "Submit");
    }

    function endConversation() {
      state.completed = true;
      question.enableNextButton();
      setBusy(false);
      input.val("");
    }

    function renderConversation() {
      messagesBox.empty();
      state.messages.forEach(function (msg, index) {
        if (index < 2 || msg.role === "system") {
          return;
        }
        addMessage(msg.content, msg.role === "user");
      });
    }

    restoreOrInitializeConversation();
    renderConversation();

    if (!config.chatEndpoint) {
      showError("Configuration error: missing chatEndpoint.");
      submit.prop("disabled", true);
      input.prop("disabled", true);
      return;
    }

    var draft = localStorage.getItem(draftKey);
    if (draft) {
      input.val(draft);
    }

    input.on("input", function () {
      localStorage.setItem(draftKey, jQuery(this).val());
    });

    input.on("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submit.click();
      }
    });

    submit.on("click", function () {
      if (state.isBusy || state.completed) {
        return;
      }

      var userText = String(input.val() || "").trim();
      if (!userText) {
        showError("Please enter a response before submitting.");
        return;
      }

      var finalTurn = turnsUsed() >= config.maxTurns;
      setBusy(true);
      addMessage(userText, true);
      input.val("");
      localStorage.setItem(draftKey, "");

      state.messages.push({ role: "user", content: userText });
      persistConversation();
      showTyping();

      setTimeout(function () {
        requestAssistantReply(userText, finalTurn)
          .then(function (assistantText) {
            hideTyping();
            addMessage(assistantText, false);
            state.messages.push({ role: "assistant", content: assistantText });
            persistConversation();
            setBusy(false);

            if (finalTurn) {
              endConversation();
            }
          })
          .catch(function (error) {
            hideTyping();
            console.error("[voxflow] chat endpoint error:", error);
            showError("An error occurred. Please try again or contact the survey administrator.");
            setEmbeddedDataSafe(config.apiErrorField, "true");
            setBusy(false);
          });
      }, config.typingDelayMs);
    });

    input.focus();
  });
})();
