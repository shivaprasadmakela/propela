import { GoogleGenerativeAI, SchemaType, type Tool } from '@google/generative-ai';
import { agentTools } from './agentTools';
import { type Message } from '../store/agentStore';

const SYSTEM_INSTRUCTIONS = `
You are Propela's Sales & Operations Agent. You have access to Propela's live CRM database via tools. 
Your main responsibilities are:
1. Help users list, search, view, create, or update deals (tickets).
2. Fetch tasks, notes, or activity logs related to a specific deal.
3. Help users with general queries, questions, or formatting requests.

Formatting guidelines:
- Avoid printing long, repetitious text lists of deals, tasks, notes, or activity logs in your chat response. The frontend chat interface will automatically render visual card components for lists (such as the output of list_deals, list_deal_tasks, list_deal_notes, or list_deal_activities) right below your message bubble.
- You MUST still write a conversational text response: state the summary, answer any specific questions (like counting the number of deals, comparing counts, or explaining analytics), and direct the user to look at the cards below for details if relevant.
- When answering queries about counts (e.g., "how many deals..."), count the elements in the JSON array returned by the tool exactly and double-check your arithmetic. The count in your text response MUST match the actual number of items returned by the tool (which is displayed in the UI cards).
- If a tool call returns an empty array ([]) or no results, do NOT repeat the same tool call with the same parameters. Accept that no records match the criteria, and write a friendly text response informing the user that no matches were found (e.g. "I couldn't find any deals matching those criteria.").
- Always be professional, crisp, and helpful. If a user asks general questions, answer them, but gently relate them back to how you can help them in Propela if relevant.
`;

const GEMINI_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "list_deals",
        description: "List or search for deals/leads. You can apply multiple filters simultaneously: 1) search (keywords matching name/code), 2) stageName (e.g. 'Booking', 'Follow Up'), 3) timeframe ('today', 'yesterday', 'this_week', 'all'), 4) assignedUserName (e.g. 'Angel Mary'), 5) source (e.g. 'Google', 'Facebook'), and 6) productName (e.g. 'CityVille').",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            search: {
              type: SchemaType.STRING,
              description: "Optional search text matching deal name or code."
            },
            stageName: {
              type: SchemaType.STRING,
              description: "Optional stage name to filter deals."
            },
            timeframe: {
              type: SchemaType.STRING,
              format: "enum",
              description: "Optional timeframe filter: 'today', 'yesterday', 'this_week', or 'all'.",
              enum: ["today", "yesterday", "this_week", "all"]
            },
            assignedUserName: {
              type: SchemaType.STRING,
              description: "Optional assignee name to filter deals by (e.g., 'Angel Mary')."
            },
            source: {
              type: SchemaType.STRING,
              description: "Optional marketing source to filter deals by (e.g. 'Google', 'Facebook')."
            },
            productName: {
              type: SchemaType.STRING,
              description: "Optional product name to filter deals by (e.g. 'CityVille')."
            }
          }
        }
      },
      {
        name: "get_deals_by_source_analytics",
        description: "Get analytics on deal counts grouped by marketing source (e.g., Google, Facebook, Direct). You can filter the counts using multiple options simultaneously: stageName, assignedUserName, timeframe, or productName.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            stageName: {
              type: SchemaType.STRING,
              description: "Optional workflow stage name to filter the deal counts by (e.g. 'Booking')."
            },
            assignedUserName: {
              type: SchemaType.STRING,
              description: "Optional assignee name to filter the counts by (e.g. 'Angel Mary')."
            },
            timeframe: {
              type: SchemaType.STRING,
              format: "enum",
              description: "Optional timeframe to filter the counts by: 'today', 'yesterday', 'this_week', or 'all'.",
              enum: ["today", "yesterday", "this_week", "all"]
            },
            productName: {
              type: SchemaType.STRING,
              description: "Optional product name to filter the counts by (e.g. 'CityVille')."
            }
          }
        }
      },
      {
        name: "get_deal_details",
        description: "Retrieve complete info for a single deal/lead using its unique code (e.g., TKT12345). Use this when the user asks about a specific deal or wants details for a deal.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            code: {
              type: SchemaType.STRING,
              description: "The unique deal code."
            }
          },
          required: ["code"]
        }
      },
      {
        name: "create_deal",
        description: "Create a new deal or lead in Propela.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING, description: "Customer or Deal Name." },
            phoneNumber: { type: SchemaType.STRING, description: "Customer dial phone number." },
            email: { type: SchemaType.STRING, description: "Customer email address." },
            productId: { type: SchemaType.NUMBER, description: "Associated Product Database ID." },
            source: { type: SchemaType.STRING, description: "Marketing source (e.g., 'Google', 'Facebook')." },
            subSource: { type: SchemaType.STRING, description: "Sub-source details." }
          },
          required: ["name", "phoneNumber", "email", "productId", "source", "subSource"]
        }
      },
      {
        name: "update_deal_stage",
        description: "Move a deal to a new workflow stage using its ID and target stage ID.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            dealId: { type: SchemaType.NUMBER, description: "Database ID of the deal." },
            stageId: { type: SchemaType.NUMBER, description: "Database ID of the target stage." }
          },
          required: ["dealId", "stageId"]
        }
      },
      {
        name: "list_deal_tasks",
        description: "List tasks and to-dos linked to a deal by specifying its database ID.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            dealId: { type: SchemaType.NUMBER, description: "Database ID of the deal." }
          },
          required: ["dealId"]
        }
      },
      {
        name: "list_deal_notes",
        description: "List notes and annotations linked to a deal by specifying its database ID.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            dealId: { type: SchemaType.NUMBER, description: "Database ID of the deal." }
          },
          required: ["dealId"]
        }
      },
      {
        name: "list_deal_activities",
        description: "List activity logs, history, and updates linked to a deal by specifying its database ID.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            dealId: { type: SchemaType.NUMBER, description: "Database ID of the deal." }
          },
          required: ["dealId"]
        }
      }
    ]
  }
];

