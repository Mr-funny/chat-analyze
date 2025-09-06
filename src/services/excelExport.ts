import { AnalysisResult } from '../types';

// Excel导出服务
class ExcelExportService {
  // 导出分析结果为Excel
  static async exportAnalysisResult(result: AnalysisResult, filename: string = '客服分析报告.xlsx'): Promise<void> {
    try {
      // 创建CSV格式的数据
      const csvData = this.generateCSVData(result);
      
      // 创建Blob并下载
      const blob = new Blob(['\ufeff' + csvData], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.replace('.xlsx', '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excel导出失败:', error);
      throw new Error('Excel导出失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  }

  // 导出批量分析结果为Excel
  static async exportBatchResults(results: any[], filename: string = '批量分析结果.xlsx'): Promise<void> {
    try {
      const csvData = this.generateBatchCSVData(results);
      
      const blob = new Blob(['\ufeff' + csvData], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.replace('.xlsx', '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('批量Excel导出失败:', error);
      throw new Error('批量Excel导出失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  }

  // 生成单个分析结果的CSV数据
  private static generateCSVData(result: AnalysisResult): string {
    const lines: string[] = [];

    // 报告元数据
    lines.push('报告元数据');
    lines.push('标题,' + result.report_metadata.title);
    lines.push('日期,' + result.report_metadata.date);
    lines.push('客户总数,' + result.report_metadata.total_customers);
    lines.push('分析周期,' + result.report_metadata.analysis_period);
    lines.push('');

    // 执行摘要
    lines.push('执行摘要');
    lines.push('总体评分,' + result.executive_summary.overall_score);
    lines.push('响应率,' + result.executive_summary.key_metrics.response_rate);
    lines.push('态度评分,' + result.executive_summary.key_metrics.attitude_score);
    lines.push('销售技巧,' + result.executive_summary.key_metrics.sales_skills);
    lines.push('谈判能力,' + result.executive_summary.key_metrics.negotiation_ability);
    lines.push('');

    // 主要问题
    lines.push('主要问题');
    result.executive_summary.top_issues.forEach((issue, index) => {
      lines.push(`问题${index + 1},${issue}`);
    });
    lines.push('');

    // 客户分析
    lines.push('客户分析');
    lines.push('客户ID,对话摘要,总体评分,响应率,态度,销售技巧,谈判能力,问题数量,待办事项,亮点');
    
    result.customer_analysis.forEach(customer => {
      const issuesCount = customer.issues_found.length;
      const todos = customer.todos.join('; ');
      const highlights = customer.highlights.join('; ');
      
      lines.push([
        customer.customer_id,
        `"${customer.conversation_summary}"`,
        customer.score_breakdown.overall,
        customer.score_breakdown.response_rate,
        customer.score_breakdown.attitude,
        customer.score_breakdown.sales_skills,
        customer.score_breakdown.negotiation,
        issuesCount,
        `"${todos}"`,
        `"${highlights}"`
      ].join(','));
    });
    lines.push('');

    // 问题详情
    lines.push('问题详情');
    lines.push('客户ID,类别,问题描述,严重程度,证据,改进建议');
    
    result.customer_analysis.forEach(customer => {
      customer.issues_found.forEach(issue => {
        lines.push([
          customer.customer_id,
          issue.category,
          `"${issue.issue}"`,
          issue.severity,
          `"${issue.evidence}"`,
          `"${issue.suggestion}"`
        ].join(','));
      });
    });
    lines.push('');

    // 最佳实践
    lines.push('最佳实践');
    lines.push('场景,问题,解决方案,推荐话术');
    
    result.best_practices.forEach(practice => {
      lines.push([
        `"${practice.scenario}"`,
        `"${practice.problem}"`,
        `"${practice.solution}"`,
        `"${practice.script}"`
      ].join(','));
    });
    lines.push('');

    // 行动方案
    lines.push('行动方案');
    lines.push('类型,行动项目');
    
    result.action_plan.immediate.forEach(action => {
      lines.push(`立即行动,"${action}"`);
    });
    
    result.action_plan.short_term.forEach(action => {
      lines.push(`短期计划,"${action}"`);
    });
    
    result.action_plan.long_term.forEach(action => {
      lines.push(`长期规划,"${action}"`);
    });

    return lines.join('\n');
  }

  // 生成批量分析结果的CSV数据
  private static generateBatchCSVData(results: any[]): string {
    const lines: string[] = [];

    // 表头
    lines.push('文件名,总体评分,客户数量,分析日期,状态');

    // 数据行
    results.forEach(result => {
      lines.push([
        result.fileName,
        result.overallScore,
        result.customerCount,
        result.analysisDate,
        '已完成'
      ].join(','));
    });

    // 统计信息
    lines.push('');
    lines.push('统计信息');
    lines.push('总文件数,' + results.length);
    lines.push('平均评分,' + (results.reduce((sum, r) => sum + r.overallScore, 0) / results.length).toFixed(1));
    lines.push('总客户数,' + results.reduce((sum, r) => sum + r.customerCount, 0));

    return lines.join('\n');
  }

  // 导出报告历史为Excel
  static async exportReportHistory(reports: any[], filename: string = '报告历史.xlsx'): Promise<void> {
    try {
      const csvData = this.generateHistoryCSVData(reports);
      
      const blob = new Blob(['\ufeff' + csvData], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.replace('.xlsx', '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('报告历史导出失败:', error);
      throw new Error('报告历史导出失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  }

  // 生成报告历史的CSV数据
  private static generateHistoryCSVData(reports: any[]): string {
    const lines: string[] = [];

    // 表头
    lines.push('报告标题,文件名,生成日期,总体评分,客户数量,创建时间');

    // 数据行
    reports.forEach(report => {
      lines.push([
        `"${report.title}"`,
        report.fileName,
        report.date,
        report.result.executive_summary.overall_score,
        report.result.customer_analysis.length,
        new Date(report.createdAt).toLocaleString()
      ].join(','));
    });

    // 统计信息
    lines.push('');
    lines.push('统计信息');
    lines.push('总报告数,' + reports.length);
    lines.push('平均评分,' + (reports.reduce((sum, r) => sum + r.result.executive_summary.overall_score, 0) / reports.length).toFixed(1));
    lines.push('总客户数,' + reports.reduce((sum, r) => sum + r.result.customer_analysis.length, 0));

    return lines.join('\n');
  }

  // 检查浏览器兼容性
  static checkCompatibility(): { supported: boolean; message: string } {
    const isBlobSupported = typeof Blob !== 'undefined';
    const isURLSupported = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
    
    if (!isBlobSupported || !isURLSupported) {
      return {
        supported: false,
        message: '浏览器不支持文件下载功能'
      };
    }

    return {
      supported: true,
      message: '浏览器支持Excel导出'
    };
  }
}

export default ExcelExportService;
