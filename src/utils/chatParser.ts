
export interface ParsedConversations {
  [salesPerson: string]: {
    [customer: string]: {
      text: string;
      messages: string[];
    };
  };
}

// 定义一个别名映射表处理用户别名
const aliasMap: { [key: string]: string } = {
  'b923576674': 'tb923576674',
  'b7163256243': 'tb7163256243',
  '丽丽elly': '阿丽丽elly',
  'alexweng1213:sunny': 'alexweng1213'
};

const normalizeCustomerName = (name: string): string => {
  const normalized = name.trim();
  return aliasMap[normalized] || normalized;
};


export const parseChatLog = (logContent: string): ParsedConversations => {
  const lines = logContent.split('\n');
  const conversations: ParsedConversations = {};

  let currentCustomer: string | null = null;
  let currentSales: string | null = null;
  let currentMessages: string[] = [];

  const customerToServerPattern = /^(.*?) --> 精裕胶片:(.*?)(?:\d{2}:\d{2}:\d{2}|2025-\d{1,2}-\d{1,2} \d{2}:\d{2}:\d{2})/;
  const serverToCustomerPattern = /^精裕胶片:(.*?)(?:\d{2}:\d{2}:\d{2}|2025-\d{1,2}-\d{1,2} \d{2}:\d{2}:\d{2})/;
  const serverToCustomerPatternWithDate = /^\d{4}-\d{1,2}-\d{1,2} \d{2}:\d{2}:\d{2}精裕胶片:(.*)/;
  
  const flushConversation = () => {
    if (currentSales && currentCustomer && currentMessages.length > 0) {
      if (!conversations[currentSales]) {
        conversations[currentSales] = {};
      }
      if (!conversations[currentSales][currentCustomer]) {
        conversations[currentSales][currentCustomer] = { text: '', messages: [] };
      }
      conversations[currentSales][currentCustomer].messages.push(...currentMessages);
    }
    currentMessages = [];
  };

  for (const line of lines) {
    let match;
    let newCustomer: string | null = null;
    let newSales: string | null = null;

    if ((match = line.match(customerToServerPattern))) {
      newCustomer = normalizeCustomerName(match[1].trim());
      newSales = match[2].trim().split(' ')[0]; // 取客服名字，去掉可能跟在后面的时间
    } else if ((match = line.match(serverToCustomerPattern))) {
      newSales = match[1].trim().split(' ')[0];
      newCustomer = currentCustomer; // 假设客服回复的是当前客户
    } else if ((match = line.match(serverToCustomerPatternWithDate))) {
      newSales = match[1].trim().split(' ')[0];
      newCustomer = currentCustomer; // 假设客服回复的是当前客户
    }
    
    // 检查对话参与者是否变更
    const hasParticipantChanged = newSales && newCustomer && (newSales !== currentSales || newCustomer !== currentCustomer);

    if (hasParticipantChanged) {
      flushConversation();
      currentCustomer = newCustomer;
      currentSales = newSales;
    }

    // 只有当销售和客户都确定时才添加消息
    if (currentSales && currentCustomer) {
      currentMessages.push(line);
    }
  }

  flushConversation(); // 保存最后一段对话

  // 将聚合的消息数组转换为完整的文本块
  for (const sales in conversations) {
    for (const customer in conversations[sales]) {
      conversations[sales][customer].text = conversations[sales][customer].messages.join('\n');
    }
  }

  return conversations;
};