export const agentService = {
  /**
   * Run the multi-turn agent chat conversation loop.
   */
  chat: async (
    userText: string,
    history: Message[],
    apiKey: string,
    onToolExecute?: (toolName: string, data: any) => void
  ): Promise<{ text: string; toolsData?: { toolName: string; data: any; status: 'success' | 'error' } }> => {
    if (!apiKey) {
      return {
        text: "Please set your Gemini API Key in the settings or in your `.env.local` as `VITE_GEMINI_API_KEY` to enable the AI Agent."
      };
    }

    try {
      const fallbackModels = [
        'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-2.0-flash',
      'gemini-3.5-flash'
    ];

    let lastError: any = null;

    for (let i = 0; i < fallbackModels.length; i++) {
      const modelName = fallbackModels[i];
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTIONS,
          tools: GEMINI_TOOLS
        });

        // Prepare Gemini contents parameter from our message history
        // We only include user and model text parts or function results
        const contents: any[] = [];

        // Avoid double-appending the latest user query if it is already the last element in history
        const historyToProcess = (history.length > 0 &&
          history[history.length - 1].role === 'user' &&
          history[history.length - 1].content === userText)
            ? history.slice(0, -1)
            : history;

        for (const msg of historyToProcess) {
          if (msg.role === 'system') continue;
          
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          });
        }

        // Append the latest user query
        contents.push({
          role: 'user',
          parts: [{ text: userText }]
        });

        // Invoke Gemini
        let result = await model.generateContent({ contents });
        let response = result.response;
        let functionCalls = response.functionCalls();

        let lastExecutedTool: { toolName: string; data: any; status: 'success' | 'error' } | undefined;

        // Handle the function calling loop (Agent loop)
        let loopCount = 0;
        const MAX_LOOPS = 5; // Prevent infinite tool call loops

        while (functionCalls && functionCalls.length > 0 && loopCount < MAX_LOOPS) {
          loopCount++;
          const call = functionCalls[0];
          const { name, args } = call;

          // Add the model's exact candidate parts (which preserves the mandatory thought_signature)
          contents.push({
            role: 'model',
            parts: response.candidates?.[0]?.content?.parts || [{ functionCall: call }]
          });

          let toolResult: any;

          try {
            // Execute the tool locally
            if (name in agentTools) {
              toolResult = await (agentTools as any)[name](args);
            } else {
              throw new Error(`Tool [${name}] is not implemented`);
            }

            if (onToolExecute) {
              onToolExecute(name, toolResult);
            }
            lastExecutedTool = { toolName: name, data: toolResult, status: 'success' };
          } catch (error: any) {
            toolResult = { error: error?.message || 'Tool execution failed' };
            lastExecutedTool = { toolName: name, data: toolResult, status: 'error' };
          }

          // Add the tool's result to the history to send back to the model
          contents.push({
            role: 'user',
            parts: [{
              functionResponse: {
                name: name,
                response: { result: toolResult }
              }
            }]
          });

          // Query LLM again with the tool response
          result = await model.generateContent({ contents });
          response = result.response;
          functionCalls = response.functionCalls();
        }

        console.log("AGENT RESPONSE:", JSON.stringify(response, null, 2));

        let responseText = "";
        try {
          responseText = response.text() || "";
        } catch {}

        // Fallback if the model returned an empty text response (e.g. tool loop termination or safety filters)
        if (!responseText.trim()) {
          if (lastExecutedTool) {
            const { toolName, data, status } = lastExecutedTool;
            if (status === 'error') {
              responseText = `I encountered an issue executing the request: ${data?.error || 'Unknown error'}.`;
            } else if (toolName === 'list_deals') {
              const count = Array.isArray(data) ? data.length : 0;
              responseText = `I found ${count} deal${count === 1 ? '' : 's'} matching your request. You can view them below:`;
            } else if (toolName === 'get_deals_by_source_analytics') {
              const entries = Object.entries(data || {});
              if (entries.length === 0) {
                responseText = "I couldn't find any deals for the specified criteria, so all marketing source counts are zero.";
              } else {
                const summary = entries.map(([src, val]) => `${src}: ${val}`).join(', ');
                responseText = `Here is the marketing source breakdown for those deals: ${summary}.`;
              }
            } else if (toolName === 'get_deal_details') {
              responseText = `Here are the details for the requested deal:`;
            } else {
              responseText = `I have successfully processed your request. Please check the results:`;
            }
          } else {
            responseText = "I have successfully processed your request.";
          }
        }

        return {
          text: responseText,
          toolsData: lastExecutedTool
        };

      } catch (err: any) {
        console.warn(`Model ${modelName} failed:`, err);
        lastError = err;

        // Check if the error indicates a rate limit / quota / 429 error
        const errMsg = err?.message || '';
        const isRateLimit = errMsg.includes('429') || 
                            errMsg.toLowerCase().includes('quota') || 
                            errMsg.toLowerCase().includes('rate limit') || 
                            errMsg.toLowerCase().includes('rate_limit') ||
                            errMsg.toLowerCase().includes('exceeded your current quota');

        if (isRateLimit && i < fallbackModels.length - 1) {
          console.warn(`Rate limit hit on ${modelName}. Falling back to next model...`);
          continue; // Try the next model
        }

        // If it's not a rate limit error, or if we have run out of models, throw the error
        throw err;
      }
    }

    throw lastError || new Error("All fallback models failed.");

    } catch (error: any) {
      console.error('AI Agent loop failed:', error);
      
      // Dynamic diagnostics to fetch actual available model list
      let diagInfo = "";
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (res.ok) {
          const data = await res.json();
          const list = data.models?.map((m: any) => m.name.replace("models/", "")) || [];
          diagInfo = `\n\n**Available models on your API Key:**\n${list.map((n: string) => `- \`${n}\``).join("\n")}`;
        }
      } catch {
        diagInfo = "\n\n(Unable to query available models list)";
      }

      return {
        text: `Error interacting with AI: ${error?.message || 'Unknown error occurred.'}${diagInfo}`,
        toolsData: undefined
      };
    }
  }
};
