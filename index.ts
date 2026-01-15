import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import wcwidth from "wcwidth";

// 1. 서버 인스턴스 생성
const server = new Server(
  {
    name: "ui-prototyper",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 2. 시각적 너비 계산 및 UI 생성 함수
function generateUI(title: string, lines: string[], width: number = 50): string {
  const padRight = (text: string, totalWidth: number) => {
    const currentWidth = wcwidth(text);
    return text + " ".repeat(Math.max(0, totalWidth - currentWidth));
  };

  const border = "─".repeat(width);
  let output = `┌─${border}─┐\n`;
  output += `│ ${padRight(`✨ ${title}`, width)} │\n`;
  output += `├─${border}─┤\n`;
  lines.forEach((line) => {
    output += `│ ${padRight(line, width)} │\n`;
  });
  output += `└─${border}─┘`;
  return output;
}

// 3. 도구 목록 등록
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "create_ui_prototype",
      description: "사용자의 요구사항을 바탕으로 ASCII UI 미리보기를 생성합니다.",
      inputSchema: {
        type: "object",
        properties: {
          requirements: { type: "string", description: "UI에 포함될 주요 내용" },
          concept: { type: "string", description: "디자인 컨셉" },
        },
        required: ["requirements"],
      },
    },
  ],
}));

// 4. 도구 실행 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "create_ui_prototype") {
    throw new Error("Unknown tool");
  }

  const requirements = String(request.params.arguments?.requirements || "");
  const concept = String(request.params.arguments?.concept || "기본 컨셉");

  // 예시 화면 구성 (실제로는 모델이 보낸 인자를 더 정교하게 처리 가능)
  const ui = generateUI(concept, [
    "요구사항 분석 결과:",
    `> ${requirements.substring(0, 35)}...`,
    "",
    "이 미리보기를 통해 기획의",
    "의도를 확인하고 수정을 결정하세요.",
    "",
    "[✅ 승인]  [❌ 수정]"
  ]);

  return {
    content: [
      {
        type: "text",
        text: `## 🎨 UI Prototype Preview\n\n\`\`\`text\n${ui}\n\`\`\``,
      },
    ],
  };
});

// 5. 서버 실행
const transport = new StdioServerTransport();
await server.connect(transport);
